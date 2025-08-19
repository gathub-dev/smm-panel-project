"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  RefreshCw, 
  DollarSign, 
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  EyeOff
} from "lucide-react"
import { toast } from "sonner"
import { 
  forceUpdateExchangeRate, 
  getExchangeRateInfo 
} from "@/lib/currency-actions"
import { 
  getSetting,
  saveSetting,
  getMultipleSettings
} from "@/lib/settings-actions"
import { recalculateAllServicesPrices } from "@/lib/recalculate-prices-actions"

interface ExchangeRateInfo {
  rate: number
  source: 'manual' | 'api' | 'cache'
  lastUpdate?: string
  provider?: string
}

export function CurrencyConfigSection() {
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [exchangeInfo, setExchangeInfo] = useState<ExchangeRateInfo | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)

  // Configurações simplificadas
  const [currencyMode, setCurrencyMode] = useState<'manual' | 'auto'>('manual')
  const [usdBrlRate, setUsdBrlRate] = useState('5.50')
  const [markupPercentage, setMarkupPercentage] = useState('20')

  useEffect(() => {
    loadCurrencyConfig()
  }, [])

  const loadCurrencyConfig = async () => {
    setLoading(true)
    try {
      console.log(`📋 [CurrencyConfig] Carregando configurações...`)
      
      // Carregar configurações (uma query só)
      const result = await getMultipleSettings([
        'currency_mode',
        'usd_brl_rate', 
        'markup_percentage'
      ])

      console.log(`📋 [CurrencyConfig] Resultado das configurações:`, result)

      if (result?.success && result.data) {
        const settings = result.data
        
        const mode = settings['currency_mode']?.value as 'manual' | 'auto' || 'manual'
        const rate = settings['usd_brl_rate']?.value || '5.50'
        const markup = settings['markup_percentage']?.value || '20'
        
        console.log(`📋 [CurrencyConfig] Configurações carregadas:`, { mode, rate, markup })
        
        setCurrencyMode(mode)
        setUsdBrlRate(rate)
        setMarkupPercentage(markup)
      } else {
        console.log(`⚠️ [CurrencyConfig] Usando valores padrão - erro:`, result?.error)
        setCurrencyMode('manual')
        setUsdBrlRate('5.50')
        setMarkupPercentage('20')
      }

      // Carregar informações da cotação (opcional, não bloqueia)
      loadExchangeRateInfo().catch(console.error)
    } catch (error) {
      console.log(`❌ [CurrencyConfig] Erro ao carregar configurações:`, error)
      toast.error("Erro ao carregar configurações")
      // Usar valores padrão em caso de erro
      setCurrencyMode('manual')
      setUsdBrlRate('5.50') 
      setMarkupPercentage('20')
    } finally {
      setLoading(false)
    }
  }

  const loadExchangeRateInfo = async () => {
    try {
      const info = await getExchangeRateInfo()
      setExchangeInfo(info)
    } catch (error) {
      console.error("Erro ao carregar informações da cotação:", error)
    }
  }

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      console.log(`🎯 [CurrencyConfig] Iniciando salvamento das configurações...`)
      
      const settings = [
        { key: 'currency_mode', value: currencyMode },
        { key: 'usd_brl_rate', value: usdBrlRate },
        { key: 'markup_percentage', value: markupPercentage }
      ]

      console.log(`🎯 [CurrencyConfig] Configurações para salvar:`, settings)

      // Salvar todas as configurações
      for (const setting of settings) {
        console.log(`🎯 [CurrencyConfig] Salvando: ${setting.key} = ${setting.value}`)
        
        const result = await saveSetting(setting.key, setting.value)
        
        console.log(`🎯 [CurrencyConfig] Resultado para ${setting.key}:`, result)
        
        if (!result.success) {
          console.log(`❌ [CurrencyConfig] Falha ao salvar ${setting.key}:`, result.error)
          throw new Error(result.error || `Erro ao salvar ${setting.key}`)
        }
        
        console.log(`✅ [CurrencyConfig] ${setting.key} salvo com sucesso!`)
      }

      console.log(`🎉 [CurrencyConfig] Todas as configurações salvas!`)
      toast.success("Configurações salvas com sucesso!")
      await loadExchangeRateInfo()
    } catch (error: any) {
      console.log(`❌ [CurrencyConfig] Erro geral:`, error)
      toast.error(error.message || "Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  const handleForceUpdate = async () => {
    setUpdating(true)
    try {
      const result = await forceUpdateExchangeRate()
      
      if (result.success) {
        toast.success(`Cotação atualizada: 1 USD = R$ ${result.rate?.toFixed(4)}`)
        await loadExchangeRateInfo()
      } else {
        toast.error(result.error || "Erro ao atualizar cotação")
      }
    } catch (error) {
      toast.error("Erro ao forçar atualização da cotação")
    } finally {
      setUpdating(false)
    }
  }

  const handleRecalculatePrices = async () => {
    setRecalculating(true)
    try {
      console.log(`🔄 [CurrencyConfig] Iniciando recálculo de preços...`)
      
      const result = await recalculateAllServicesPrices()
      
      console.log(`🔄 [CurrencyConfig] Resultado do recálculo:`, result)
      
      if (result.success) {
        toast.success(`${result.data?.servicesUpdated} serviços recalculados com sucesso!`)
      } else {
        toast.error(result.error || "Erro ao recalcular preços")
      }
    } catch (error) {
      console.log(`❌ [CurrencyConfig] Erro no recálculo:`, error)
      toast.error("Erro ao recalcular preços dos serviços")
    } finally {
      setRecalculating(false)
    }
  }

  const formatLastUpdate = (lastUpdate?: string) => {
    if (!lastUpdate) return 'Nunca'
    
    const date = new Date(lastUpdate)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 60) {
      return `${diffMinutes} minutos atrás`
    } else if (diffHours < 24) {
      return `${diffHours} horas atrás`
    } else {
      return date.toLocaleString('pt-BR')
    }
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'manual':
        return <Badge variant="secondary">Manual</Badge>
      case 'api':
        return <Badge variant="default">API</Badge>
      case 'cache':
        return <Badge variant="outline">Cache</Badge>
      default:
        return <Badge variant="secondary">Desconhecido</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Carregando configurações de câmbio...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status atual da cotação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Status Atual da Cotação
          </CardTitle>
          <CardDescription>
            Informações sobre a cotação USD/BRL em uso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {exchangeInfo && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Taxa Atual</Label>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-xl font-bold">R$ {exchangeInfo.rate.toFixed(4)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Fonte</Label>
                <div className="flex items-center gap-2">
                  {getSourceBadge(exchangeInfo.source)}
                  {exchangeInfo.provider && (
                    <span className="text-sm text-muted-foreground">({exchangeInfo.provider})</span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Última Atualização</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatLastUpdate(exchangeInfo.lastUpdate)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Ação</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleForceUpdate}
                  disabled={updating}
                  className="w-full"
                >
                  {updating ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {updating ? 'Atualizando...' : 'Atualizar'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações de câmbio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Configurações de Câmbio USD/BRL
          </CardTitle>
          <CardDescription>
            Configure como a cotação USD/BRL é obtida e atualizada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configurações simplificadas */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Modo do câmbio */}
            <div className="space-y-3">
              <Label>Modo do Câmbio</Label>
              <Select value={currencyMode} onValueChange={(value: 'manual' | 'auto') => setCurrencyMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="auto">Automático</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {currencyMode === 'manual' ? 'Valor fixo' : 'Busca da API'}
              </p>
            </div>

            {/* Taxa USD/BRL */}
            <div className="space-y-3">
              <Label htmlFor="usd-brl-rate">
                Taxa USD/BRL {currencyMode === 'auto' && '(Fallback)'}
              </Label>
              <Input
                id="usd-brl-rate"
                type="number"
                step="0.01"
                min="1"
                max="20"
                value={usdBrlRate}
                onChange={(e) => setUsdBrlRate(e.target.value)}
                placeholder="5.50"
              />
              <p className="text-sm text-muted-foreground">
                {currencyMode === 'manual' 
                  ? 'Valor fixo usado' 
                  : 'Usado se API falhar'
                }
              </p>
            </div>

            {/* Markup */}
            <div className="space-y-3">
              <Label htmlFor="markup">Markup (%)</Label>
              <Input
                id="markup"
                type="number"
                step="1"
                min="0"
                max="100"
                value={markupPercentage}
                onChange={(e) => setMarkupPercentage(e.target.value)}
                placeholder="20"
              />
              <p className="text-sm text-muted-foreground">
                Lucro aplicado aos preços
              </p>
            </div>
          </div>

          {/* Informações adicionais */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Manual:</strong> Você define um valor fixo. <br />
              <strong>Automático:</strong> Sistema busca cotação atual da API automaticamente.
            </AlertDescription>
          </Alert>

          <Separator />

          {/* Botões de ação */}
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              onClick={handleSaveConfig}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>

            <Button
              variant="outline"
              onClick={handleRecalculatePrices}
              disabled={recalculating || saving}
              className="flex items-center gap-2"
            >
              {recalculating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
              {recalculating ? 'Recalculando...' : 'Recalcular Preços'}
            </Button>

            <Button
              variant="outline"
              onClick={loadCurrencyConfig}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Recarregar
            </Button>
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Após alterar as configurações de câmbio ou markup, 
              clique em "Recalcular Preços" para atualizar todos os preços dos serviços.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
