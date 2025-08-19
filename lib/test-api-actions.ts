"use server"

/**
 * Teste direto das APIs MTP/JAP do lado do servidor (sem CORS)
 */
export async function testAPIDirectly(provider: 'mtp' | 'jap', apiKey: string) {
  try {       
    const apiUrls = {
      mtp: 'https://morethanpanel.com/api/v2',
      jap: 'https://justanotherpanel.com/api/v2'
    }

    const response = await fetch(apiUrls[provider], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `key=${apiKey}&action=balance`
    })

    const responseText = await response.text()

    // Tentar parsear como JSON
    let parsedResponse
    try {
      parsedResponse = JSON.parse(responseText)
    } catch {
      parsedResponse = { raw: responseText }
    }

    return {
      success: true,
      provider,
      status: response.status,
      response: parsedResponse,
      isValid: !responseText.includes('error') && !responseText.includes('Error')
    }
  } catch (error) {
    return {
      success: false,
      provider,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Testar múltiplas chaves de uma vez
 */
export async function testMultipleAPIKeys(keys: Array<{provider: 'mtp' | 'jap', apiKey: string}>) {
  const results = []
  
  for (const { provider, apiKey } of keys) {
    if (apiKey && apiKey.trim()) {
      const result = await testAPIDirectly(provider, apiKey)
      results.push(result)
    } else {
      results.push({
        success: false,
        provider,
        error: 'Chave não fornecida'
      })
    }
  }
  
  return {
    success: true,
    results,
    summary: {
      total: results.length,
      valid: results.filter(r => r.success && r.isValid).length,
      invalid: results.filter(r => !r.success || !r.isValid).length
    }
  }
} 