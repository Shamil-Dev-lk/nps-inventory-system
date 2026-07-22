import fs from 'fs';
import path from 'path';

function searchFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchFiles(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('DataTable') && !content.includes('onPrint={') && !content.includes('onDownload={')) {
        console.log(`Missing onPrint/onDownload: ${fullPath}`);
      }
    }
  }
}

searchFiles('./app/(dashboard)/dashboard');
