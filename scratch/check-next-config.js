const fs = require('fs');

try {
  const content = fs.readFileSync('next.config.ts', 'utf8');
  console.log("next.config.ts content:");
  console.log(content);
} catch (e) {
  console.error(e);
}
