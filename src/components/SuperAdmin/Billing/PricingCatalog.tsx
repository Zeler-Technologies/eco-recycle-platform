import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Percent, 
  Car, 
  MessageSquare, 
  CreditCard, 
  Server,
  Save
} from 'lucide-react';

interface PricingRule {
  id: string;
  service: string;
  type: 'fixed' | 'per_unit' | 'tiered';
  baseCost: number;
  markup: number;
  markupType: 'percentage' | 'fixed';
  includedUnits?: number;
  tiers?: { upTo: number | null; costPerUnit: number }[];
  description: string;
  enabled: boolean;
  icon: any;
}

export const PricingCatalog = () => {
  const [selectedRule, setSelectedRule] = useState<PricingRule | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [pricingRules, setPricingRules] = useState<PricingRule[]>([
    {
      id: '1',
      service: 'Monthly Service Fee',
      type: 'fixed',
      baseCost: 50.00,
      markup: 20,
      markupType: 'percentage',
      description: 'Base monthly subscription fee per tenant',
      enabled: true,
      icon: Server
    },
    {
      id: '2',
      service: 'Car Processing',
      type: 'tiered',
      baseCost: 0.08,
      markup: 25,
      markupType: 'percentage',
      includedUnits: 500,
      tiers: [
        { upTo: 1000, costPerUnit: 0.08 },
        { upTo: 5000, costPerUnit: 0.06 },
        { upTo: null, costPerUnit: 0.04 }
      ],
      description: 'Cost per car processed with volume discounts',
      enabled: true,
      icon: Car
    },
    {
      id: '3',
      service: 'SMS Services',
      type: 'per_unit',
      baseCost: 0.05,
      markup: 35,
      markupType: 'percentage',
      description: 'SMS notifications and alerts',
      enabled: true,
      icon: MessageSquare
    },
    {
      id: '4',
      service: 'Payment Processing',
      type: 'per_unit',
      baseCost: 0.25,
      markup: 20,
      markupType: 'percentage',
      description: 'Payment gateway transaction fees',
      enabled: true,
      icon: CreditCard
    }
  ]);

  const getServiceIcon = (service: string) => {
    const rule = pricingRules.find(r => r.service === service);
    return rule?.icon || DollarSign;
  };

  const calculatePrice = (rule: PricingRule, quantity = 1) => {
    let price = rule.baseCost;
    
    if (rule.markupType === 'percentage') {
      price = price * (1 + rule.markup / 100);
    } else {
      price = price + rule.markup;
    }
    
    return price * quantity;
  };

  const getMargin = (rule: PricingRule) => {
    if (rule.markupType === 'percentage') {
      return `${rule.markup}%`;
    } else {
      const margin = (rule.markup / (rule.baseCost + rule.markup)) * 100;
      return `${margin.toFixed(1)}%`;
    }
  };

  const handleSaveRule = (rule: PricingRule) => {
    if (isEditMode) {
      setPricingRules(prev => prev.map(r => r.id === rule.id ? rule : r));
    } else {
      setPricingRules(prev => [...prev, { ...rule, id: Date.now().toString() }]);
    }
    setSelectedRule(null);
    setIsEditMode(false);
  };

  const handleDeleteRule = (ruleId: string) => {
    setPricingRules(prev => prev.filter(r => r.id !== ruleId));
  };

  const PricingRuleForm = ({ rule, onSave }: { rule?: PricingRule; onSave: (rule: PricingRule) => void }) => {
    const [formData, setFormData] = useState<PricingRule>(rule || {
      id: '',
      service: '',
      type: 'fixed',
      baseCost: 0,
      markup: 0,
      markupType: 'percentage',
      description: '',
      enabled: true,
      icon: DollarSign
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="service">Service Name</Label>
            <Input
              id="service"
              value={formData.service}
              onChange={(e) => setFormData(prev => ({ ...prev, service: e.target.value }))}
              placeholder="e.g. Monthly Service Fee"
              required
            />
          </div>
          <div>
            <Label htmlFor="type">Pricing Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed Price</SelectItem>
                <SelectItem value="per_unit">Per Unit</SelectItem>
                <SelectItem value="tiered">Tiered Pricing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="baseCost">Base Cost (€)</Label>
            <Input
              id="baseCost"
              type="number"
              step="0.01"
              value={formData.baseCost}
              onChange={(e) => setFormData(prev => ({ ...prev, baseCost: parseFloat(e.target.value) }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="markup">Markup</Label>
            <div className="flex gap-2">
              <Input
                id="markup"
                type="number"
                step="0.01"
                value={formData.markup}
                onChange={(e) => setFormData(prev => ({ ...prev, markup: parseFloat(e.target.value) }))}
                required
              />
              <Select value={formData.markupType} onValueChange={(value) => setFormData(prev => ({ ...prev, markupType: value as any }))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">%</SelectItem>
                  <SelectItem value="fixed">€</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {formData.type === 'tiered' && (
          <div>
            <Label htmlFor="includedUnits">Included Units (Free)</Label>
            <Input
              id="includedUnits"
              type="number"
              value={formData.includedUnits || 0}
              onChange={(e) => setFormData(prev => ({ ...prev, includedUnits: parseInt(e.target.value) }))}
              placeholder="e.g. 500"
            />
          </div>
        )}

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Service description..."
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="enabled"
            checked={formData.enabled}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
          />
          <Label htmlFor="enabled">Enable this pricing rule</Label>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setSelectedRule(null)}>
            Cancel
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Save Rule
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-admin-primary">Pricing Catalog</h2>
          <p className="text-muted-foreground">Manage service pricing rules and markup configurations</p>
        </div>
        <Dialog open={!!selectedRule} onOpenChange={(open) => !open && setSelectedRule(null)}>
          <DialogTrigger asChild>
            <Button 
              className="bg-admin-primary hover:bg-admin-primary/90"
              onClick={() => {
                setSelectedRule({} as PricingRule);
                setIsEditMode(false);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Pricing Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'Edit Pricing Rule' : 'Add New Pricing Rule'}
              </DialogTitle>
              <DialogDescription>
                Configure pricing rules for services with cost and markup settings
              </DialogDescription>
            </DialogHeader>
            {selectedRule && (
              <PricingRuleForm 
                rule={isEditMode ? selectedRule : undefined} 
                onSave={handleSaveRule}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pricingRules.map((rule) => {
          const IconComponent = rule.icon;
          return (
            <Card key={rule.id} className="bg-white shadow-custom-sm hover:shadow-custom-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-admin-accent rounded-full">
                      <IconComponent className="h-5 w-5 text-admin-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{rule.service}</CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRule(rule);
                        setIsEditMode(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-status-cancelled hover:text-status-cancelled"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Base Cost:</span>
                    <span className="font-semibold">€{rule.baseCost.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Markup:</span>
                    <span className="font-semibold">
                      {rule.markupType === 'percentage' ? `${rule.markup}%` : `€${rule.markup.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Final Price:</span>
                    <span className="font-semibold text-admin-primary">
                      €{calculatePrice(rule).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Margin:</span>
                    <Badge className="bg-status-completed text-white">
                      {getMargin(rule)}
                    </Badge>
                  </div>
                  {rule.type === 'tiered' && rule.includedUnits && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Included Units:</span>
                      <span className="text-sm">{rule.includedUnits} free</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge className={rule.enabled ? 'bg-status-completed text-white' : 'bg-muted'}>
                      {rule.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};