"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Download, 
  Upload, 
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
  Globe,
  DollarSign,
  Bell,
  Shield,
  Server,
  Mail,
  Smartphone,
  Clock,
  Database,
  Eye,
  EyeOff
} from "lucide-react"
import { toast } from "sonner"
import { 
  getAllSettings, 
  saveSetting, 
  saveMultipleSettings, 
  deleteSetting, 
  initializeDefaultSettings,
  exportSettings,
  importSettings
} from "@/lib/settings-actions"
import { CurrencyConfigSection } from "@/components/currency-config-section"
  
interface Setting {
  id?: string
  key: string
  value: string
  description?: string
  updated_at?: string
}

interface CategorizedSettings {
  general: Setting[]
  pricing: Setting[]
  api: Setting[]
  notifications: Setting[]
  security: Setting[]
  system: Setting[]
}

export function AdminSettingsPanel() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [categorizedSettings, setCategorizedSettings] = useState<CategorizedSettings>({
    general: [],
    pricing: [],
    api: [],
    notifications: [],
    security: [],
    system: []
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({})
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [newSettingKey, setNewSettingKey] = useState("")
  const [newSettingValue, setNewSettingValue] = useState("")
  const [newSettingDescription, setNewSettingDescription] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [importData, setImportData] = useState("")
  const [showImportDialog, setShowImportDialog] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    console.log("🎯 FRONTEND: loadSettings() chamada")
    setLoading(true)
    try {
      console.log("🔄 FRONTEND: Chamando getAllSettings()...")
      const result = await getAllSettings()
      console.log("📨 FRONTEND: Resultado recebido:", result)
      
      if (result.success) {
        console.log("✅ FRONTEND: Sucesso! Configurações:", result.data.all.length)
        console.log("📊 FRONTEND: Categorized:", Object.keys(result.data.categorized).map(key => `${key}: ${result.data.categorized[key].length}`))
        
        setSettings(result.data.all)
        setCategorizedSettings(result.data.categorized)
        
        // Inicializar editedSettings com valores atuais
        const initialEdited: Record<string, string> = {}
        result.data.all.forEach((setting: Setting) => {
          initialEdited[setting.key] = setting.value
        })
        setEditedSettings(initialEdited)
      } else {
        console.log("❌ FRONTEND: Erro no resultado:", result.error)
        toast.error(result.error || "Erro ao carregar configurações")
      }
    } catch (error) {
      console.log("💥 FRONTEND: Exception:", error)
      toast.error("Erro ao carregar configurações")
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (key: string, value: string) => {
    setEditedSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveSetting = async (key: string) => {
    setSaving(true)
    try {
      const setting = settings.find(s => s.key === key)
      const result = await saveSetting(key, editedSettings[key], setting?.description)
      
      if (result.success) {
        toast.success("Configuração salva com sucesso!")
        await loadSettings()
      } else {
        toast.error(result.error || "Erro ao salvar configuração")
      }
    } catch (error) {
      toast.error("Erro ao salvar configuração")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAllSettings = async () => {
    setSaving(true)
    try {
      const settingsToSave = Object.entries(editedSettings).map(([key, value]) => {
        const setting = settings.find(s => s.key === key)
        return {
          key,
          value,
          description: setting?.description
        }
      })

      const result = await saveMultipleSettings(settingsToSave)
      
      if (result.success) {
        toast.success("Todas as configurações foram salvas!")
        await loadSettings()
      } else {
        toast.error(result.error || "Erro ao salvar configurações")
      }
    } catch (error) {
      toast.error("Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSetting = async (key: string) => {
    try {
      const result = await deleteSetting(key)
      
      if (result.success) {
        toast.success("Configuração removida com sucesso!")
        await loadSettings()
      } else {
        toast.error(result.error || "Erro ao remover configuração")
      }
    } catch (error) {
      toast.error("Erro ao remover configuração")
    }
  }

  const handleAddNewSetting = async () => {
    if (!newSettingKey.trim() || !newSettingValue.trim()) {
      toast.error("Chave e valor são obrigatórios")
      return
    }

    try {
      const result = await saveSetting(newSettingKey, newSettingValue, newSettingDescription)
      
      if (result.success) {
        toast.success("Nova configuração adicionada!")
        setNewSettingKey("")
        setNewSettingValue("")
        setNewSettingDescription("")
        setShowAddDialog(false)
        await loadSettings()
      } else {
        toast.error(result.error || "Erro ao adicionar configuração")
      }
    } catch (error) {
      toast.error("Erro ao adicionar configuração")
    }
  }

  const handleInitializeDefaults = async () => {
    setSaving(true)
    try {
      const result = await initializeDefaultSettings()
      
      if (result.success) {
        toast.success("Configurações padrão inicializadas!")
        await loadSettings()
      } else {
        toast.error(result.error || "Erro ao inicializar configurações")
      }
    } catch (error) {
      toast.error("Erro ao inicializar configurações")
    } finally {
      setSaving(false)
    }
  }

  const handleExportSettings = async () => {
    try {
      const result = await exportSettings()
      
      if (result.success) {
        const dataStr = JSON.stringify(result.data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `smm-panel-settings-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
        toast.success("Configurações exportadas com sucesso!")
      } else {
        toast.error(result.error || "Erro ao exportar configurações")
      }
    } catch (error) {
      toast.error("Erro ao exportar configurações")
    }
  }

  const handleImportSettings = async () => {
    try {
      const data = JSON.parse(importData)
      const result = await importSettings(data)
      
      if (result.success) {
        toast.success("Configurações importadas com sucesso!")
        setImportData("")
        setShowImportDialog(false)
        await loadSettings()
      } else {
        toast.error(result.error || "Erro ao importar configurações")
      }
    } catch (error) {
      toast.error("Formato de dados inválido")
    }
  }

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const renderSettingInput = (setting: Setting) => {
    const key = setting.key
    const value = editedSettings[key] || setting.value
    const isPassword = key.toLowerCase().includes('password') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('key')
    const isBoolean = value === 'true' || value === 'false'
    const isNumber = !isNaN(Number(value)) && value !== ''
    const isEmail = key.toLowerCase().includes('email')
    const isUrl = key.toLowerCase().includes('url') || key.toLowerCase().includes('webhook')

    if (isBoolean) {
      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={value === 'true'}
            onCheckedChange={(checked) => handleSettingChange(key, checked.toString())}
          />
          <Label>{value === 'true' ? 'Habilitado' : 'Desabilitado'}</Label>
        </div>
      )
    }

    if (key === 'log_level') {
      return (
        <Select value={value} onValueChange={(newValue) => handleSettingChange(key, newValue)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="debug">Debug</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warn">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    return (
      <div className="relative">
        <Input
          type={isPassword && !showPasswords[key] ? "password" : isEmail ? "email" : isUrl ? "url" : isNumber ? "number" : "text"}
          value={value}
          onChange={(e) => handleSettingChange(key, e.target.value)}
          placeholder={setting.description}
        />
        {isPassword && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => togglePasswordVisibility(key)}
          >
            {showPasswords[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        )}
      </div>
    )
  }

  const renderSettingsCategory = (categorySettings: Setting[], categoryName: string) => {
    if (categorySettings.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma configuração encontrada nesta categoria</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {categorySettings.map((setting) => (
          <Card key={setting.key}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{setting.key}</Label>
                    {setting.description && (
                      <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {setting.updated_at ? new Date(setting.updated_at).toLocaleDateString('pt-BR') : 'Nunca'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSaveSetting(setting.key)}
                      disabled={saving || editedSettings[setting.key] === setting.value}
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSetting(setting.key)}
                      disabled={saving}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {renderSettingInput(setting)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return <Globe className="h-4 w-4" />
      case 'pricing': return <DollarSign className="h-4 w-4" />
      case 'api': return <Database className="h-4 w-4" />
      case 'notifications': return <Bell className="h-4 w-4" />
      case 'security': return <Shield className="h-4 w-4" />
      case 'system': return <Server className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'general': return 'Geral'
      case 'pricing': return 'Preços & Câmbio'
      case 'api': return 'APIs'
      case 'notifications': return 'Notificações'
      case 'security': return 'Segurança'
      case 'system': return 'Sistema'
      default: return category
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSaveAllSettings}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Todas
          </Button>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova Configuração
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Configuração</DialogTitle>
                <DialogDescription>
                  Crie uma nova configuração personalizada
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-key">Chave</Label>
                  <Input
                    id="new-key"
                    value={newSettingKey}
                    onChange={(e) => setNewSettingKey(e.target.value)}
                    placeholder="ex: custom_feature_enabled"
                  />
                </div>
                <div>
                  <Label htmlFor="new-value">Valor</Label>
                  <Input
                    id="new-value"
                    value={newSettingValue}
                    onChange={(e) => setNewSettingValue(e.target.value)}
                    placeholder="ex: true"
                  />
                </div>
                <div>
                  <Label htmlFor="new-description">Descrição (opcional)</Label>
                  <Textarea
                    id="new-description"
                    value={newSettingDescription}
                    onChange={(e) => setNewSettingDescription(e.target.value)}
                    placeholder="Descrição da configuração"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddNewSetting}>
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportSettings}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Importar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Configurações</DialogTitle>
                <DialogDescription>
                  Cole o JSON das configurações exportadas
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Cole o JSON aqui..."
                  className="h-32"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleImportSettings} disabled={!importData.trim()}>
                  Importar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={handleInitializeDefaults}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
            Configurações Padrão
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{settings.length}</p>
              </div>
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {Object.entries(categorizedSettings).map(([category, categorySettings]) => (
          <Card key={category}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{getCategoryName(category)}</p>
                  <p className="text-2xl font-bold">{categorySettings.length}</p>
                </div>
                {getCategoryIcon(category)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs de categorias */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          {Object.keys(categorizedSettings).map((category) => (
            <TabsTrigger key={category} value={category} className="flex items-center gap-2">
              {getCategoryIcon(category)}
              {getCategoryName(category)}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(categorizedSettings).map(([category, categorySettings]) => (
          <TabsContent key={category} value={category} className="space-y-4">
            {/* Seção especial de câmbio para categoria "pricing" */}
            {category === 'pricing' && (
              <div className="space-y-4">
                <CurrencyConfigSection />
                {categorizedSettings.pricing.length > 0 && (
                  <div className="my-6">
                    <div className="flex items-center">
                      <div className="flex-1 border-t border-border"></div>
                      <div className="px-3 text-sm text-muted-foreground">Outras Configurações de Preços</div>
                      <div className="flex-1 border-t border-border"></div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  Configurações de {getCategoryName(category)}
                </CardTitle>
                <CardDescription>
                  Gerencie as configurações relacionadas a {getCategoryName(category).toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderSettingsCategory(categorySettings, category)}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
