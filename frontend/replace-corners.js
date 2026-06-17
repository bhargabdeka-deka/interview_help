const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(path.join(dir, f));
        }
    });
}

function processFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    if (filePath.includes('tailwind.config.ts')) return; // skip config

    const content = fs.readFileSync(filePath, 'utf8');
    // Replace classNames like rounded, rounded-sm, rounded-md, rounded-lg, rounded-full, rounded-[10px] with rounded-none
    // Be careful with word boundaries
    const regex = /\brounded(?:-[a-zA-Z0-9\[\]]+)?\b/g;
    
    if (regex.test(content)) {
        const newContent = content.replace(regex, 'rounded-none');
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

const frontendDir = path.join(__dirname, 'app');
const componentsDir = path.join(__dirname, 'components');

walkDir(frontendDir, processFile);
walkDir(componentsDir, processFile);
console.log('Done replacing rounded classes');
