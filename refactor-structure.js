const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'Frontend', 'src', 'pages');

const filesToMove = [
  { file: 'Login.tsx', folder: 'Login', isRoot: true },
  { file: 'admin/Dashboard.tsx', folder: 'admin/Dashboard' },
  { file: 'admin/ManageOrders.tsx', folder: 'admin/ManageOrders' },
  { file: 'admin/ManageEmployees.tsx', folder: 'admin/ManageEmployees' },
  { file: 'admin/ApproveLeaves.tsx', folder: 'admin/ApproveLeaves' },
  { file: 'employee/Dashboard.tsx', folder: 'employee/Dashboard' },
  { file: 'employee/ApplyLeave.tsx', folder: 'employee/ApplyLeave' },
  { file: 'employee/LeaveHistory.tsx', folder: 'employee/LeaveHistory' },
];

for (const item of filesToMove) {
  const oldPath = path.join(pagesDir, item.file);
  const folderPath = path.join(pagesDir, item.folder);
  const newPath = path.join(folderPath, 'index.tsx');
  const cssPath = path.join(folderPath, `${path.basename(item.folder)}.css`);
  
  if (!fs.existsSync(oldPath)) {
     console.log(`Skipping ${oldPath}, not found.`);
     continue;
  }

  // Create folder
  fs.mkdirSync(folderPath, { recursive: true });
  
  let content = fs.readFileSync(oldPath, 'utf8');
  
  // Fix deep api imports
  content = content.replace(/from '\.\.\/api'/g, "from '../../api'");
  content = content.replace(/from '\.\.\/\.\.\/api'/g, "from '../../../api'");
  content = content.replace(/from '\.\.\/context/g, "from '../../context");
  content = content.replace(/from '\.\.\/\.\.\/context/g, "from '../../../context");
  
  // Fix sibling imports like './ApproveLeaves' -> '../ApproveLeaves'
  content = content.replace(/from '\.\/ApproveLeaves'/g, "from '../ApproveLeaves'");
  content = content.replace(/from '\.\/ManageOrders'/g, "from '../ManageOrders'");
  content = content.replace(/from '\.\/ManageEmployees'/g, "from '../ManageEmployees'");
  content = content.replace(/from '\.\/ApplyLeave'/g, "from '../ApplyLeave'");
  content = content.replace(/from '\.\/LeaveHistory'/g, "from '../LeaveHistory'");

  // Add CSS import
  const cssName = `${path.basename(item.folder)}.css`;
  content = `import './${cssName}';\n` + content;
  
  fs.writeFileSync(newPath, content, 'utf8');
  fs.writeFileSync(cssPath, '', 'utf8');
  console.log(`Moved ${item.file} -> ${item.folder}/index.tsx`);
  
  fs.unlinkSync(oldPath);
}
console.log('Refactor complete.');
