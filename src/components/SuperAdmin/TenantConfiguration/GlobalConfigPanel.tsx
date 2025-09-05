import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Globe, Edit, Save, X, Plus } from "lucide-react";

interface GlobalConfigPanelProps {
  globalConfigs: any[];
  onUpdate: (category: string, key: string, value: any) => Promise<void>;
}

export const GlobalConfigPanel: React.FC<GlobalConfigPanelProps> = ({
  globalConfigs,
  onUpdate
}) => {
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [newConfigMode, setNewConfigMode] = useState(false);
  const [newConfig, setNewConfig] = useState({
    category: '',
    key: '',
    value: '',
  });

  // Group configurations by category
  const groupedConfigs = globalConfigs.reduce((acc, config) => {
    if (!acc[config.config_category]) {
      acc[config.config_category] = [];
    }
    acc[config.config_category].push(config);
    return acc;
  }, {});

  const handleEdit = (configId: string, currentValue: any) => {
    setEditingConfig(configId);
    setEditValues({ [configId]: JSON.stringify(currentValue, null, 2) });
  };

  const handleSave = async (config: any) => {
    try {
      const value = JSON.parse(editValues[config.id]);
      await onUpdate(config.config_category, config.config_key, value);
      setEditingConfig(null);
      setEditValues({});
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const handleCancel = () => {
    setEditingConfig(null);
    setEditValues({});
  };

  const handleNewConfigSave = async () => {
    try {
      const value = JSON.parse(newConfig.value);
      await onUpdate(newConfig.category, newConfig.key, value);
      setNewConfigMode(false);
      setNewConfig({ category: '', key: '', value: '' });
    } catch (error) {
      console.error('Error creating new config:', error);
    }
  };

  const formatValue = (value: any) => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      general: Globe,
      email: '📧',
      currency: '💰',
      billing: '💳',
      default: Globe
    };
    return icons[category] || icons.default;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      general: 'bg-blue-50 border-blue-200',
      email: 'bg-green-50 border-green-200',
      currency: 'bg-yellow-50 border-yellow-200',
      billing: 'bg-purple-50 border-purple-200',
    };
    return colors[category] || 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Global Configuration Settings</h2>
          <p className="text-muted-foreground">
            Default settings that apply to all tenants unless overridden
          </p>
        </div>
        <Button 
          onClick={() => setNewConfigMode(true)}
          disabled={newConfigMode}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Global Setting
        </Button>
      </div>

      {/* New Configuration Form */}
      {newConfigMode && (
        <Card className="border-2 border-dashed border-primary">
          <CardHeader>
            <CardTitle className="text-lg">Add New Global Configuration</CardTitle>
            <CardDescription>Create a new global configuration setting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={newConfig.category}
                  onValueChange={(value) => setNewConfig(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Key</Label>
                <Input
                  value={newConfig.key}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="e.g., default_currency"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Value (JSON)</Label>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 border rounded-md font-mono text-sm"
                value={newConfig.value}
                onChange={(e) => setNewConfig(prev => ({ ...prev, value: e.target.value }))}
                placeholder='{"example": "value"}'
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleNewConfigSave}
                disabled={!newConfig.category || !newConfig.key || !newConfig.value}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setNewConfigMode(false);
                  setNewConfig({ category: '', key: '', value: '' });
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Categories */}
      {Object.entries(groupedConfigs).map(([category, configs]: [string, any[]]) => {
                const CategoryIcon = getCategoryIcon(category);
                
                return (
                  <Card key={category} className={getCategoryColor(category)}>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        {typeof CategoryIcon === 'string' ? (
                          <span className="text-2xl">{CategoryIcon}</span>
                        ) : (
                          <CategoryIcon className="h-5 w-5" />
                        )}
                        <CardTitle className="capitalize">{category} Settings</CardTitle>
                        <Badge variant="outline">{configs.length} settings</Badge>
                      </div>
                      <CardDescription>
                        Global {category} configuration that applies to all tenants
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {configs.map((config, index) => (
                <div key={config.id}>
                  {index > 0 && <Separator className="my-4" />}
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{config.config_key}</h4>
                          <Badge variant="secondary" className="text-xs">
                            v{config.version}
                          </Badge>
                        </div>
                        {config.description && (
                          <p className="text-sm text-muted-foreground">
                            {config.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {editingConfig === config.id ? (
                          <>
                            <Button size="sm" onClick={() => handleSave(config)}>
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}>
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(config.id, config.config_value)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Configuration Value</Label>
                      {editingConfig === config.id ? (
                        <textarea
                          className="w-full min-h-[80px] px-3 py-2 border rounded-md font-mono text-sm"
                          value={editValues[config.id] || ''}
                          onChange={(e) => setEditValues(prev => ({ 
                            ...prev, 
                            [config.id]: e.target.value 
                          }))}
                        />
                      ) : (
                        <pre className="bg-muted p-3 rounded-md text-sm font-mono overflow-x-auto">
                          {formatValue(config.config_value)}
                        </pre>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Last updated: {new Date(config.updated_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {configs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No {category} configurations found
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
      
      {Object.keys(groupedConfigs).length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Global Configurations</h3>
            <p className="text-muted-foreground mb-4">
              Add your first global configuration to get started
            </p>
            <Button onClick={() => setNewConfigMode(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Configuration
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};