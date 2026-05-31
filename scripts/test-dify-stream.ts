const BASE = process.env.DIFY_BASE_URL || 'https://dify.affexai.tr/v1';
const appKey = process.env.DIFY_APP_KEY;

async function test() {
  console.log('--- TESTING RAW DIFY STREAM ---');
  console.log('Dify Base URL:', BASE);
  console.log('Dify App Key:', appKey?.slice(0, 10) + '...');
  
  if (!appKey) {
    console.error('DIFY_APP_KEY is missing!');
    process.exit(1);
  }
  
  const resp = await fetch(`${BASE}/workflows/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${appKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {
        keyword: 'FPV beginner setup guide',
        content_type: 'tutorial',
        word_count: 1500,
      },
      response_mode: 'streaming',
      user: 'debug-user',
    }),
  });
  
  if (!resp.ok) {
    console.error('HTTP Error:', resp.status, await resp.text());
    return;
  }
  
  const reader = resp.body?.getReader();
  if (!reader) {
    console.error('No stream body!');
    return;
  }
  
  const decoder = new TextDecoder();
  let buffer = '';
  
  while (true) {
    const { value, done } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: !done });
    
    let splitIndex = buffer.indexOf('\n\n');
    while (splitIndex !== -1) {
      const block = buffer.slice(0, splitIndex).trim();
      buffer = buffer.slice(splitIndex + 2);
      if (block) {
        console.log('\n--- RAW BLOCK ---');
        console.log(block);
      }
      splitIndex = buffer.indexOf('\n\n');
    }
    if (done) break;
  }
  console.log('\n--- STREAM COMPLETED ---');
}

test();
