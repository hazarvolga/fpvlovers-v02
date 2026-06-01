const baseUrl = process.env.BLACKBOX_SMOKE_BASE_URL || 'http://127.0.0.1:3000';
const strictContract = process.argv.includes('--strict-contract');

async function main() {
  const payload = new FormData();
  payload.set('droneType', '5 inch freestyle');
  payload.set('batterySpec', '6S');
  payload.set('problem', 'Propwash and hot motors after throttle punchout');
  payload.set('logData', 'Gyro traces show 180Hz resonance with D-term noise and mild bounce-back.');
  payload.set('currentPIDs', 'P: 45, I: 80, D: 42, FF: 105');
  payload.set(
    'file',
    new File(
      [
        [
          'time,gyroADC[0],setpoint[0],motor[0],throttle,debug[0]',
          '0.01,120,100,1040,0.32,0',
          '0.02,160,112,1100,0.45,2',
        ].join('\n'),
      ],
      'blackbox-export.csv',
      { type: 'text/csv' },
    ),
  );

  const response = await fetch(`${baseUrl}/api/tools/blackbox-tuning`, {
    method: 'POST',
    body: payload,
  });

  const data = await response.json() as {
    success?: boolean;
    source?: string;
    answerMode?: string;
    gatewayStatus?: string;
    retrievalConfidence?: number;
    result?: { confidence?: number; riskLevel?: string };
    error?: string;
  };

  if (!response.ok || !data.success || !data.result) {
    throw new Error(data.error || `Blackbox smoke failed with HTTP ${response.status}`);
  }

  if (strictContract && (!data.answerMode || !data.gatewayStatus)) {
    throw new Error('Blackbox smoke failed strict contract: missing answerMode/gatewayStatus. The target may still be running an old deployment.');
  }

  console.log(JSON.stringify({
    source: data.source,
    answerMode: data.answerMode,
    gatewayStatus: data.gatewayStatus,
    confidence: data.result.confidence,
    retrievalConfidence: data.retrievalConfidence,
    riskLevel: data.result.riskLevel,
  }, null, 2));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Blackbox smoke failed.';
  console.error(message);
  process.exit(1);
});
