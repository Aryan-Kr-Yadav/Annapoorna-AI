import fs from 'fs';
import path from 'path';

const files = [
  'src/pages/Weather.jsx',
  'src/pages/Tasks.jsx',
  'src/pages/Soil.jsx',
  'src/pages/Signup.jsx',
  'src/pages/Settings.jsx',
  'src/pages/Schemes.jsx',
  'src/pages/Profile.jsx',
  'src/pages/Notifications.jsx',
  'src/pages/Market.jsx',
  'src/pages/Login.jsx',
  'src/pages/Irrigation.jsx',
  'src/pages/Dashboard.jsx',
  'src/pages/CropPlanner.jsx',
  'src/pages/CropDoctor.jsx',
  'src/pages/CropDetails.jsx',
  'src/pages/Assistant.jsx',
  'src/pages/Analytics.jsx',
  'src/components/layout/FarmCropSelector.jsx',
  'src/components/layout/MobileNav.jsx',
  'src/components/layout/Sidebar.jsx',
  'src/components/layout/TopNavBar.jsx'
];

for (const f of files) {
  const p = path.resolve(f);
  if (!fs.existsSync(p)) continue;
  const content = fs.readFileSync(p, 'utf8');
  const regex = /\bt\(\s*(["'`])([^"'`]+)\1(?:\s*,\s*(["'`])([^"'`]+)\3)?\s*\)/g;
  let match;
  console.log('=== ' + f + ' ===');
  while ((match = regex.exec(content)) !== null) {
    console.log('  key:', match[2], match[4] ? 'default: ' + match[4] : '');
  }
}
