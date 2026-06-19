import { getOptionalEnv } from '@/lib/env';
import { runWorkflow } from '@/lib/dify-client';
import type { SocialFactPack } from '@/lib/social/types';
import {
  validateVideoManifest,
  type VideoManifest,
  type VideoScene,
} from '@/lib/video/video-manifest';

export type VideoDirectorResult = {
  manifest: VideoManifest;
  source: 'dify' | 'deterministic-fallback';
  workflowRunId?: string;
  tokens?: number;
};

function fallbackScenes(factPack: SocialFactPack): VideoScene[] {
  const first = factPack.facts[0];
  const support = factPack.facts.slice(1, 4);
  return [
    {
      id: 'hook',
      startSeconds: 0,
      endSeconds: 8,
      narration: first?.text || factPack.title,
      onScreenText: factPack.title,
      factIds: first ? [first.id] : [],
      assetRefs: ['brand://comparison-grid'],
    },
    {
      id: 'decision',
      startSeconds: 8,
      endSeconds: 40,
      narration: support.map((fact) => fact.text).join(' '),
      onScreenText: 'Check fit, compatibility, and upgrade path',
      factIds: support.map((fact) => fact.id),
      assetRefs: ['brand://decision-matrix'],
    },
    {
      id: 'cta',
      startSeconds: 40,
      endSeconds: 45,
      narration: 'Read the full source-aware guide on FPVLovers.',
      onScreenText: 'Full guide: FPVLovers',
      factIds: [],
      assetRefs: ['brand://end-card'],
    },
  ];
}

export function buildDeterministicVideoManifest(
  factPack: SocialFactPack,
  requiresHumanApproval: boolean,
): VideoManifest {
  return {
    version: 1,
    sourceSlug: factPack.sourceSlug,
    contentClass: factPack.contentType,
    requiresHumanApproval,
    language: 'en',
    aspectRatio: '9:16',
    targetDurationSeconds: 45,
    facts: factPack.facts,
    scenes: fallbackScenes(factPack),
    cta: 'Read the full guide on FPVLovers.',
    disclosures: factPack.commercialDisclosureRequired
      ? ['Specification-based editorial content. Links may be affiliate links.']
      : [],
    containsSyntheticMedia: true,
    paidProductPlacement: false,
    uploadVisibility: 'private',
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function parseDifyManifest(value: unknown, factPack: SocialFactPack): VideoManifest | null {
  let candidate = value;
  if (typeof candidate === 'string') {
    const json = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] || candidate;
    try {
      candidate = JSON.parse(json);
    } catch {
      return null;
    }
  }
  const record = asRecord(candidate);
  if (!record || !Array.isArray(record.scenes)) return null;

  const scenes: VideoScene[] = [];
  for (const sceneValue of record.scenes) {
    const scene = asRecord(sceneValue);
    if (!scene
      || typeof scene.id !== 'string'
      || typeof scene.startSeconds !== 'number'
      || typeof scene.endSeconds !== 'number'
      || typeof scene.narration !== 'string'
      || typeof scene.onScreenText !== 'string'
      || !Array.isArray(scene.factIds)
      || !scene.factIds.every((id) => typeof id === 'string')
      || !Array.isArray(scene.assetRefs)
      || !scene.assetRefs.every((asset) => typeof asset === 'string')) return null;
    scenes.push({
      id: scene.id,
      startSeconds: scene.startSeconds,
      endSeconds: scene.endSeconds,
      narration: scene.narration,
      onScreenText: scene.onScreenText,
      factIds: scene.factIds as string[],
      assetRefs: scene.assetRefs as string[],
    });
  }

  return {
    version: 1,
    sourceSlug: factPack.sourceSlug,
    contentClass: factPack.contentType,
    requiresHumanApproval: record.requiresHumanApproval === true,
    language: 'en',
    aspectRatio: '9:16',
    targetDurationSeconds: typeof record.targetDurationSeconds === 'number'
      ? record.targetDurationSeconds
      : 45,
    facts: factPack.facts,
    scenes,
    cta: typeof record.cta === 'string' ? record.cta : 'Read the full guide on FPVLovers.',
    disclosures: Array.isArray(record.disclosures)
      ? record.disclosures.filter((item): item is string => typeof item === 'string')
      : [],
    containsSyntheticMedia: true,
    paidProductPlacement: record.paidProductPlacement === true,
    uploadVisibility: 'private',
  };
}

export async function generateVideoManifest(
  factPack: SocialFactPack,
  requiresHumanApproval: boolean,
): Promise<VideoDirectorResult> {
  const fallback = buildDeterministicVideoManifest(factPack, requiresHumanApproval);
  const appToken = getOptionalEnv('DIFY_VIDEO_DIRECTOR_TOKEN', '');
  if (!appToken) return { manifest: fallback, source: 'deterministic-fallback' };

  const result = await runWorkflow('social-video-director', {
    fact_pack_json: JSON.stringify(factPack),
    target_duration_seconds: 45,
    aspect_ratio: '9:16',
    output_language: 'en',
    upload_visibility: 'private',
    approval_required: requiresHumanApproval,
  }, appToken, 'video_script');

  if (result.dryRun) return { manifest: fallback, source: 'deterministic-fallback', workflowRunId: result.workflowRunId, tokens: result.totalTokens };
  if (!result.success) throw new Error(result.error || 'Dify video director failed.');
  const parsed = parseDifyManifest(result.outputs.manifest ?? result.outputs.result, factPack);
  if (!parsed) throw new Error('Dify video director returned an invalid manifest.');
  parsed.requiresHumanApproval = requiresHumanApproval;
  const validation = validateVideoManifest(parsed, factPack);
  if (!validation.valid) throw new Error(`Dify video manifest rejected: ${validation.errors.join(' ')}`);

  return {
    manifest: parsed,
    source: 'dify',
    workflowRunId: result.workflowRunId,
    tokens: result.totalTokens,
  };
}
