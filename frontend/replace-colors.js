const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'InterviewRoom.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace background colors
content = content.replace(/bg-\[\#111111\]/g, 'bg-bg');
content = content.replace(/bg-\[\#1c1c1c\]/g, 'bg-surface');
content = content.replace(/bg-\[\#141414\]/g, 'bg-surface-2');
content = content.replace(/bg-\[\#252526\]/g, 'bg-code-bg');
content = content.replace(/bg-\[\#1e1e1e\]/g, 'bg-code-bg');
content = content.replace(/bg-\[\#2d2d2e\]/g, 'bg-surface-3');

// Replace border colors
content = content.replace(/border-\[\#2d2d2d\]/g, 'border-border');
content = content.replace(/border-\[\#3c3c3c\]/g, 'border-border');

// Replace blue with emerald/accent
content = content.replace(/blue-500/g, 'emerald-500');
content = content.replace(/blue-600/g, 'emerald-600');
content = content.replace(/blue-400/g, 'emerald-400');
content = content.replace(/blue-300/g, 'emerald-300');

// Replace custom slate colors if any that stand out (optional, mostly fine to leave slate if it's text)

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated colors in InterviewRoom.tsx');
