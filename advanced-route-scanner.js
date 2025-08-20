#!/usr/bin/env node

/**
 * Scanner avançado de rotas administrativas
 * Descobre rotas dinamicamente analisando o código fonte
 * Uso: node advanced-route-scanner.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Configurações
const BASE_URL = 'http://localhost:3000';
const PROJECT_ROOT = process.cwd();
const OUTPUT_FILE = 'complete-routes-analysis.json';

// Função para escanear arquivos de rota
function scanRouteFiles(directory) {
  const routes = {
    pages: [],
    apis: [],
    dynamic: []
  };
  
  function scanDirectory(dir, basePath = '') {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Diretórios dinâmicos [param]
          if (item.startsWith('[') && item.endsWith(']')) {
            const paramName = item.slice(1, -1);
            routes.dynamic.push({
              path: basePath + '/' + item,
              param: paramName,
              type: 'dynamic'
            });
          }
          
          // Continuar escaneando subdiretórios
          scanDirectory(fullPath, basePath + '/' + item);
          
        } else if (item === 'page.tsx' || item === 'route.ts') {
          const routePath = basePath || '/';
          
          if (item === 'route.ts') {
            routes.apis.push(routePath);
          } else {
            routes.pages.push(routePath);
          }
        }
      }
    } catch (error) {
      console.warn(`Erro ao escanear ${dir}:`, error.message);
    }
  }
  
  scanDirectory(directory);
  return routes;
}

// Função para extrair rotas do código
function extractRoutesFromCode() {
  const routes = {
    nextjs: scanRouteFiles(path.join(PROJECT_ROOT, 'app')),
    components: [],
    actions: []
  };
  
  // Escanear componentes por links e navegação
  try {
    const componentsDir = path.join(PROJECT_ROOT, 'components');
    if (fs.existsSync(componentsDir)) {
      const componentFiles = fs.readdirSync(componentsDir)
        .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'));
      
      for (const file of componentFiles) {
        const content = fs.readFileSync(path.join(componentsDir, file), 'utf8');
        
        // Procurar por hrefs e navegação
        const hrefMatches = content.match(/href=["']([^"']+)["']/g) || [];
        const routerMatches = content.match(/router\.push\(["']([^"']+)["']\)/g) || [];
        
        hrefMatches.forEach(match => {
          const route = match.match(/href=["']([^"']+)["']/)[1];
          if (route.startsWith('/') && !routes.components.includes(route)) {
            routes.components.push(route);
          }
        });
        
        routerMatches.forEach(match => {
          const route = match.match(/router\.push\(["']([^"']+)["']\)/)[1];
          if (route.startsWith('/') && !routes.components.includes(route)) {
            routes.components.push(route);
          }
        });
      }
    }
  } catch (error) {
    console.warn('Erro ao escanear componentes:', error.message);
  }
  
  // Escanear actions por endpoints
  try {
    const libDir = path.join(PROJECT_ROOT, 'lib');
    if (fs.existsSync(libDir)) {
      const actionFiles = fs.readdirSync(libDir)
        .filter(file => file.endsWith('-actions.ts'));
      
      for (const file of actionFiles) {
        const content = fs.readFileSync(path.join(libDir, file), 'utf8');
        
        // Procurar por chamadas de API
        const apiMatches = content.match(/['"`]\/api\/[^'"`]+['"`]/g) || [];
        
        apiMatches.forEach(match => {
          const route = match.replace(/['"`]/g, '');
          if (!routes.actions.includes(route)) {
            routes.actions.push(route);
          }
        });
      }
    }
  } catch (error) {
    console.warn('Erro ao escanear actions:', error.message);
  }
  
  return routes;
}

// Função para testar uma rota
async function testRoute(route, method = 'GET') {
  return new Promise((resolve) => {
    const url = BASE_URL + route;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: method,
      headers: {
        'User-Agent': 'Advanced-Route-Scanner/1.0',
        'Accept': 'text/html,application/json,*/*'
      },
      timeout: 5000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          route,
          method,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          contentType: res.headers['content-type'] || 'unknown',
          contentLength: data.length,
          headers: Object.keys(res.headers),
          timestamp: new Date().toISOString()
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        route,
        method,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        route,
        method,
        error: 'Timeout',
        timestamp: new Date().toISOString()
      });
    });
    
    req.end();
  });
}

// Função principal
async function main() {
  console.log('🔍 Iniciando scanner avançado de rotas...');
  console.log(`📂 Projeto: ${PROJECT_ROOT}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  
  // Extrair rotas do código
  console.log('\n📋 Extraindo rotas do código fonte...');
  const discoveredRoutes = extractRoutesFromCode();
  
  // Compilar lista única de rotas
  const allRoutes = new Set();
  
  // Adicionar rotas descobertas
  discoveredRoutes.nextjs.pages.forEach(route => allRoutes.add(route));
  discoveredRoutes.nextjs.apis.forEach(route => allRoutes.add(route));
  discoveredRoutes.components.forEach(route => allRoutes.add(route));
  discoveredRoutes.actions.forEach(route => allRoutes.add(route));
  
  // Adicionar rotas administrativas específicas
  const adminRoutes = [
    '/dashboard/admin',
    '/dashboard/admin/settings',
    '/dashboard/admin/sync',
    '/dashboard/admin/users',
    '/api/admin/import-services',
    '/api/admin/preview-services',
    '/api/admin/translate-services',
    '/api/admin/check-api-keys'
  ];
  
  adminRoutes.forEach(route => allRoutes.add(route));
  
  const routesList = Array.from(allRoutes).sort();
  
  console.log(`✅ Encontradas ${routesList.length} rotas únicas`);
  
  // Testar todas as rotas
  console.log('\n🧪 Testando rotas...');
  const results = [];
  
  for (let i = 0; i < routesList.length; i++) {
    const route = routesList[i];
    process.stdout.write(`\r  Progresso: ${i + 1}/${routesList.length} - ${route}`);
    
    const result = await testRoute(route);
    results.push(result);
    
    // Testar POST para APIs
    if (route.startsWith('/api/')) {
      const postResult = await testRoute(route, 'POST');
      results.push(postResult);
    }
    
    // Pequena pausa
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log('\n');
  
  // Gerar relatório completo
  const report = {
    metadata: {
      baseUrl: BASE_URL,
      projectRoot: PROJECT_ROOT,
      timestamp: new Date().toISOString(),
      totalRoutesDiscovered: routesList.length,
      totalTestsRun: results.length
    },
    discovery: {
      nextjsPages: discoveredRoutes.nextjs.pages,
      nextjsApis: discoveredRoutes.nextjs.apis,
      dynamicRoutes: discoveredRoutes.nextjs.dynamic,
      componentRoutes: discoveredRoutes.components,
      actionRoutes: discoveredRoutes.actions
    },
    testing: {
      results: results,
      summary: {
        successful: results.filter(r => r.statusCode && r.statusCode < 400).length,
        redirects: results.filter(r => r.statusCode && r.statusCode >= 300 && r.statusCode < 400).length,
        clientErrors: results.filter(r => r.statusCode && r.statusCode >= 400 && r.statusCode < 500).length,
        serverErrors: results.filter(r => r.statusCode && r.statusCode >= 500).length,
        networkErrors: results.filter(r => r.error && !r.statusCode).length
      }
    }
  };
  
  // Salvar relatório
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
  
  // Exibir resumo
  console.log('📊 RESUMO FINAL:');
  console.log(`🔍 Rotas descobertas: ${routesList.length}`);
  console.log(`✅ Sucessos: ${report.testing.summary.successful}`);
  console.log(`🔄 Redirecionamentos: ${report.testing.summary.redirects}`);
  console.log(`❌ Erros 4xx: ${report.testing.summary.clientErrors}`);
  console.log(`💥 Erros 5xx: ${report.testing.summary.serverErrors}`);
  console.log(`🌐 Erros de rede: ${report.testing.summary.networkErrors}`);
  
  console.log('\n🎯 ROTAS ADMINISTRATIVAS FUNCIONAIS:');
  const workingAdminRoutes = results.filter(r => 
    r.route.includes('/admin') && 
    r.statusCode && 
    r.statusCode < 400
  );
  
  workingAdminRoutes.forEach(route => {
    console.log(`  ✅ ${route.statusCode} | ${route.route}`);
  });
  
  console.log(`\n💾 Relatório completo salvo em: ${OUTPUT_FILE}`);
}

// Executar
if (require.main === module) {
  main().catch(console.error);
}
