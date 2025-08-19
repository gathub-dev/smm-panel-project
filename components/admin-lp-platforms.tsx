"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Eye,
  EyeOff,
  Settings,
  ArrowUp,
  ArrowDown,
  Users,
  Heart,
  Play,
  MessageSquare,
  Music,
  Package
} from "lucide-react"
import { 
  getAllLPPlatforms, 
  updatePlatformVisibility, 
  updatePlatformOrder,
  updatePlatformInfo,
  type LPPlatform 
} from "@/lib/lp-platform-actions"

const platformIcons = {
  instagram: Heart,
  tiktok: Users,
  youtube: Play,
  facebook: Users,
  twitter: MessageSquare,
  spotify: Music
}

export default function AdminLPPlatforms() {
  const [platforms, setPlatforms] = useState<LPPlatform[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlatform, setEditingPlatform] = useState<LPPlatform | null>(null)
  const [editForm, setEditForm] = useState({
    display_name: '',
    description: '',
    icon: ''
  })

  useEffect(() => {
    loadPlatforms()
  }, [])

  const loadPlatforms = async () => {
    try {
      setLoading(true)
      const result = await getAllLPPlatforms()
      
      if (result.success && result.platforms) {
        setPlatforms(result.platforms)
      } else {
        toast.error(result.error || 'Erro ao carregar plataformas')
      }
    } catch (error) {
      toast.error('Erro ao carregar plataformas')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleVisibility = async (platformId: string, currentVisibility: boolean) => {
    try {
      const result = await updatePlatformVisibility(platformId, !currentVisibility)
      
      if (result.success) {
        setPlatforms(prev => 
          prev.map(p => 
            p.id === platformId 
              ? { ...p, is_visible: !currentVisibility }
              : p
          )
        )
        toast.success(`Plataforma ${!currentVisibility ? 'ativada' : 'desativada'} na LP`)
      } else {
        toast.error(result.error || 'Erro ao atualizar visibilidade')
      }
    } catch (error) {
      toast.error('Erro ao atualizar visibilidade')
    }
  }

  const handleUpdateOrder = async (platformId: string, direction: 'up' | 'down') => {
    const platform = platforms.find(p => p.id === platformId)
    if (!platform) return

    const newOrder = direction === 'up' ? platform.sort_order - 1 : platform.sort_order + 1
    
    try {
      const result = await updatePlatformOrder(platformId, newOrder)
      
      if (result.success) {
        await loadPlatforms() // Recarregar para atualizar ordem
        toast.success('Ordem atualizada')
      } else {
        toast.error(result.error || 'Erro ao atualizar ordem')
      }
    } catch (error) {
      toast.error('Erro ao atualizar ordem')
    }
  }

  const handleEditPlatform = (platform: LPPlatform) => {
    setEditingPlatform(platform)
    setEditForm({
      display_name: platform.display_name,
      description: platform.description,
      icon: platform.icon
    })
  }

  const handleSaveEdit = async () => {
    if (!editingPlatform) return

    try {
      const result = await updatePlatformInfo(editingPlatform.id, editForm)
      
      if (result.success) {
        setPlatforms(prev =>
          prev.map(p =>
            p.id === editingPlatform.id
              ? { ...p, ...editForm }
              : p
          )
        )
        setEditingPlatform(null)
        toast.success('Plataforma atualizada')
      } else {
        toast.error(result.error || 'Erro ao atualizar plataforma')
      }
    } catch (error) { 
      toast.error('Erro ao atualizar plataforma')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando plataformas...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Controle de Plataformas da Landing Page
        </CardTitle>
        <CardDescription>
          Escolha quais plataformas (Choose a Category) aparecem na loja simples
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {platforms.map((platform) => {
            const Icon = platformIcons[platform.icon as keyof typeof platformIcons] || Package
            
            return (
              <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="h-8 w-8 text-purple-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{platform.display_name}</h3>
                      <Badge variant={platform.is_visible ? "default" : "secondary"}>
                        {platform.is_visible ? 'Visível' : 'Oculta'}
                      </Badge>
                      <Badge variant="outline">
                        {platform.services_count} serviços
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {platform.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      Ordem: {platform.sort_order}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Controles de ordem */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateOrder(platform.id, 'up')}
                    disabled={platform.sort_order === 1}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateOrder(platform.id, 'down')}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  
                  {/* Switch de visibilidade */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={platform.is_visible}
                      onCheckedChange={() => handleToggleVisibility(platform.id, platform.is_visible)}
                    />
                    {platform.is_visible ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Botão de editar */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditPlatform(platform)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Plataforma</DialogTitle>
                        <DialogDescription>
                          Altere as informações da plataforma na Landing Page
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label>Nome de Exibição</Label>
                          <Input
                            value={editForm.display_name}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              display_name: e.target.value
                            }))}
                            placeholder="Instagram"
                          />
                        </div>
                        
                        <div>
                          <Label>Descrição</Label>
                          <Textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              description: e.target.value
                            }))}
                            placeholder="Serviços para Instagram..."
                            rows={3}
                          />
                        </div>
                        
                        <div>
                          <Label>Ícone</Label>
                          <Input
                            value={editForm.icon}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              icon: e.target.value
                            }))}
                            placeholder="instagram"
                          />
                        </div>
                        
                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleSaveEdit} className="flex-1">
                            Salvar Alterações
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">ℹ️ Como funciona:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Visível</strong>: A plataforma aparece na Landing Page</li>
            <li>• <strong>Ordem</strong>: Define a sequência de exibição</li>
            <li>• <strong>Serviços</strong>: Mostra quantos serviços da plataforma estão visíveis na LP</li>
            <li>• Apenas plataformas <strong>visíveis</strong> com <strong>serviços ativos</strong> aparecem na LP</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
