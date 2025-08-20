import { NextRequest, NextResponse } from 'next/server'
import { translationService } from '@/lib/translation-service'
import { createClient } from '@/lib/supabase/server'
import { checkIsAdmin } from '@/lib/admin-actions'

export async function POST(request: NextRequest) {
  try {
    const { provider, services, translateOnImport = false } = await request.json()

    // Verificar se o usuário é admin
    const isAdmin = await checkIsAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Acesso negado - apenas administradores",
        },
        { status: 403 }
      )
    }

    // Criar cliente Supabase para operações no banco
    const supabase = await createClient()
    
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
          .select('*')
          .eq('provider', provider) 
          .eq('provider_service_id', service.service)
          .single()
        
        if (existingService) {
          skippedCount++
          continue
        }
        
        // Aplicar tradução se solicitado
        let serviceName = service.name
        let serviceCategory = service.category
        let serviceDescription = service.name
        
        if (translateOnImport) {
          try {
            serviceName = await translationService.translateToPortuguese(service.name)
            serviceCategory = await translationService.translateToPortuguese(service.category)
            serviceDescription = serviceName
          } catch (error) {
            // Manter valores originais se tradução falhar
          }
        }
        
        const platformName = extractPlatform(serviceName, serviceCategory)
        const serviceTypeName = extractServiceType(serviceName, serviceCategory)
        
        // Criar/obter plataforma
        let platformId = 1
        
        try {
          const { data: existingPlatform } = await supabase
            .from('platforms')
            .select('*')
            .eq('name', platformName)
            .single()
          
          if (existingPlatform) {
            platformId = existingPlatform.id
          } else {
            const { data: newPlatform, error: platformError } = await supabase
              .from('platforms')
              .insert({ name: platformName, slug: platformName.toLowerCase() })
              .select()
              .single()
            
            if (platformError || !newPlatform) {
              errorCount++
              errors.push(`Erro ao criar plataforma ${platformName}: ${platformError?.message || 'Dados não retornados'}`)
              continue
            }
            
            platformId = newPlatform.id
          }
        } catch (error: any) {
          errorCount++
          errors.push(`Erro ao processar plataforma ${platformName}: ${error.message}`)
          continue
        }
        
        // Criar/obter tipo de serviço
        let serviceTypeId = 1
        
        try {
          const { data: existingType } = await supabase
            .from('service_types')
            .select('*')
            .eq('name', serviceTypeName)
            .single()
          
          if (existingType) {
            serviceTypeId = existingType.id
          } else {
            const { data: newType, error: typeError } = await supabase
              .from('service_types')
              .insert({ name: serviceTypeName, slug: serviceTypeName.toLowerCase() })
              .select()
              .single()
            
            if (typeError || !newType) {
              errorCount++
              errors.push(`Erro ao criar tipo de serviço ${serviceTypeName}: ${typeError?.message || 'Dados não retornados'}`)
              continue
            }
            
            serviceTypeId = newType.id
          }
        } catch (error: any) {
          errorCount++
          errors.push(`Erro ao processar tipo de serviço ${serviceTypeName}: ${error.message}`)
          continue
        }
        
        // Calcular preço com markup (20% padrão)
        const providerRate = parseFloat(service.rate)
        const markupValue = 20
        const finalRate = providerRate * (1 + markupValue / 100)
        
        // Inserir serviço
        const serviceData = {
          platform_id: platformId,
          service_type_id: serviceTypeId,
          provider_service_id: service.service,
          name: serviceName,
          description: serviceDescription,
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
          platform: platformName,
          category: serviceCategory,
          sync_enabled: true
        }
        
        const { error: insertError } = await supabase
          .from('services')
          .insert(serviceData)
        
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
    
    const message = translateOnImport 
      ? `${importedCount} serviços importados e traduzidos com sucesso!`
      : `${importedCount} serviços importados com sucesso!`
    
    return NextResponse.json({
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      errors: errorCount,
      errorMessages: errors.slice(0, 5),
      translated: translateOnImport,
      message
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}
