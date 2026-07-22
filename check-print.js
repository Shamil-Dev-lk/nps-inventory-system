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
        const hasPrint = content.includes('Printer') || content.includes('window.open(`/dashboard/receipts/print');
        console.log(`${fullPath} - Has Print: ${hasPrint}`);
      }
    }
  }
}

searchFiles('./app/(dashboard)/dashboard');
