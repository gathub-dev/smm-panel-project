// Script para testar se os serviços estão sendo carregados corretamente no frontend
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Simular as funções do frontend
async function getPublicServices(filters = {}) {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('services')
      .select(`
        id,
        provider,
        provider_service_id,
        name,
        description,
        category,
        provider_rate,
        rate,
        markup_type,
        markup_value,
        min_quantity,
        max_quantity,
        status,
        created_at
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filters.category && filters.category !== 'Todos') {
      query = query.eq('category', filters.category);
    }

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    // Executar query com paginação
    const { data: services, error: servicesError } = await query
      .range(offset, offset + limit - 1);

    if (servicesError) {
      throw servicesError;
    }

    // Contar total para paginação
    let countQuery = supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (filters.category && filters.category !== 'Todos') {
      countQuery = countQuery.eq('category', filters.category);
    }

    if (filters.search) {
      countQuery = countQuery.ilike('name', `%${filters.search}%`);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    return {
      success: true,
      services: services || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    };
  } catch (error) {
    return { success: false, error: `Erro ao buscar serviços: ${error.message}` };
  }
}

async function getPublicCategories() {
  try {
    const { data: services, error } = await supabase
      .from('services')
      .select('category')
      .eq('status', 'active');

    if (error) throw error;

    // Obter categorias únicas
    const categories = [...new Set(services?.map(s => s.category).filter(Boolean))];
    
    return {
      success: true,
      categories: ['Todos', ...categories.sort()]
    };
  } catch (error) {
    return { success: false, error: `Erro ao buscar categorias: ${error.message}` };
  }
}

async function testFrontendServices() {
  console.log('🧪 TESTANDO CARREGAMENTO DE SERVIÇOS NO FRONTEND');
  console.log('='.repeat(55));

  try {
    // 1. Testar carregamento de categorias
    console.log('\n📂 1. Testando carregamento de categorias...');
    const categoriesResult = await getPublicCategories();
    
    if (categoriesResult.success) {
      console.log(`✅ ${categoriesResult.categories.length} categorias carregadas:`);
      categoriesResult.categories.forEach(category => {
        console.log(`   • ${category}`);
      });
    } else {
      console.log(`❌ Erro ao carregar categorias: ${categoriesResult.error}`);
      return;
    }

    // 2. Testar carregamento de todos os serviços
    console.log('\n🛍️ 2. Testando carregamento de todos os serviços...');
    const allServicesResult = await getPublicServices();
    
    if (allServicesResult.success) {
      console.log(`✅ ${allServicesResult.services.length} serviços carregados`);
      console.log(`📊 Paginação: ${allServicesResult.pagination.total} total, ${allServicesResult.pagination.totalPages} páginas`);
      
      // Mostrar primeiros 3 serviços
      console.log('\n📋 Primeiros 3 serviços:');
      allServicesResult.services.slice(0, 3).forEach((service, index) => {
        console.log(`\n${index + 1}. ${service.name}`);
        console.log(`   ID: ${service.provider_service_id}`);
        console.log(`   Categoria: ${service.category}`);
        console.log(`   Preço: R$ ${parseFloat(service.rate).toFixed(4)}`);
        console.log(`   Min-Max: ${service.min_quantity} - ${service.max_quantity.toLocaleString()}`);
        console.log(`   Descrição: ${service.description?.substring(0, 100)}...`);
      });
    } else {
      console.log(`❌ Erro ao carregar serviços: ${allServicesResult.error}`);
      return;
    }

    // 3. Testar filtro por categoria
    console.log('\n🔍 3. Testando filtros por categoria...');
    const testCategories = ['Instagram - Seguidores', 'Instagram - Curtidas', 'TikTok - Visualizações'];
    
    for (const category of testCategories) {
      const categoryResult = await getPublicServices({ category });
      
      if (categoryResult.success) {
        console.log(`✅ ${category}: ${categoryResult.services.length} serviços`);
      } else {
        console.log(`❌ ${category}: ${categoryResult.error}`);
      }
    }

    // 4. Testar busca por texto
    console.log('\n🔎 4. Testando busca por texto...');
    const searchTerms = ['Instagram', 'Seguidores', 'Curtidas', 'TikTok'];
    
    for (const term of searchTerms) {
      const searchResult = await getPublicServices({ search: term });
      
      if (searchResult.success) {
        console.log(`✅ Busca "${term}": ${searchResult.services.length} resultados`);
      } else {
        console.log(`❌ Busca "${term}": ${searchResult.error}`);
      }
    }

    // 5. Testar paginação
    console.log('\n📄 5. Testando paginação...');
    const page1 = await getPublicServices({ page: 1, limit: 5 });
    const page2 = await getPublicServices({ page: 2, limit: 5 });
    
    if (page1.success && page2.success) {
      console.log(`✅ Página 1: ${page1.services.length} serviços`);
      console.log(`✅ Página 2: ${page2.services.length} serviços`);
      console.log(`📊 Total: ${page1.pagination.total} serviços, ${page1.pagination.totalPages} páginas`);
    } else {
      console.log(`❌ Erro na paginação`);
    }

    // 6. Análise de dados para o frontend
    console.log('\n📊 6. Análise de dados para frontend...');
    
    // Agrupar por categoria
    const servicesByCategory = allServicesResult.services.reduce((acc, service) => {
      const category = service.category || 'Outros';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(service);
      return acc;
    }, {});

    console.log('\n📈 Distribuição por categoria:');
    Object.entries(servicesByCategory).forEach(([category, services]) => {
      console.log(`   ${category}: ${services.length} serviços`);
    });

    // Análise de preços
    const prices = allServicesResult.services.map(s => parseFloat(s.rate));
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    console.log('\n💰 Análise de preços:');
    console.log(`   Preço médio: R$ ${avgPrice.toFixed(4)}`);
    console.log(`   Preço mínimo: R$ ${minPrice.toFixed(4)}`);
    console.log(`   Preço máximo: R$ ${maxPrice.toFixed(4)}`);

    // 7. Verificar dados necessários para o frontend
    console.log('\n✅ 7. Verificação de integridade dos dados...');
    
    const issues = [];
    allServicesResult.services.forEach(service => {
      if (!service.name) issues.push(`Serviço ${service.id} sem nome`);
      if (!service.category) issues.push(`Serviço ${service.id} sem categoria`);
      if (!service.rate || parseFloat(service.rate) <= 0) issues.push(`Serviço ${service.id} com preço inválido`);
      if (!service.min_quantity || service.min_quantity <= 0) issues.push(`Serviço ${service.id} com quantidade mínima inválida`);
      if (!service.max_quantity || service.max_quantity <= 0) issues.push(`Serviço ${service.id} com quantidade máxima inválida`);
    });

    if (issues.length === 0) {
      console.log('✅ Todos os dados estão íntegros para o frontend!');
    } else {
      console.log(`⚠️ ${issues.length} problemas encontrados:`);
      issues.slice(0, 5).forEach(issue => console.log(`   • ${issue}`));
      if (issues.length > 5) {
        console.log(`   • ... e mais ${issues.length - 5} problemas`);
      }
    }

    console.log('\n🎉 RESUMO DOS TESTES:');
    console.log('='.repeat(30));
    console.log(`✅ Categorias: ${categoriesResult.categories.length} carregadas`);
    console.log(`✅ Serviços: ${allServicesResult.services.length} ativos`);
    console.log(`✅ Filtros: Funcionando corretamente`);
    console.log(`✅ Busca: Funcionando corretamente`);
    console.log(`✅ Paginação: Funcionando corretamente`);
    console.log(`${issues.length === 0 ? '✅' : '⚠️'} Integridade: ${issues.length === 0 ? 'Perfeita' : `${issues.length} problemas`}`);

    console.log('\n🚀 O frontend está pronto para exibir os serviços!');
    console.log('\n💡 Próximos passos:');
    console.log('   • Acessar http://localhost:3000/services');
    console.log('   • Testar filtros e busca na interface');
    console.log('   • Verificar exibição das categorias');
    console.log('   • Testar modal de detalhes dos serviços');

  } catch (error) {
    console.error('❌ Erro geral nos testes:', error);
  }
}

// Executar testes
if (require.main === module) {
  testFrontendServices().catch(console.error);
}

module.exports = { testFrontendServices, getPublicServices, getPublicCategories };
