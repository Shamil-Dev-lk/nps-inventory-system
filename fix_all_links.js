const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      callback(dirPath);
    }
  });
}

walkDir('app', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Add trailing slashes before ?id= or ?type= if /view or /edit or /new or /print is missing trailing slash
  content = content.replace(/\/dashboard\/items\/view\?id=/g, '/dashboard/items/view/?id=');
  content = content.replace(/\/dashboard\/items\/edit\?id=/g, '/dashboard/items/edit/?id=');
  
  content = content.replace(/\/dashboard\/store\/suppliers\/view\?id=/g, '/dashboard/store/suppliers/view/?id=');
  content = content.replace(/\/dashboard\/store\/suppliers\/edit\?id=/g, '/dashboard/store/suppliers/edit/?id=');

  content = content.replace(/\/dashboard\/purchase\/orders\/view\?id=/g, '/dashboard/purchase/orders/view/?id=');
  content = content.replace(/\/dashboard\/purchase\/orders\/edit\?id=/g, '/dashboard/purchase/orders/edit/?id=');

  content = content.replace(/\/dashboard\/purchase\/requests\/view\?id=/g, '/dashboard/purchase/requests/view/?id=');
  content = content.replace(/\/dashboard\/purchase\/requests\/edit\?id=/g, '/dashboard/purchase/requests/edit/?id=');

  content = content.replace(/\/dashboard\/stock\/grn\/view\?id=/g, '/dashboard/stock/grn/view/?id=');
  content = content.replace(/\/dashboard\/stock\/issue\/view\?id=/g, '/dashboard/stock/issue/view/?id=');
  content = content.replace(/\/dashboard\/stock\/issue\/edit\?id=/g, '/dashboard/stock/issue/edit/?id=');
  content = content.replace(/\/dashboard\/stock\/return\/view\?id=/g, '/dashboard/stock/return/view/?id=');
  content = content.replace(/\/dashboard\/stock\/adjustment\/view\?id=/g, '/dashboard/stock/adjustment/view/?id=');
  content = content.replace(/\/dashboard\/stock\/taking\/view\?id=/g, '/dashboard/stock/taking/view/?id=');
  content = content.replace(/\/dashboard\/stock\/transfer\/view\?id=/g, '/dashboard/stock/transfer/view/?id=');

  content = content.replace(/\/dashboard\/receipts\/print\?/g, '/dashboard/receipts/print/?');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated links in:', filePath);
  }
});
