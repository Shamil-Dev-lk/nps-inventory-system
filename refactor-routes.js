const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const appDir = path.join(__dirname, 'app');

walkDir(appDir, (filePath) => {
    if (filePath.endsWith('page.tsx') && filePath.includes('[id]')) {
        const clientPagePath = filePath.replace('page.tsx', 'ClientPage.tsx');
        
        // Rename page.tsx to ClientPage.tsx
        fs.renameSync(filePath, clientPagePath);
        
        // Create new Server Component page.tsx
        const serverPageContent = `import ClientPage from './ClientPage';

export function generateStaticParams() {
  return [];
}

export default function Page(props: any) {
  return <ClientPage {...props} />;
}
`;
        fs.writeFileSync(filePath, serverPageContent);
        console.log('Refactored:', filePath);
    }
});
