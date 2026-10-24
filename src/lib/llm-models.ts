import { getOptionalEnv } from '@/lib/env';

export const DEFAULT_GEMINI_PRIMARY_MODEL = 'gemini-2.5-flash';
export const DEFAULT_GEMINI_VISION_MODEL = 'gemini-3.1-flash-lite';
export const DEFAULT_GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';

const FLASH_FALLBACK_CANDIDATES = [
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
] as const;

const DEPRECATION_ERROR_PATTERN =
  /model[_\s-]*not[_\s-]*found|not found for api version|is not supported for (?:generateContent|embedContent)|model .* (?:is|has been) (?:deprecated|retired|discontinued|shut down)|no longer available/i;

const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1_000; // 6 hours per model
const MODEL_LIST_CACHE_TTL_MS = 10 * 60 * 1_000; // 10 minutes

const deprecatedModelsInProcess = new Map<string, { detectedAt: number; reason: string }>();
const lastAlertSentAt = new Map<string, number>();

type LiveModelsCache = {
  expiresAt: number;
  modelNames: Set<string>;
};

let liveModelsCache: LiveModelsCache | null = null;

export function getGeminiPrimaryModel(): string {
  return getOptionalEnv('GEMINI_PRIMARY_MODEL', DEFAULT_GEMINI_PRIMARY_MODEL);
}

export function getGeminiVisionModel(): string {
  return getOptionalEnv('GEMINI_VISION_MODEL', DEFAULT_GEMINI_VISION_MODEL);
}

export function getGeminiEmbeddingModel(): string {
  return getOptionalEnv('GEMINI_EMBEDDING_MODEL', DEFAULT_GEMINI_EMBEDDING_MODEL);
}

/**
 * Returns an ordered, deduplicated list of Gemini Flash models to try.
 * Models already flagged as deprecated/404 in this process are moved to the end.
 */
export function getGeminiFlashFallbackChain(preferredModel?: string): string[] {
  const first = (preferredModel || getGeminiVisionModel()).trim();
  const raw = [first, ...FLASH_FALLBACK_CANDIDATES].filter((m) => m.length > 0);
  const unique = [...new Set(raw)];
  const active = unique.filter((m) => !deprecatedModelsInProcess.has(m));
  const flagged = unique.filter((m) => deprecatedModelsInProcess.has(m));
  return [...active, ...flagged];
}

export function isModelDeprecationError(httpStatus: number, responseText: string): boolean {
  if (httpStatus === 404) return true;
  if (httpStatus === 400 || httpStatus === 410 || httpStatus === 502 || httpStatus === 500) {
    return DEPRECATION_ERROR_PATTERN.test(responseText);
  }
  return DEPRECATION_ERROR_PATTERN.test(responseText);
}

export async function reportModelDeprecationError(input: {
  model: string;
  httpStatus?: number;
  detail?: string;
  fallbackModel?: string;
  source?: string;
}): Promise<void> {
  const model = input.model.trim() || 'unknown-model';
  const reason = (input.detail || `HTTP ${input.httpStatus ?? 'error'}`).slice(0, 240);
  deprecatedModelsInProcess.set(model, { detectedAt: Date.now(), reason });

  console.error(
    `[LLMModelGuard] Model deprecation/unavailability detected for "${model}" (${input.source || 'runtime'}): ${reason}` +
      (input.fallbackModel ? ` -> falling back to "${input.fallbackModel}"` : ''),
  );

  const now = Date.now();
  const prevAlert = lastAlertSentAt.get(model) ?? 0;
  if (now - prevAlert < ALERT_COOLDOWN_MS) {
    return;
  }
  lastAlertSentAt.set(model, now);

  if (process.env.NODE_ENV === 'test' || process.env.CRAWL_DRY_RUN === 'true') {
    return;
  }

  const topic = getOptionalEnv('NTFY_TOPIC', 'fpv-rag-alerts');
  const ntfyUrl = getOptionalEnv('NTFY_URL', `https://ntfy.sh/${topic}`);
  const messageLines = [
    `Model: ${model}`,
    `Source: ${input.source || 'fpvlovers-web'}`,
    input.fallbackModel ? `Auto-Fallback: ${input.fallbackModel}` : 'Auto-Fallback: none (check Dify workflow config)',
    `Detail: ${reason}`,
  ];

  try {
    await fetch(ntfyUrl, {
      method: 'POST',
      headers: {
        Title: `FPVLovers LLM Model Alert: ${model}`,
        Priority: 'high',
        Tags: 'warning,robot',
      },
      body: messageLines.join('\n'),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // Non-blocking alert; ignore network errors to ntfy.sh
  }
}

export type GeminiModelHealthReport = {
  status: 'up' | 'down';
  latencyMs: number;
  configuredModels: {
    primary: string;
    vision: string;
    embedding: string;
  };
  missingModels: string[];
  activeFallback?: string;
  detail: string;
};

export async function checkGeminiModelsHealth(): Promise<GeminiModelHealthReport> {
  const startedAt = Date.now();
  const configuredModels = {
    primary: getGeminiPrimaryModel(),
    vision: getGeminiVisionModel(),
    embedding: getGeminiEmbeddingModel(),
  };

  const flaggedInProcess = [
    configuredModels.primary,
    configuredModels.vision,
    configuredModels.embedding,
  ].filter((m, idx, arr) => arr.indexOf(m) === idx && deprecatedModelsInProcess.has(m));

  const apiKey = getOptionalEnv('GEMINI_API_KEY', '');
  if (!apiKey) {
    if (flaggedInProcess.length > 0) {
      const chain = getGeminiFlashFallbackChain(configuredModels.vision);
      return {
        status: 'down',
        latencyMs: Date.now() - startedAt,
        configuredModels,
        missingModels: flaggedInProcess,
        activeFallback: chain[0],
        detail: `Deprecated/unavailable model detected at runtime: ${flaggedInProcess.join(', ')}`,
      };
    }

    return {
      status: 'up',
      latencyMs: Date.now() - startedAt,
      configuredModels,
      missingModels: [],
      detail: `Primary: ${configuredModels.primary} · Vision: ${configuredModels.vision} · Fallback chain ready (${FLASH_FALLBACK_CANDIDATES.length} models)`,
    };
  }

  try {
    let modelNames = liveModelsCache && liveModelsCache.expiresAt > Date.now()
      ? liveModelsCache.modelNames
      : null;

    if (!modelNames) {
      const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', {
        headers: { 'x-goog-api-key': apiKey },
        signal: AbortSignal.timeout(6_000),
      });

      if (!resp.ok) {
        return {
          status: 'down',
          latencyMs: Date.now() - startedAt,
          configuredModels,
          missingModels: [],
          detail: `Google Models API HTTP ${resp.status}`,
        };
      }

      const payload = (await resp.json()) as { models?: Array<{ name?: string }> };
      modelNames = new Set(
        (payload.models || [])
          .map((m) => String(m.name || '').replace(/^models\//, '').trim())
          .filter(Boolean),
      );
      liveModelsCache = {
        expiresAt: Date.now() + MODEL_LIST_CACHE_TTL_MS,
        modelNames,
      };
    }

    const requiredUnique = [...new Set([
      configuredModels.primary,
      configuredModels.vision,
      configuredModels.embedding,
    ])];

    const missingModels = requiredUnique.filter((m) => !modelNames!.has(m));
    const activeFallback = FLASH_FALLBACK_CANDIDATES.find((m) => modelNames!.has(m));

    if (missingModels.length > 0) {
      for (const missing of missingModels) {
        await reportModelDeprecationError({
          model: missing,
          detail: `Model "${missing}" is no longer listed in Google v1beta/models`,
          fallbackModel: activeFallback,
          source: 'health-check',
        });
      }

      return {
        status: 'down',
        latencyMs: Date.now() - startedAt,
        configuredModels,
        missingModels,
        activeFallback,
        detail: `Retired/missing on Google API: ${missingModels.join(', ')}${activeFallback ? ` · Active fallback: ${activeFallback}` : ''}`,
      };
    }

    return {
      status: 'up',
      latencyMs: Date.now() - startedAt,
      configuredModels,
      missingModels: [],
      activeFallback,
      detail: `Verified live on Google API: ${requiredUnique.join(', ')}`,
    };
  } catch (err: unknown) {
    return {
      status: flaggedInProcess.length > 0 ? 'down' : 'up',
      latencyMs: Date.now() - startedAt,
      configuredModels,
      missingModels: flaggedInProcess,
      detail: `Model guard active (${configuredModels.primary} / ${configuredModels.vision}); live check skipped: ${err instanceof Error ? err.message : 'timeout'}`,
    };
  }
}
