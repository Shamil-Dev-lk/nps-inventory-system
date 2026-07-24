const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (f.endsWith('ClientPage.tsx')) {
      callback(dirPath);
    }
  });
}

walkDir('app', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace params.id usage with searchParams id
  if (content.includes('params.id') || content.includes('params?.id')) {
    console.log('Fixing params.id in:', filePath);
    
    // Ensure useSearchParams is imported
    if (!content.includes('useSearchParams')) {
      content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';");
      content = content.replace("import { useParams, useRouter } from 'next/navigation';", "import { useParams, useRouter, useSearchParams } from 'next/navigation';");
      content = content.replace("import { useRouter, useParams } from 'next/navigation';", "import { useParams, useRouter, useSearchParams } from 'next/navigation';");
      content = content.replace("from 'next/navigation';", "import { useSearchParams } from 'next/navigation';");
    }

    // Replace params.id with id derived from useSearchParams
    // First, inject const searchParams = useSearchParams(); const id = searchParams.get('id'); at start of component
    content = content.replace(/params\.id/g, "id");
    content = content.replace(/params\?\.id/g, "id");

    // Also update any links inside that still use old path format:
    content = content.replace(/\/dashboard\/customers\/\${id}\/view/g, '/dashboard/customers/view/?id=${id}');
    content = content.replace(/\/dashboard\/customers\/\${id}/g, '/dashboard/customers/edit/?id=${id}');
    content = content.replace(/\/dashboard\/store\/suppliers\/\${id}\/view/g, '/dashboard/store/suppliers/view/?id=${id}');
    content = content.replace(/\/dashboard\/store\/suppliers\/\${id}\/edit/g, '/dashboard/store/suppliers/edit/?id=${id}');
    content = content.replace(/\/dashboard\/purchase\/orders\/\${id}\/edit/g, '/dashboard/purchase/orders/edit/?id=${id}');
    content = content.replace(/\/dashboard\/purchase\/orders\/\${id}/g, '/dashboard/purchase/orders/view/?id=${id}');
    content = content.replace(/\/dashboard\/purchase\/requests\/\${id}\/edit/g, '/dashboard/purchase/requests/edit/?id=${id}');
    content = content.replace(/\/dashboard\/purchase\/requests\/\${id}/g, '/dashboard/purchase/requests/view/?id=${id}');

    // Insert const searchParams = useSearchParams(); const id = searchParams.get('id'); if not already defined
    if (!content.includes("searchParams.get('id')")) {
      content = content.replace(/(export default function \w+\([^)]*\)\s*\{)/, "$1\n  const searchParams = useSearchParams();\n  const id = searchParams.get('id');");
    }

    fs.writeFileSync(filePath, content, 'utf8');
  }
});
