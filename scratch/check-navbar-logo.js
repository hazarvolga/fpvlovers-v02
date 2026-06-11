const fs = require('fs');

try {
  const content = fs.readFileSync('src/features/layout/components/Navbar.tsx', 'utf8');
  console.log("Navbar logo size checks:", content.includes('sizes="220px"'));
} catch (e) {
  console.error(e);
}
