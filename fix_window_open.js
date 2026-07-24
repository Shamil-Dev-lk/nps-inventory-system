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
        
        // Find: window.open(`/dashboard/
        // Replace with: window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/
        if (content.includes("window.open(`/dashboard/")) {
            const updatedContent = content.replace(/window\.open\(`\/dashboard\//g, "window.open(`${window.location.pathname.split('/dashboard')[0] || ''}/dashboard/");
            
            if (updatedContent !== content) {
                fs.writeFileSync(filePath, updatedContent, 'utf8');
                console.log(`Updated: ${filePath}`);
            }
        }
    }
});

console.log("Done.");
