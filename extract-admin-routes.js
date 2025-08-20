#!/usr/bin/env node

/**
 * Script para extrair e testar todas as rotas do painel administrativo
 * Uso: node extract-admin-routes.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configurações
const BASE_URL = 'http://localhost:3000';
const OUTPUT_FILE = 'admin-routes-report.json';

// Lista de rotas administrativas identificadas
const ADMIN_ROUTES = {
  // Páginas do Dashboard Admin
  pages: [
    '/dashboard/admin',
    '/dashboard/admin/settings',
    '/dashboard/admin/sync', 
    '/dashboard/admin/users'
  ],
  
  // APIs Administrativas
  apis: [
    '/api/admin/import-services',
    '/api/admin/preview-services', 
    '/api/admin/translate-services',
    '/api/admin/check-api-keys'
  ],
  
  // Outras rotas relacionadas
  related: [
    '/dashboard',
    '/dashboard/services',
    '/dashboard/orders',
    '/dashboard/balance',
    '/dashboard/profile'
  ]
};

// Função para fazer requisição HTTP
function makeRequest(url, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'Admin-Routes-Extractor/1.0',
        'Accept': 'text/html,application/json,*/*',
        ...headers
      },
      timeout: 10000
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          url,
          method,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          contentLength: data.length,
          contentType: res.headers['content-type'] || 'unknown',
          responsePreview: data.substring(0, 500) + (data.length > 500 ? '...' : ''),
          timestamp: new Date().toISOString()
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url,
        method,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        method,
        error: 'Request timeout',
        timestamp: new Date().toISOString()
      });
    });
    
    req.end();
  });
}

// Função para testar uma lista de rotas
async function testRoutes(routes, category) {
  console.log(`\n🔍 Testando ${category}...`);
  const results = [];
  
  for (const route of routes) {
    const fullUrl = BASE_URL + route;
    console.log(`  → ${route}`);
    
    try {
      // Testar GET
      const getResult = await makeRequest(fullUrl, 'GET');
      results.push({ ...getResult, category, route });
      
      // Para APIs, também testar POST se apropriado
      if (route.startsWith('/api/')) {
        const postResult = await makeRequest(fullUrl, 'POST', {
          'Content-Type': 'application/json'
        });
        results.push({ ...postResult, category: category + ' (POST)', route });
      }
      
      // Pequena pausa entre requisições
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      results.push({
        url: fullUrl,
        route,
        category,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return results;
}

// Função para gerar relatório
function generateReport(results) {
  const report = {
    metadata: {
      baseUrl: BASE_URL,
      timestamp: new Date().toISOString(),
      totalRoutes: results.length,
      script: 'extract-admin-routes.js'
    },
    summary: {
      successful: results.filter(r => r.statusCode && r.statusCode < 400).length,
      redirects: results.filter(r => r.statusCode && r.statusCode >= 300 && r.statusCode < 400).length,
      clientErrors: results.filter(r => r.statusCode && r.statusCode >= 400 && r.statusCode < 500).length,
      serverErrors: results.filter(r => r.statusCode && r.statusCode >= 500).length,
      networkErrors: results.filter(r => r.error && !r.statusCode).length
    },
    routes: results
  };
  
  // Agrupar por categoria
  report.byCategory = {};
  results.forEach(result => {
    if (!report.byCategory[result.category]) {
      report.byCategory[result.category] = [];
    }
    report.byCategory[result.category].push(result);
  });
  
  return report;
}

// Função principal
async function main() {
  console.log('🚀 Iniciando extração de rotas administrativas...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  
  const allResults = [];
  
  try {
    // Testar páginas administrativas
    const pageResults = await testRoutes(ADMIN_ROUTES.pages, 'Admin Pages');
    allResults.push(...pageResults);
    
    // Testar APIs administrativas
    const apiResults = await testRoutes(ADMIN_ROUTES.apis, 'Admin APIs');
    allResults.push(...apiResults);
    
    // Testar rotas relacionadas
    const relatedResults = await testRoutes(ADMIN_ROUTES.related, 'Related Routes');
    allResults.push(...relatedResults);
    
    // Gerar relatório
    const report = generateReport(allResults);
    
    // Salvar relatório
    const outputPath = path.join(process.cwd(), OUTPUT_FILE);
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    
    // Exibir resumo
    console.log('\n📊 RESUMO DOS RESULTADOS:');
    console.log(`✅ Sucessos: ${report.summary.successful}`);
    console.log(`🔄 Redirecionamentos: ${report.summary.redirects}`);
    console.log(`❌ Erros do Cliente (4xx): ${report.summary.clientErrors}`);
    console.log(`💥 Erros do Servidor (5xx): ${report.summary.serverErrors}`);
    console.log(`🌐 Erros de Rede: ${report.summary.networkErrors}`);
    
    console.log('\n📁 ROTAS POR CATEGORIA:');
    Object.keys(report.byCategory).forEach(category => {
      console.log(`  ${category}: ${report.byCategory[category].length} rotas`);
    });
    
    console.log(`\n💾 Relatório completo salvo em: ${outputPath}`);
    
    // Exibir algumas rotas interessantes
    console.log('\n🔍 ROTAS MAIS INTERESSANTES:');
    const interesting = allResults.filter(r => 
      r.statusCode === 200 || 
      r.statusCode === 302 || 
      (r.statusCode >= 400 && r.statusCode < 500)
    ).slice(0, 10);
    
    interesting.forEach(route => {
      const status = route.statusCode ? `${route.statusCode}` : 'ERROR';
      const type = route.contentType ? route.contentType.split(';')[0] : 'unknown';
      console.log(`  ${status} | ${type} | ${route.route}`);
    });
    
  } catch (error) {
    console.error('❌ Erro durante a execução:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { makeRequest, testRoutes, generateReport };
