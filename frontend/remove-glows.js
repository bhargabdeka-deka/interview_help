const fs = require('fs');
const path = require('path');

const filesToProcess = [
    path.join(__dirname, 'app', 'page.tsx'),
    path.join(__dirname, 'app', 'login', 'page.tsx'),
    path.join(__dirname, 'app', 'signup', 'page.tsx')
];

filesToProcess.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove background glow divs entirely
    content = content.replace(/\{\/\* Background Glow \*\/\}\s*<div className="absolute[^>]*blur-\[[0-9]+px\][^>]*"\s*\/>/g, '');
    
    // Remove CTA section glow in page.tsx
    content = content.replace(/<div className="absolute[^>]*blur-\[[0-9]+px\][^>]*"\s*\/>/g, '');

    // Simplify the gradient text
    content = content.replace(/className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-emerald-300"/g, 'className="text-accent"');

    // Remove flashy drop shadows from buttons
    content = content.replace(/shadow-\[0_0_[0-9]+px_rgba\([0-9,.]+\)\]/g, '');
    content = content.replace(/hover:shadow-\[0_0_[0-9]+px_rgba\([0-9,.]+\)\]/g, '');

    // Clean up double spaces left by removing classes
    content = content.replace(/\s{2,}/g, ' ');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Removed flashy styles in', path.basename(filePath));
});
