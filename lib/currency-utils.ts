/**
 * Converter USD para BRL
 */
export function convertUsdToBrl(usdAmount: number, exchangeRate: number): number {
  return usdAmount * exchangeRate
}

/**
 * Converter BRL para USD
 */
export function convertBrlToUsd(brlAmount: number, exchangeRate: number): number {
  return brlAmount / exchangeRate
}

/**
 * Formatar valor em Real brasileiro
 */
export function formatBRL(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount)
}

/**
 * Formatar valor em Dólar
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
} 