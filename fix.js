const fs = require('fs');

const files = [
  'app/(dashboard)/dashboard/stock/adjustment/view/ClientPage.tsx',
  'app/(dashboard)/dashboard/stock/issue/view/ClientPage.tsx',
  'app/(dashboard)/dashboard/stock/return/view/ClientPage.tsx',
  'app/(dashboard)/dashboard/stock/transfer/view/ClientPage.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Remove duplicate lines of useSearchParams
  content = content.replace(/const searchParams = useSearchParams\(\);\s*const searchParams = useSearchParams\(\);/g, 'const searchParams = useSearchParams();');
  // Clean up duplicate 'use client'
  content = content.replace(/'use client';\s*'use client';/g, "'use client';");
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
});
