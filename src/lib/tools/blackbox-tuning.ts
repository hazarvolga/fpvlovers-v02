export type BlackboxTuningInput = {
  droneType: string;
  batterySpec: string;
  problem: string;
  logData: string;
  currentPIDs: string;
  fileName?: string;
  fileText?: string;
  parsedTelemetrySummary?: string;
  gyroModel?: string;
};

export type BlackboxRiskLevel = 'low' | 'medium' | 'high';

export type BlackboxTuningResult = {
  summary: string;
  confidence: number;
  riskLevel: BlackboxRiskLevel;
  detectedIssues: string[];
  proposedSettings: {
    p: number;
    i: number;
    d: number;
    ff: number;
    gyroLowpassHz: number;
    rpmFilter: 'on' | 'verify';
    dynamicNotch: 'on' | 'increase';
    cliCommands?: string;
  };
  recommendations: string[];
  nextSteps: string[];
  markdown: string;
};

export type ParsedTelemetrySummary = {
  format: 'csv' | 'text';
  columns: string[];
  detectedSignals: string[];
  sampleCount?: number;
  summary: string;
};

type PidValues = {
  p: number;
  i: number;
  d: number;
  ff: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round(value);
}

function parsePidValue(text: string, label: string, fallback: number): number {
  const pattern = new RegExp(`${label}\\s*[:=]\\s*(\\d+(?:\\.\\d+)?)`, 'i');
  const match = text.match(pattern);
  if (!match) return fallback;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parsePids(text: string): PidValues {
  return {
    p: parsePidValue(text, 'p', 45),
    i: parsePidValue(text, 'i', 80),
    d: parsePidValue(text, 'd', 40),
    ff: parsePidValue(text, 'ff|feedforward', 100),
  };
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function isUnsupportedBlackboxBinaryFile(fileName?: string): boolean {
  const normalized = fileName?.trim().toLowerCase() || '';
  return normalized.endsWith('.bbl') || normalized.endsWith('.bfl');
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function detectTelemetrySignals(text: string): string[] {
  const lower = text.toLowerCase();
  const signals: string[] = [];
  if (includesAny(lower, ['gyro', 'gyroadc'])) signals.push('gyro');
  if (includesAny(lower, ['setpoint', 'rccommand'])) signals.push('setpoint');
  if (includesAny(lower, ['motor', 'motor['])) signals.push('motor');
  if (includesAny(lower, ['throttle', 'thr'])) signals.push('throttle');
  if (includesAny(lower, ['dterm', 'd-term', 'd term'])) signals.push('dterm');
  if (includesAny(lower, ['debug', 'debug['])) signals.push('debug');
  if (includesAny(lower, ['roll', 'pitch', 'yaw'])) signals.push('axis');
  return unique(signals);
}

export function summarizeBlackboxText(fileName: string | undefined, text: string): ParsedTelemetrySummary | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;

  const lines = trimmed.split(/\r?\n/).filter((line) => line.trim());
  const extension = fileName?.split('.').pop()?.toLowerCase();
  const firstLine = lines[0] || '';
  const looksCsv = extension === 'csv' || (firstLine.includes(',') && lines.length > 1);
  const columns = looksCsv
    ? firstLine.split(',').map((column) => column.trim()).filter(Boolean).slice(0, 32)
    : [];
  const detectedSignals = detectTelemetrySignals(`${columns.join(' ')} ${trimmed.slice(0, 4000)}`);
  const sampleCount = looksCsv ? Math.max(0, lines.length - 1) : undefined;
  const format = looksCsv ? 'csv' : 'text';
  const summaryParts = [
    `${format.toUpperCase()} telemetry excerpt`,
    sampleCount !== undefined ? `${sampleCount} sample rows` : `${lines.length} text line(s)`,
    columns.length ? `columns: ${columns.slice(0, 12).join(', ')}` : '',
    detectedSignals.length ? `detected signals: ${detectedSignals.join(', ')}` : 'detected signals: none',
  ].filter(Boolean);

  return {
    format,
    columns,
    detectedSignals,
    sampleCount,
    summary: summaryParts.join('; '),
  };
}

function detectResonanceHz(text: string): number | undefined {
  const match = text.match(/(\d{2,3})\s*hz/i);
  if (!match) return undefined;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function scoreConfidence(input: BlackboxTuningInput): number {
  const textLength = `${input.problem} ${input.logData} ${input.fileText || ''}`.trim().length;
  let score = 45;
  if (textLength > 80) score += 15;
  if (textLength > 250) score += 15;
  if (input.currentPIDs.trim().length > 8) score += 10;
  if (input.fileName) score += 8;
  if (input.parsedTelemetrySummary) score += 6;
  if (detectResonanceHz(input.logData) || detectResonanceHz(input.fileText || '')) score += 7;
  return clamp(score, 35, 92);
}

export function analyzeBlackboxTuning(input: BlackboxTuningInput): BlackboxTuningResult {
  const combined = `${input.problem} ${input.logData} ${input.fileText || ''} ${input.parsedTelemetrySummary || ''}`.toLowerCase();
  const pids = parsePids(input.currentPIDs);
  const resonanceHz = detectResonanceHz(input.logData) || detectResonanceHz(input.fileText || '');

  const detectedIssues: string[] = [];
  const recommendations: string[] = [];
  const nextSteps: string[] = [
    'Apply changes in small steps, then run a short 30 second hover and punchout test.',
    'Land and touch-test motor bells before continuing. Warm is acceptable; too hot to hold is a stop condition.',
    'Save the previous Betaflight profile before changing PID or filter sliders.',
  ];

  let pDelta = 0;
  let iDelta = 0;
  let dDelta = 0;
  let ffDelta = 0;
  let gyroLowpassHz = 120;
  let dynamicNotch: BlackboxTuningResult['proposedSettings']['dynamicNotch'] = 'on';

  let cliCommands = '';
  const gModel = input.gyroModel?.trim().toUpperCase() || '';

  if (gModel === 'ICM42688P') {
    gyroLowpassHz = 100;
    dynamicNotch = 'increase';
    recommendations.push(
      'ICM42688P Gyro is highly sensitive to high-frequency electrical spike noise. Solder a low-ESR 35V 1000uF capacitor to battery leads.'
    );
    cliCommands = [
      '# ICM42688P HIGH-RESONANCE FILTER PRESETS',
      'set gyro_hardware_lpf = NORMAL',
      'set gyro_lowpass_type = BIQUAD',
      'set gyro_lowpass_hz = 100',
      'set gyro_lowpass2_type = BIQUAD',
      'set gyro_lowpass2_hz = 250',
      'set dynamic_notch_q = 250',
      'save'
    ].join('\n');
  } else if (gModel === 'BMI270') {
    gyroLowpassHz = 135;
    recommendations.push(
      'BMI270 Gyros have exceptional hardware noise filtering but suffer from slight native group delay. You can safely reduce filter stages to lower latency.'
    );
    cliCommands = [
      '# BMI270 LOW-LATENCY FILTER PRESETS',
      'set gyro_hardware_lpf = EXPERIMENTAL',
      'set gyro_lowpass_type = PT1',
      'set gyro_lowpass_hz = 135',
      'set gyro_lowpass2_type = PT1',
      'set gyro_lowpass2_hz = 300',
      'set dynamic_notch_q = 350',
      'save'
    ].join('\n');
  } else if (gModel === 'MPU6000') {
    gyroLowpassHz = 120;
    recommendations.push(
      'MPU6000 Gyro is robust and noise-tolerant. Standard dual PT1 filter configuration is perfect.'
    );
    cliCommands = [
      '# MPU6000 STANDARD BALANCED FILTER PRESETS',
      'set gyro_hardware_lpf = NORMAL',
      'set gyro_lowpass_type = PT1',
      'set gyro_lowpass_hz = 120',
      'set gyro_lowpass2_type = PT1',
      'set gyro_lowpass2_hz = 260',
      'save'
    ].join('\n');
  }

  if (includesAny(combined, ['propwash', 'wash', 'dirty air'])) {
    detectedIssues.push('Propwash recovery instability');
    dDelta += 3;
    pDelta -= 1;
    recommendations.push('Increase D damping slightly and avoid large P increases until motor heat is verified.');
  }

  if (includesAny(combined, ['bounce-back', 'bounce back', 'bounceback'])) {
    detectedIssues.push('Stop bounce-back after sharp stick inputs');
    dDelta += 2;
    ffDelta -= 4;
    recommendations.push('Add D damping and reduce feedforward slightly if bounce-back appears after snap moves.');
  }

  if (includesAny(combined, ['overshoot', 'over shoot', 'oscillation after input'])) {
    detectedIssues.push('Setpoint overshoot');
    pDelta -= 2;
    dDelta += 1;
    recommendations.push('Reduce P a little before adding more D if overshoot is visible on step response.');
  }

  if (includesAny(combined, ['yaw', 'tail wag'])) {
    detectedIssues.push('Yaw-axis instability');
    iDelta += 2;
    recommendations.push('Check yaw mechanical friction and prop condition before pushing yaw I-term further.');
  }

  if (includesAny(combined, ['hot motor', 'motor heat', 'hot motors', 'desync'])) {
    detectedIssues.push('Motor heat or desync risk');
    dDelta -= 3;
    gyroLowpassHz = Math.min(gyroLowpassHz, 100);
    dynamicNotch = 'increase';
    recommendations.push('Prioritize filtering and motor temperature over aggressive D gain.');
  }

  if (resonanceHz && resonanceHz >= 120) {
    detectedIssues.push(`${resonanceHz}Hz gyro resonance`);
    gyroLowpassHz = resonanceHz > 180 ? 100 : Math.min(gyroLowpassHz, 120);
    dynamicNotch = 'increase';
    recommendations.push(`Add notch/filter attention around the observed ${resonanceHz}Hz resonance before raising gains.`);
  }

  if (!detectedIssues.length) {
    detectedIssues.push('No severe signature detected from the supplied summary');
    recommendations.push('Keep the current tune conservative and gather a cleaner blackbox excerpt with throttle, gyro, setpoint, and D-term traces.');
  }

  const proposedSettings = {
    p: round(clamp(pids.p + pDelta, 25, 75)),
    i: round(clamp(pids.i + iDelta, 45, 120)),
    d: round(clamp(pids.d + dDelta, 20, 65)),
    ff: round(clamp(pids.ff + ffDelta, 60, 140)),
    gyroLowpassHz,
    rpmFilter: 'on' as const,
    dynamicNotch,
    cliCommands: cliCommands || undefined,
  };

  const riskLevel: BlackboxRiskLevel =
    includesAny(combined, ['hot motor', 'desync']) || proposedSettings.d > pids.d + 4
      ? 'high'
      : detectedIssues.length >= 3
        ? 'medium'
        : 'low';

  const confidence = scoreConfidence(input);
  const summary = `${input.droneType || 'FPV build'} on ${input.batterySpec || 'unknown battery'} shows ${detectedIssues[0].toLowerCase()}.`;

  const markdownParts = [
    '### Diagnostic Report',
    `- Problem signature: ${detectedIssues.join(', ')}`,
    `- Confidence: ${confidence}/100`,
    `- Risk level: ${riskLevel}`,
    resonanceHz ? `- Observed resonance: ${resonanceHz}Hz` : '- Observed resonance: not enough frequency detail supplied',
    input.parsedTelemetrySummary ? `- Parsed telemetry: ${input.parsedTelemetrySummary}` : '',
    gModel ? `- Flight DNA Gyro Spec: ${gModel}` : '',
    '',
    '### Proposed Settings',
    `- PIDs: P ${proposedSettings.p}, I ${proposedSettings.i}, D ${proposedSettings.d}, FF ${proposedSettings.ff}`,
    `- Filters: Gyro lowpass around ${proposedSettings.gyroLowpassHz}Hz, RPM filter ${proposedSettings.rpmFilter}, dynamic notch ${proposedSettings.dynamicNotch}`,
    '',
    '### Why',
    ...recommendations.map((item) => `- ${item}`),
    '',
  ];

  if (cliCommands) {
    markdownParts.push(
      '### Betaflight CLI Injection Commands',
      '> [!CAUTION]',
      '> Applying manual CLI filter parameters can lead to motor heat if your build has severe frame arm vibrations. Run a short 30-second hover test and verify that motor bells remain warm/cool before committing to hard flight.',
      '```text',
      cliCommands,
      '```',
      ''
    );
  }

  markdownParts.push(
    '### Next Steps',
    ...nextSteps.map((item) => `- ${item}`)
  );

  const markdown = markdownParts.join('\n');

  return {
    summary,
    confidence,
    riskLevel,
    detectedIssues,
    proposedSettings,
    recommendations,
    nextSteps,
    markdown,
  };
}
