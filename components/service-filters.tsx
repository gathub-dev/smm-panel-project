"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Filter } from "lucide-react"

interface ServiceFiltersProps {
  onFiltersChange: (filters: any) => void
}

export default function ServiceFilters({ onFiltersChange }: ServiceFiltersProps) {
  const [filters, setFilters] = useState({
    priceRange: { min: "", max: "" },
    provider: "all",
    features: {
      dripfeed: false,
      refill: false,
      cancel: false,
    },
    serviceType: "all",
  })

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      priceRange: { min: "", max: "" },
      provider: "all",
      features: {
        dripfeed: false,
        refill: false,
        cancel: false,
      },
      serviceType: "all",
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const hasActiveFilters =
    filters.priceRange.min ||
    filters.priceRange.max ||
    filters.provider !== "all" ||
    filters.serviceType !== "all" ||
    Object.values(filters.features).some(Boolean)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </CardTitle>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Price Range (per 1000)</Label>
          <div className="flex space-x-2">
            <Input
              placeholder="Min"
              type="number"
              step="0.01"
              value={filters.priceRange.min}
              onChange={(e) => handleFilterChange("priceRange", { ...filters.priceRange, min: e.target.value })}
            />
            <Input
              placeholder="Max"
              type="number"
              step="0.01"
              value={filters.priceRange.max}
              onChange={(e) => handleFilterChange("priceRange", { ...filters.priceRange, max: e.target.value })}
            />
          </div>
        </div>

        {/* Provider */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Provider</Label>
          <Select value={filters.provider} onValueChange={(value) => handleFilterChange("provider", value)}>
            <SelectTrigger>
              <SelectValue placeholder="All providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All providers</SelectItem>
              <SelectItem value="mtp">MoreThanPanel</SelectItem>
              <SelectItem value="jap">JustAnotherPanel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Service Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Service Type</Label>
          <Select value={filters.serviceType} onValueChange={(value) => handleFilterChange("serviceType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="package">Package</SelectItem>
              <SelectItem value="custom_comments">Custom Comments</SelectItem>
              <SelectItem value="mentions_with_hashtags">Mentions with Hashtags</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Features</Label>
          <div className="space-y-2">
            {Object.entries(filters.features).map(([feature, checked]) => (
              <div key={feature} className="flex items-center space-x-2">
                <Checkbox
                  id={feature}
                  checked={checked}
                  onCheckedChange={(checked) =>
                    handleFilterChange("features", { ...filters.features, [feature]: checked })
                  }
                />
                <Label htmlFor={feature} className="text-sm capitalize">
                  {feature}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Active Filters</Label>
            <div className="flex flex-wrap gap-1">
              {filters.provider !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Provider: {filters.provider.toUpperCase()}
                </Badge>
              )}
              {filters.serviceType !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Type: {filters.serviceType}
                </Badge>
              )}
              {(filters.priceRange.min || filters.priceRange.max) && (
                <Badge variant="secondary" className="text-xs">
                  Price: ${filters.priceRange.min || "0"} - ${filters.priceRange.max || "∞"}
                </Badge>
              )}
              {Object.entries(filters.features)
                .filter(([, checked]) => checked)
                .map(([feature]) => (
                  <Badge key={feature} variant="secondary" className="text-xs capitalize">
                    {feature}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
