import fs from 'fs';
import path from 'path';

function searchFiles(dir, regexStr) {
  const files = fs.readdirSync(dir);
  const regex = new RegExp(regexStr, 'g');
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchFiles(fullPath, regexStr);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (regex.test(content)) {
        console.log(`Match in: ${fullPath}`);
      }
    }
  }
}

console.log("Searching for brand on items:");
searchFiles('./app/(dashboard)/dashboard', "brand:brands");
