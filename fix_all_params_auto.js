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

let fixedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // If params.id is used without params prop:
  if (content.includes('params.id') && !content.includes('({ params }') && !content.includes('(props: { params')) {
    console.log('Fixing params.id in:', file);
    
    // Add useSearchParams import if missing
    if (!content.includes('useSearchParams')) {
      content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';");
      content = content.replace("from 'next/navigation';", "import { useSearchParams } from 'next/navigation';\n// ");
    }

    // Add searchParams and id definition
    if (!content.includes('searchParams.get')) {
      content = content.replace(/const router = useRouter\(\);/g, "const router = useRouter();\n  const searchParams = useSearchParams();\n  const id = searchParams.get('id');");
    }

    // Replace params.id with id
    content = content.replace(/params\.id/g, 'id');
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    fixedCount++;
  }
}

console.log(`Successfully fixed ${fixedCount} files!`);
