const fs = require('fs');
const path = require('path');

// 1. Refactor items
// items/[id]/page.tsx -> items/view/page.tsx
// items/[id]/ClientPage.tsx -> items/view/ClientPage.tsx
// items/[id]/edit/page.tsx -> items/edit/page.tsx
// items/[id]/edit/ClientPage.tsx -> items/edit/ClientPage.tsx

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ------------------- ITEMS -------------------
ensureDir('app/(dashboard)/dashboard/items/view');
ensureDir('app/(dashboard)/dashboard/items/edit');

// Items View
if (fs.existsSync('app/(dashboard)/dashboard/items/[id]/ClientPage.tsx')) {
  let content = fs.readFileSync('app/(dashboard)/dashboard/items/[id]/ClientPage.tsx', 'utf8');
  content = content.replace("export default function ViewItemPage({ params }: { params: { id: string } }) {", "export default function ViewItemPage() {");
  content = content.replace("const { id } = params;", "const searchParams = useSearchParams();\n  const id = searchParams.get('id');");
  if (!content.includes('useSearchParams')) {
    content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';");
  }
  content = content.replace(/\/dashboard\/items\/\${itemData\.id}\/edit/g, "/dashboard/items/edit?id=${itemData.id}");
  fs.writeFileSync('app/(dashboard)/dashboard/items/view/ClientPage.tsx', content);
  
  fs.writeFileSync('app/(dashboard)/dashboard/items/view/page.tsx', `'use client';
import ClientPage from './ClientPage';
import { Suspense } from 'react';

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><ClientPage /></Suspense>;
}
`);
}

// Items Edit
if (fs.existsSync('app/(dashboard)/dashboard/items/[id]/edit/ClientPage.tsx')) {
  let content = fs.readFileSync('app/(dashboard)/dashboard/items/[id]/edit/ClientPage.tsx', 'utf8');
  content = content.replace("export default function EditItemPage({ params }: { params: { id: string } }) {", "export default function EditItemPage() {");
  content = content.replace("const itemId = params.id;", "const searchParams = useSearchParams();\n  const itemId = searchParams.get('id');");
  if (!content.includes('useSearchParams')) {
    content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';");
  }
  content = content.replace(/\/dashboard\/items\/\${itemId}/g, "/dashboard/items/view?id=${itemId}");
  fs.writeFileSync('app/(dashboard)/dashboard/items/edit/ClientPage.tsx', content);

  fs.writeFileSync('app/(dashboard)/dashboard/items/edit/page.tsx', `'use client';
import ClientPage from './ClientPage';
import { Suspense } from 'react';

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><ClientPage /></Suspense>;
}
`);
}

// ------------------- SUPPLIERS -------------------
ensureDir('app/(dashboard)/dashboard/store/suppliers/view');
ensureDir('app/(dashboard)/dashboard/store/suppliers/edit');

if (fs.existsSync('app/(dashboard)/dashboard/store/suppliers/[id]/view/ClientPage.tsx')) {
  let content = fs.readFileSync('app/(dashboard)/dashboard/store/suppliers/[id]/view/ClientPage.tsx', 'utf8');
  content = content.replace("({ params }: { params: { id: string } })", "()");
  content = content.replace("const id = params.id;", "const searchParams = useSearchParams();\n  const id = searchParams.get('id');");
  content = content.replace("const { id } = params;", "const searchParams = useSearchParams();\n  const id = searchParams.get('id');");
  if (!content.includes('useSearchParams')) {
    content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';");
  }
  content = content.replace(/\/dashboard\/store\/suppliers\/\${id}\/edit/g, "/dashboard/store/suppliers/edit?id=${id}");
  fs.writeFileSync('app/(dashboard)/dashboard/store/suppliers/view/ClientPage.tsx', content);

  fs.writeFileSync('app/(dashboard)/dashboard/store/suppliers/view/page.tsx', `'use client';
import ClientPage from './ClientPage';
import { Suspense } from 'react';

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><ClientPage /></Suspense>;
}
`);
}

if (fs.existsSync('app/(dashboard)/dashboard/store/suppliers/[id]/edit/ClientPage.tsx')) {
  let content = fs.readFileSync('app/(dashboard)/dashboard/store/suppliers/[id]/edit/ClientPage.tsx', 'utf8');
  content = content.replace("({ params }: { params: { id: string } })", "()");
  content = content.replace("const id = params.id;", "const searchParams = useSearchParams();\n  const id = searchParams.get('id');");
  content = content.replace("const supplierId = params.id;", "const searchParams = useSearchParams();\n  const supplierId = searchParams.get('id');");
  if (!content.includes('useSearchParams')) {
    content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';");
  }
  content = content.replace(/\/dashboard\/store\/suppliers\/\${id}/g, "/dashboard/store/suppliers/view?id=${id}");
  fs.writeFileSync('app/(dashboard)/dashboard/store/suppliers/edit/ClientPage.tsx', content);

  fs.writeFileSync('app/(dashboard)/dashboard/store/suppliers/edit/page.tsx', `'use client';
import ClientPage from './ClientPage';
import { Suspense } from 'react';

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><ClientPage /></Suspense>;
}
`);
}

// ------------------- USERS -------------------
ensureDir('app/(dashboard)/dashboard/settings/users/edit');
if (fs.existsSync('app/(dashboard)/dashboard/settings/users/[id]/edit/ClientPage.tsx')) {
  let content = fs.readFileSync('app/(dashboard)/dashboard/settings/users/[id]/edit/ClientPage.tsx', 'utf8');
  content = content.replace("({ params }: { params: { id: string } })", "()");
  content = content.replace("const userId = params.id;", "const searchParams = useSearchParams();\n  const userId = searchParams.get('id');");
  content = content.replace("const id = params.id;", "const searchParams = useSearchParams();\n  const id = searchParams.get('id');");
  if (!content.includes('useSearchParams')) {
    content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';");
  }
  fs.writeFileSync('app/(dashboard)/dashboard/settings/users/edit/ClientPage.tsx', content);

  fs.writeFileSync('app/(dashboard)/dashboard/settings/users/edit/page.tsx', `'use client';
import ClientPage from './ClientPage';
import { Suspense } from 'react';

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><ClientPage /></Suspense>;
}
`);
}

// ------------------- PURCHASE ORDERS -------------------
ensureDir('app/(dashboard)/dashboard/purchase/orders/view');
ensureDir('app/(dashboard)/dashboard/purchase/orders/edit');
if (fs.existsSync('app/(dashboard)/dashboard/purchase/orders/[id]/ClientPage.tsx')) {
  let content = fs.readFileSync('app/(dashboard)/dashboard/purchase/orders/[id]/ClientPage.tsx', 'utf8');
  content = content.replace("({ params }: { params: { id: string } })", "()");
  content = content.replace("const id = params.id;", "const searchParams = useSearchParams();\n  const id = searchParams.get('id');");
  if (!content.includes('useSearchParams')) {
    content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';");
  }
  fs.writeFileSync('app/(dashboard)/dashboard/purchase/orders/view/ClientPage.tsx', content);

  fs.writeFileSync('app/(dashboard)/dashboard/purchase/orders/view/page.tsx', `'use client';
import ClientPage from './ClientPage';
import { Suspense } from 'react';

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><ClientPage /></Suspense>;
}
`);
}
if (fs.existsSync('app/(dashboard)/dashboard/purchase/orders/[id]/edit/ClientPage.tsx')) {
  let content = fs.readFileSync('app/(dashboard)/dashboard/purchase/orders/[id]/edit/ClientPage.tsx', 'utf8');
  content = content.replace("({ params }: { params: { id: string } })", "()");
  content = content.replace("const id = params.id;", "const searchParams = useSearchParams();\n  const id = searchParams.get('id');");
  if (!content.includes('useSearchParams')) {
    content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';");
  }
  fs.writeFileSync('app/(dashboard)/dashboard/purchase/orders/edit/ClientPage.tsx', content);

  fs.writeFileSync('app/(dashboard)/dashboard/purchase/orders/edit/page.tsx', `'use client';
import ClientPage from './ClientPage';
import { Suspense } from 'react';

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><ClientPage /></Suspense>;
}
`);
}

// ------------------- PURCHASE REQUESTS -------------------
ensureDir('app/(dashboard)/dashboard/purchase/requests/view');
ensureDir('app/(dashboard)/dashboard/purchase/requests/edit');
if (fs.existsSync('app/(dashboard)/dashboard/purchase/requests/[id]/ClientPage.tsx')) {
  let content = fs.readFileSync('app/(dashboard)/dashboard/purchase/requests/[id]/ClientPage.tsx', 'utf8');
  content = content.replace("({ params }: { params: { id: string } })", "()");
  content = content.replace("const id = params.id;", "const searchParams = useSearchParams();\n  const id = searchParams.get('id');");
  if (!content.includes('useSearchParams')) {
    content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';");
  }
  fs.writeFileSync('app/(dashboard)/dashboard/purchase/requests/view/ClientPage.tsx', content);

  fs.writeFileSync('app/(dashboard)/dashboard/purchase/requests/view/page.tsx', `'use client';
import ClientPage from './ClientPage';
import { Suspense } from 'react';

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><ClientPage /></Suspense>;
}
`);
}
if (fs.existsSync('app/(dashboard)/dashboard/purchase/requests/[id]/edit/ClientPage.tsx')) {
  let content = fs.readFileSync('app/(dashboard)/dashboard/purchase/requests/[id]/edit/ClientPage.tsx', 'utf8');
  content = content.replace("({ params }: { params: { id: string } })", "()");
  content = content.replace("const id = params.id;", "const searchParams = useSearchParams();\n  const id = searchParams.get('id');");
  if (!content.includes('useSearchParams')) {
    content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';");
  }
  fs.writeFileSync('app/(dashboard)/dashboard/purchase/requests/edit/ClientPage.tsx', content);

  fs.writeFileSync('app/(dashboard)/dashboard/purchase/requests/edit/page.tsx', `'use client';
import ClientPage from './ClientPage';
import { Suspense } from 'react';

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><ClientPage /></Suspense>;
}
`);
}

// ------------------- STOCK GRN -------------------
ensureDir('app/(dashboard)/dashboard/stock/grn/view');
if (fs.existsSync('app/(dashboard)/dashboard/stock/grn/[id]/ClientPage.tsx')) {
  let content = fs.readFileSync('app/(dashboard)/dashboard/stock/grn/[id]/ClientPage.tsx', 'utf8');
  content = content.replace("({ params }: { params: { id: string } })", "()");
  content = content.replace("const id = params.id;", "const searchParams = useSearchParams();\n  const id = searchParams.get('id');");
  if (!content.includes('useSearchParams')) {
    content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';");
  }
  fs.writeFileSync('app/(dashboard)/dashboard/stock/grn/view/ClientPage.tsx', content);

  fs.writeFileSync('app/(dashboard)/dashboard/stock/grn/view/page.tsx', `'use client';
import ClientPage from './ClientPage';
import { Suspense } from 'react';

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><ClientPage /></Suspense>;
}
`);
}

// ------------------- STOCK ISSUE -------------------
ensureDir('app/(dashboard)/dashboard/stock/issue/view');
ensureDir('app/(dashboard)/dashboard/stock/issue/edit');
if (fs.existsSync('app/(dashboard)/dashboard/stock/issue/[id]/ClientPage.tsx')) {
  let content = fs.readFileSync('app/(dashboard)/dashboard/stock/issue/[id]/ClientPage.tsx', 'utf8');
  content = content.replace("({ params }: { params: { id: string } })", "()");
  content = content.replace("const id = params.id;", "const searchParams = useSearchParams();\n  const id = searchParams.get('id');");
  if (!content.includes('useSearchParams')) {
    content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';");
  }
  fs.writeFileSync('app/(dashboard)/dashboard/stock/issue/view/ClientPage.tsx', content);

  fs.writeFileSync('app/(dashboard)/dashboard/stock/issue/view/page.tsx', `'use client';
import ClientPage from './ClientPage';
import { Suspense } from 'react';

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><ClientPage /></Suspense>;
}
`);
}
if (fs.existsSync('app/(dashboard)/dashboard/stock/issue/[id]/edit/ClientPage.tsx')) {
  let content = fs.readFileSync('app/(dashboard)/dashboard/stock/issue/[id]/edit/ClientPage.tsx', 'utf8');
  content = content.replace("({ params }: { params: { id: string } })", "()");
  content = content.replace("const id = params.id;", "const searchParams = useSearchParams();\n  const id = searchParams.get('id');");
  if (!content.includes('useSearchParams')) {
    content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';");
  }
  fs.writeFileSync('app/(dashboard)/dashboard/stock/issue/edit/ClientPage.tsx', content);

  fs.writeFileSync('app/(dashboard)/dashboard/stock/issue/edit/page.tsx', `'use client';
import ClientPage from './ClientPage';
import { Suspense } from 'react';

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><ClientPage /></Suspense>;
}
`);
}

// ------------------- STOCK RETURN -------------------
ensureDir('app/(dashboard)/dashboard/stock/return/view');
if (fs.existsSync('app/(dashboard)/dashboard/stock/return/[id]/ClientPage.tsx')) {
  let content = fs.readFileSync('app/(dashboard)/dashboard/stock/return/[id]/ClientPage.tsx', 'utf8');
  content = content.replace("({ params }: { params: { id: string } })", "()");
  content = content.replace("const id = params.id;", "const searchParams = useSearchParams();\n  const id = searchParams.get('id');");
  if (!content.includes('useSearchParams')) {
    content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';");
  }
  fs.writeFileSync('app/(dashboard)/dashboard/stock/return/view/ClientPage.tsx', content);

  fs.writeFileSync('app/(dashboard)/dashboard/stock/return/view/page.tsx', `'use client';
import ClientPage from './ClientPage';
import { Suspense } from 'react';

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><ClientPage /></Suspense>;
}
`);
}

// ------------------- STOCK ADJUSTMENT -------------------
ensureDir('app/(dashboard)/dashboard/stock/adjustment/view');
if (fs.existsSync('app/(dashboard)/dashboard/stock/adjustment/[id]/ClientPage.tsx')) {
  let content = fs.readFileSync('app/(dashboard)/dashboard/stock/adjustment/[id]/ClientPage.tsx', 'utf8');
  content = content.replace("({ params }: { params: { id: string } })", "()");
  content = content.replace("const id = params.id;", "const searchParams = useSearchParams();\n  const id = searchParams.get('id');");
  if (!content.includes('useSearchParams')) {
    content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';");
  }
  fs.writeFileSync('app/(dashboard)/dashboard/stock/adjustment/view/ClientPage.tsx', content);

  fs.writeFileSync('app/(dashboard)/dashboard/stock/adjustment/view/page.tsx', `'use client';
import ClientPage from './ClientPage';
import { Suspense } from 'react';

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><ClientPage /></Suspense>;
}
`);
}

// ------------------- STOCK TAKING -------------------
ensureDir('app/(dashboard)/dashboard/stock/taking/view');
if (fs.existsSync('app/(dashboard)/dashboard/stock/taking/[id]/ClientPage.tsx')) {
  let content = fs.readFileSync('app/(dashboard)/dashboard/stock/taking/[id]/ClientPage.tsx', 'utf8');
  content = content.replace("({ params }: { params: { id: string } })", "()");
  content = content.replace("const id = params.id;", "const searchParams = useSearchParams();\n  const id = searchParams.get('id');");
  if (!content.includes('useSearchParams')) {
    content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';");
  }
  fs.writeFileSync('app/(dashboard)/dashboard/stock/taking/view/ClientPage.tsx', content);

  fs.writeFileSync('app/(dashboard)/dashboard/stock/taking/view/page.tsx', `'use client';
import ClientPage from './ClientPage';
import { Suspense } from 'react';

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><ClientPage /></Suspense>;
}
`);
}

// ------------------- STOCK TRANSFER -------------------
ensureDir('app/(dashboard)/dashboard/stock/transfer/view');
if (fs.existsSync('app/(dashboard)/dashboard/stock/transfer/[id]/ClientPage.tsx')) {
  let content = fs.readFileSync('app/(dashboard)/dashboard/stock/transfer/[id]/ClientPage.tsx', 'utf8');
  content = content.replace("({ params }: { params: { id: string } })", "()");
  content = content.replace("const id = params.id;", "const searchParams = useSearchParams();\n  const id = searchParams.get('id');");
  if (!content.includes('useSearchParams')) {
    content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';");
  }
  fs.writeFileSync('app/(dashboard)/dashboard/stock/transfer/view/ClientPage.tsx', content);

  fs.writeFileSync('app/(dashboard)/dashboard/stock/transfer/view/page.tsx', `'use client';
import ClientPage from './ClientPage';
import { Suspense } from 'react';

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><ClientPage /></Suspense>;
}
`);
}

// ------------------- STORE SUB-CATEGORIES -------------------
ensureDir('app/(dashboard)/dashboard/store/sub-categories/view');
if (fs.existsSync('app/(dashboard)/dashboard/store/sub-categories/[id]/ClientPage.tsx')) {
  let content = fs.readFileSync('app/(dashboard)/dashboard/store/sub-categories/[id]/ClientPage.tsx', 'utf8');
  content = content.replace("({ params }: { params: { id: string } })", "()");
  content = content.replace("const id = params.id;", "const searchParams = useSearchParams();\n  const id = searchParams.get('id');");
  if (!content.includes('useSearchParams')) {
    content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter, useSearchParams } from 'next/navigation';");
  }
  fs.writeFileSync('app/(dashboard)/dashboard/store/sub-categories/view/ClientPage.tsx', content);

  fs.writeFileSync('app/(dashboard)/dashboard/store/sub-categories/view/page.tsx', `'use client';
import ClientPage from './ClientPage';
import { Suspense } from 'react';

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><ClientPage /></Suspense>;
}
`);
}

console.log("Static routes generated successfully.");
