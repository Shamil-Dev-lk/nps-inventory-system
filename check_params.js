const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const appDir = path.join(__dirname, 'app');
const files = walk(appDir);
const brokenFiles = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('params.') || (content.includes('params') && !content.includes('params:') && !content.includes('params =') && !content.includes('const params') && !content.includes('useParams'))) {
    brokenFiles.push(file);
  }
}

console.log('Broken files count:', brokenFiles.length);
brokenFiles.forEach(f => console.log(f));
