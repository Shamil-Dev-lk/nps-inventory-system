const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('app', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        let updatedContent = content
            .replace(/'\/logo\.png'/g, "'/nps-inventory-system/logo.png'")
            .replace(/"\/logo\.png"/g, '"/nps-inventory-system/logo.png"');
            
        if (updatedContent !== content) {
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    }
});

walkDir('components', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        let updatedContent = content
            .replace(/'\/logo\.png'/g, "'/nps-inventory-system/logo.png'")
            .replace(/"\/logo\.png"/g, '"/nps-inventory-system/logo.png"');
            
        if (updatedContent !== content) {
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    }
});

console.log("Done fixing logo paths.");
