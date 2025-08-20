const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

const projectRoot = path.join(__dirname, '..');
const directoriesToScan = ['app', 'lib', 'components'];
const fileExtensions = ['.js', '.ts', '.tsx'];

// Padrões a serem procurados
const patterns = {
  hardcodedEmail: /['"]lhost2025@gmail.com['"]|['"]admin@exemplo.com['']/,
  hardcodedEmailVariable: /HARDCODED_ADMIN_EMAILS/,
  directRoleCheck: /\.from\(['"]users['"]\)\.select\(['"]role['"]\)/,
};

const adminApiRoutesPath = path.join(projectRoot, 'app', 'api', 'admin');
const adminDashboardPath = path.join(projectRoot, 'app', 'dashboard', 'admin');

async function analyzeFile(filePath) {
  const relativePath = path.relative(projectRoot, filePath);
  
  if (!fileExtensions.includes(path.extname(filePath))) {
    return [];
  }

  const issues = [];
  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  // Verificação 1: Padrões de código hardcoded
  lines.forEach((line, index) => {
    if (patterns.hardcodedEmail.test(line)) {
      issues.push({ file: relativePath, line: index + 1, issue: 'E-mail de administrador encontrado no código (hardcoded).' });
    }
    if (patterns.hardcodedEmailVariable.test(line)) {
      issues.push({ file: relativePath, line: index + 1, issue: 'Variável "HARDCODED_ADMIN_EMAILS" encontrada.' });
    }
    // Verificação 2: Verificação de role direta (fora dos arquivos permitidos)
    if (patterns.directRoleCheck.test(line) && relativePath !== 'lib/admin-actions.ts' && relativePath !== 'lib/settings-actions.ts') {
       issues.push({ file: relativePath, line: index + 1, issue: 'Verificação de role direta no banco de dados. Deve-se usar a função checkIsAdmin().' });
    }
  });

  // Verificação 3: Rotas de admin sem a chamada para checkIsAdmin()
  if (filePath.startsWith(adminApiRoutesPath) || filePath.startsWith(adminDashboardPath)) {
    if (!content.includes('checkIsAdmin') && !content.includes('checkAdminAccess')) {
      // O layout do dashboard de admin já faz a verificação, então as páginas filhas não precisam.
      // Esta é uma verificação simples que pode ter falsos positivos.
      if (path.basename(filePath) !== 'layout.tsx' && relativePath !== 'app/dashboard/admin/page.tsx') {
         issues.push({ file: relativePath, line: 1, issue: 'Arquivo de admin pode estar sem verificação de role (checkIsAdmin/checkAdminAccess).' });
      }
    }
  }

  return issues;
}

async function scanDirectory(dirPath) {
  let issues = [];
  try {
    const files = await readdir(dirPath);

    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const fileStat = await stat(fullPath);

      if (fileStat.isDirectory()) {
        if (file !== 'node_modules' && file !== '.next') {
          issues = issues.concat(await scanDirectory(fullPath));
        }
      } else {
        issues = issues.concat(await analyzeFile(fullPath));
      }
    }
  } catch (error) {
    console.error(`Erro ao escanear o diretório ${dirPath}: ${error.message}`);
  }
  return issues;
}

async function main() {
  console.log('🔍 Iniciando análise da lógica de verificação de roles...');
  let allIssues = [];

  for (const dir of directoriesToScan) {
    const fullPath = path.join(projectRoot, dir);
    allIssues = allIssues.concat(await scanDirectory(fullPath));
  }
  
  // Remove duplicatas
  const uniqueIssues = allIssues.filter((issue, index, self) => 
    index === self.findIndex((t) => (
      t.file === issue.file && t.line === issue.line && t.issue === issue.issue
    ))
  );

  if (uniqueIssues.length === 0) {
    console.log('✅ Nenhum problema encontrado. A verificação de roles parece consistente.');
    return;
  }

  console.log(`\n🚨 Encontrados ${uniqueIssues.length} problemas potenciais:\n`);
  uniqueIssues.forEach(issue => {
    console.log(`- [Arquivo]: ${issue.file}:${issue.line}`);
    console.log(`  [Problema]: ${issue.issue}\n`);
  });
}

main().catch(console.error);