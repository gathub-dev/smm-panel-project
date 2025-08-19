import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { provider, services } = await request.json()
    
    console.log(`🚀 [IMPORT] Importando ${services.length} serviços do ${provider}`)
    
    // Verificar se é admin
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não autenticado'
      }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "admin") {
      return NextResponse.json({
        success: false,
        error: 'Acesso negado - apenas administradores'
      }, { status: 403 })
    }
    
    let importedCount = 0
    let skippedCount = 0
    let errorCount = 0
    const errors: string[] = []
    
    // Função para extrair plataforma do nome do serviço
    function extractPlatform(serviceName: string, category: string) {
      const name = serviceName.toLowerCase()
      const cat = category.toLowerCase()
      
      if (name.includes('instagram') || cat.includes('instagram')) return 'Instagram'
      if (name.includes('tiktok') || cat.includes('tiktok')) return 'TikTok'
      if (name.includes('youtube') || cat.includes('youtube')) return 'YouTube'
      if (name.includes('spotify') || cat.includes('spotify')) return 'Spotify'
      if (name.includes('facebook') || cat.includes('facebook')) return 'Facebook'
      if (name.includes('twitch') || cat.includes('twitch')) return 'Twitch'
      if (name.includes('telegram') || cat.includes('telegram')) return 'Telegram'
      if (name.includes('discord') || cat.includes('discord')) return 'Discord'
      if (name.includes('reddit') || cat.includes('reddit')) return 'Reddit'
      if (name.includes('google') || cat.includes('google')) return 'Google'
      if (name.includes('linkedin') || cat.includes('linkedin')) return 'LinkedIn'
      if (name.includes('pinterest') || cat.includes('pinterest')) return 'Pinterest'
      if (name.includes('snapchat') || cat.includes('snapchat')) return 'Snapchat'
      if (name.includes('soundcloud') || cat.includes('soundcloud')) return 'SoundCloud'
      if (name.includes('vimeo') || cat.includes('vimeo')) return 'Vimeo'
      if (name.includes('clubhouse') || cat.includes('clubhouse')) return 'Clubhouse'
      if (name.includes('threads') || cat.includes('threads')) return 'Threads'
      if (name.includes('trustpilot') || cat.includes('trustpilot')) return 'Trustpilot'
      if (name.includes('kick') || cat.includes('kick')) return 'Kick'
      if (name.includes('rumble') || cat.includes('rumble')) return 'Rumble'
      if (name.includes('website') || cat.includes('website') || name.includes('traffic')) return 'Website'
      
      return 'Outros'
    }
    
    // Função para extrair tipo de serviço
    function extractServiceType(serviceName: string, category: string) {
      const name = serviceName.toLowerCase()
      const cat = category.toLowerCase()
      
      if (name.includes('followers') || name.includes('subscriber') || name.includes('member')) return 'seguidores'
      if (name.includes('likes') || name.includes('reactions') || name.includes('hearts')) return 'curtidas'
      if (name.includes('views') || name.includes('plays') || name.includes('streams')) return 'visualizacoes'
      if (name.includes('comments') || name.includes('replies')) return 'comentarios'
      if (name.includes('shares') || name.includes('retweets') || name.includes('reposts')) return 'compartilhamentos'
      if (name.includes('saves') || name.includes('bookmarks')) return 'salvamentos'
      if (name.includes('story') || name.includes('stories')) return 'stories'
      if (name.includes('live') || name.includes('livestream')) return 'live'
      if (name.includes('impressions') || name.includes('reach')) return 'impressoes'
      if (name.includes('accounts') || name.includes('profiles')) return 'contas'
      if (name.includes('traffic') || name.includes('visitors')) return 'trafego'
      
      return 'outros'
    }
    
    // Processar cada serviço
    for (const service of services) {
      try {
        // Verificar se já existe
        const { data: existingService } = await supabase
          .from('services')
          .select('id')
          .eq('provider', provider)
          .eq('provider_service_id', service.service)
          .single()
        
        if (existingService) {
          skippedCount++
          continue
        }
        
        const platformName = extractPlatform(service.name, service.category)
        const serviceTypeName = extractServiceType(service.name, service.category)
        
        // Criar/obter plataforma
        const { data: platformId, error: platformError } = await supabase
          .rpc('get_or_create_platform', { platform_name: platformName })
        
        if (platformError) {
          errorCount++
          errors.push(`Erro ao criar plataforma ${platformName}: ${platformError.message}`)
          continue
        }
        
        // Criar/obter tipo de serviço
        const { data: serviceTypeId, error: serviceTypeError } = await supabase
          .rpc('get_or_create_service_type', { type_name: serviceTypeName })
        
        if (serviceTypeError) {
          errorCount++
          errors.push(`Erro ao criar tipo de serviço ${serviceTypeName}: ${serviceTypeError.message}`)
          continue
        }
        
        // Calcular preço com markup (20% padrão)
        const providerRate = parseFloat(service.rate)
        const markupValue = 20 // 20% padrão
        const finalRate = providerRate * (1 + markupValue / 100)
        
        // Inserir serviço
        const { error: insertError } = await supabase
          .from('services')
          .insert({
            platform_id: platformId,
            service_type_id: serviceTypeId,
            provider_service_id: service.service,
            name: service.name,
            description: service.name,
            provider: provider,
            provider_rate: providerRate,
            rate: finalRate,
            min_quantity: parseInt(service.min),
            max_quantity: parseInt(service.max),
            service_type: service.type,
            dripfeed: service.dripfeed,
            refill: service.refill,
            cancel: service.cancel,
            status: 'active',
            markup_type: 'percentage',
            markup_value: markupValue,
            platform: platformName, // Campo legado
            category: service.category, // Campo legado
            sync_enabled: true
          })
        
        if (insertError) {
          errorCount++
          errors.push(`Erro ao inserir serviço ${service.service}: ${insertError.message}`)
          continue
        }
        
        importedCount++
        
      } catch (error: any) {
        errorCount++
        errors.push(`Erro ao processar serviço ${service.service}: ${error.message}`)
      }
    }
    
    console.log(`✅ [IMPORT] Resultado: ${importedCount} importados, ${skippedCount} já existiam, ${errorCount} erros`)
    
    return NextResponse.json({
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      errors: errorCount,
      errorMessages: errors.slice(0, 5), // Limitar erros mostrados
      message: `${importedCount} serviços importados com sucesso!`
    })
    
  } catch (error: any) {
    console.error('❌ [IMPORT] Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}
