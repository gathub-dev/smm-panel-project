"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, Languages, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface TranslationStats {
  total: number
  translated: number
  pending: number
  translationProgress: number
}

export function AdminTranslationPanel() {
  const [stats, setStats] = useState<TranslationStats | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [loading, setLoading] = useState(true)

  // Carregar estatísticas
  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/translate-services')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
      } else {
        toast.error(data.error || 'Erro ao carregar estatísticas')
      }
    } catch (error) {
      toast.error('Erro ao carregar estatísticas de tradução')
    } finally {
      setLoading(false)
    }
  }

  // Executar tradução em segundo plano
  const runTranslation = async () => {
    setIsTranslating(true)
    
    try {
      const response = await fetch('/api/admin/translate-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 50 })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        await loadStats() // Recarregar estatísticas
      } else {
        toast.error(data.error || 'Erro na tradução')
      }
    } catch (error) {
      toast.error('Erro ao executar tradução')
    } finally {
      setIsTranslating(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Tradução Automática
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Tradução Automática
        </CardTitle>
        <CardDescription>
          Sistema automático de tradução para português dos serviços importados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {stats && (
          <>
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-600">Total de Serviços</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.translated}</div>
                <div className="text-sm text-green-600">Traduzidos</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                <div className="text-sm text-orange-600">Pendentes</div>
              </div>
            </div>

            {/* Progresso */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso da Tradução</span>
                <span>{stats.translationProgress}%</span>
              </div>
              <Progress value={stats.translationProgress} className="h-2" />
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              {stats.pending === 0 ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Todas as traduções concluídas
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                    {stats.pending} serviços aguardando tradução
                  </Badge>
                </>
              )}
            </div>

            {/* Ações */}
            <div className="flex gap-4">
              <Button 
                onClick={runTranslation}
                disabled={isTranslating || stats.pending === 0}
                className="flex items-center gap-2"
              >
                {isTranslating && <Loader2 className="h-4 w-4 animate-spin" />}
                {isTranslating ? 'Traduzindo...' : 'Traduzir Pendentes'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={loadStats}
                disabled={loading}
              >
                Atualizar
              </Button>
            </div>

            {/* Informações */}
            <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded">
              <strong>Como funciona:</strong>
              <br />
              • Novos serviços são traduzidos automaticamente durante a sincronização
              <br />
              • Use "Traduzir Pendentes" para traduzir serviços existentes em lotes
              <br />
              • O sistema detecta automaticamente conteúdo já em português
              <br />
              • Traduções são armazenadas permanentemente no banco
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
