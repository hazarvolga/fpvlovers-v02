import { execFileSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const root = process.cwd();
const project = path.join(root, 'video', 'fpvlovers-short');
const sceneCopy = {
  hook: {
    eyebrow: 'DIGITAL VIDEO DECISION',
    title: ['DJI O3', 'VS', 'WALKSNAIL'],
    subtitle: 'Choose the ecosystem, not the loudest specification.',
    labels: ['SYSTEM A', 'SYSTEM B'],
  },
  priorities: {
    eyebrow: '01 // MISSION PROFILE',
    title: ['START WITH', 'YOUR FLIGHT'],
    subtitle: 'Daylight image // Low light // Recording // Aircraft size // Weight',
    labels: ['IMAGE', 'LOW LIGHT', 'RECORDING', 'SIZE + WEIGHT'],
  },
  system: {
    eyebrow: '02 // COMPATIBILITY MAP',
    title: ['CHECK THE', 'WHOLE SYSTEM'],
    subtitle: 'Compatibility can matter more than one headline specification.',
    labels: ['GOGGLES', 'CAMERA + VTX', 'FRAME SPACE', 'UPGRADE PATH'],
  },
  cta: {
    eyebrow: 'NO UNIVERSAL WINNER',
    title: ['BUILD AROUND', 'THE MISSION'],
    subtitle: 'Full comparison and tradeoffs at FPVLovers.',
    labels: ['SPEC ANALYSIS', 'NOT HANDS-ON'],
  },
};

function sceneSvg(scene) {
  const copy = sceneCopy[scene];
  const subtitleWords = copy.subtitle.split(' ');
  const subtitleLines = [];
  let currentLine = '';
  for (const word of subtitleWords) {
    const candidate = `${currentLine} ${word}`.trim();
    if (candidate.length > 42 && currentLine) {
      subtitleLines.push(currentLine);
      currentLine = word;
    } else currentLine = candidate;
  }
  if (currentLine) subtitleLines.push(currentLine);
  const subtitleMarkup = subtitleLines.map((line, index) => `<tspan x="90" dy="${index === 0 ? 0 : 48}">${line}</tspan>`).join('');
  const labelMarkup = copy.labels.map((label, index) => {
    const x = index % 2 === 0 ? 90 : 555;
    const y = 1130 + Math.floor(index / 2) * 180;
    const stroke = index % 2 === 0 ? '#FF5C00' : '#00F2FF';
    return `<rect x="${x}" y="${y}" width="435" height="145" rx="10" fill="#0C111B" stroke="${stroke}" stroke-width="3"/><text x="${x + 28}" y="${y + 84}" fill="#FFFFFF" font-family="Verdana" font-size="29" font-weight="700">${label}</text>`;
  }).join('');
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
    <defs><pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse"><path d="M72 0H0V72" fill="none" stroke="#00F2FF" stroke-opacity=".12" stroke-width="2"/></pattern></defs>
    <rect width="1080" height="1920" fill="#050810"/><rect width="1080" height="1920" fill="url(#grid)"/>
    <rect x="90" y="92" width="7" height="44" fill="#FF5C00"/><text x="118" y="125" fill="#00F2FF" font-family="Verdana" font-size="24" font-weight="700" letter-spacing="4">FPVLOVERS // DECISION SYSTEM</text>
    <text x="90" y="420" fill="#00F2FF" font-family="Verdana" font-size="26" font-weight="700" letter-spacing="5">${copy.eyebrow}</text>
    <text x="90" y="610" fill="#FFFFFF" font-family="Verdana" font-size="104" font-weight="900" letter-spacing="-5">${copy.title[0]}</text>
    <text x="90" y="735" fill="#FF5C00" font-family="Verdana" font-size="104" font-weight="900" letter-spacing="-5">${copy.title[1]}</text>
    ${copy.title[2] ? `<text x="90" y="860" fill="#00F2FF" font-family="Verdana" font-size="104" font-weight="900" letter-spacing="-5">${copy.title[2]}</text>` : ''}
    <text x="90" y="965" fill="#D5D9DF" font-family="Verdana" font-size="34">${subtitleMarkup}</text>
    ${labelMarkup}
    <line x1="90" y1="1730" x2="990" y2="1730" stroke="#00F2FF" stroke-opacity=".25" stroke-width="2"/>
    <text x="90" y="1805" fill="#7F8998" font-family="Verdana" font-size="22" font-weight="700" letter-spacing="3">FPVLOVERS.COM.TR</text>
    <text x="717" y="1805" fill="#7F8998" font-family="Verdana" font-size="22" font-weight="700" letter-spacing="3">FOLLOW THE SIGNAL</text>
  </svg>`;
}

for (const scene of Object.keys(sceneCopy)) {
  await sharp(Buffer.from(sceneSvg(scene))).png().toFile(path.join(project, `${scene}.png`));
}

execFileSync('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-loop', '1', '-t', '8', '-i', path.join(project, 'hook.png'),
  '-loop', '1', '-t', '14', '-i', path.join(project, 'priorities.png'),
  '-loop', '1', '-t', '14', '-i', path.join(project, 'system.png'),
  '-loop', '1', '-t', '9', '-i', path.join(project, 'cta.png'),
  '-i', path.join(project, 'narration.wav'),
  '-filter_complex',
  '[0:v]fps=30,format=yuv420p,fade=t=out:st=7.65:d=0.35[v0];' +
  '[1:v]fps=30,format=yuv420p,fade=t=in:st=0:d=0.35,fade=t=out:st=13.65:d=0.35[v1];' +
  '[2:v]fps=30,format=yuv420p,fade=t=in:st=0:d=0.35,fade=t=out:st=13.65:d=0.35[v2];' +
  '[3:v]fps=30,format=yuv420p,fade=t=in:st=0:d=0.35[v3];' +
  '[v0][v1][v2][v3]concat=n=4:v=1:a=0[v]',
  '-map', '[v]', '-map', '4:a',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
  '-c:a', 'aac', '-b:a', '160k', '-ar', '48000',
  '-t', '45', '-movflags', '+faststart',
  path.join(project, 'fpvlovers-dji-o3-vs-walksnail-short.mp4'),
], { stdio: 'inherit' });

console.log('Rendered FPVLovers video MVP fallback.');
