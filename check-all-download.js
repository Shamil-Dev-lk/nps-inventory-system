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
      if (content.includes('window.open(`/dashboard/receipts/print')) {
        const hasPrintUrl = content.includes('window.open(`/dashboard/receipts/print');
        const hasDownloadUrl = content.includes('&action=download');
        console.log(`${fullPath} - Has Print URL: ${hasPrintUrl}, Has Download URL: ${hasDownloadUrl}`);
      }
    }
  }
}

searchFiles('./app/(dashboard)/dashboard');
