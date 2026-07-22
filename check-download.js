import fs from 'fs';
import path from 'path';

function searchFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchFiles(fullPath);
    } else if (fullPath.endsWith('page.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('data-table') || content.includes('<table')) {
        const hasPrintUrl = content.includes('/dashboard/receipts/print?type=');
        const hasDownloadUrl = content.includes('&action=download');
        if (hasPrintUrl) {
          console.log(`${fullPath} - Has Print URL: ${hasPrintUrl}, Has Download URL: ${hasDownloadUrl}`);
        }
      }
    }
  }
}

searchFiles('./app/(dashboard)/dashboard');
