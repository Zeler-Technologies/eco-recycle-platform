import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Trash2, Eye, EyeOff } from "lucide-react";

interface ConfigConflict {
  type: 'duplicate' | 'mismatch';
  key: string;
  configs: any[];
  message: string;
}

interface ConflictDetectionPanelProps {
  conflicts: ConfigConflict[];
  onResolve: () => Promise<void>;
}

export const ConflictDetectionPanel: React.FC<ConflictDetectionPanelProps> = ({
  conflicts,
  onResolve
}) => {
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set());
  const [resolving, setResolving] = useState(false);

  const toggleConflictExpansion = (conflictKey: string) => {
    const newExpanded = new Set(expandedConflicts);
    if (newExpanded.has(conflictKey)) {
      newExpanded.delete(conflictKey);
    } else {
      newExpanded.add(conflictKey);
    }
    setExpandedConflicts(newExpanded);
  };

  const handleResolveAll = async () => {
    setResolving(true);
    try {
      await onResolve();
    } finally {
      setResolving(false);
    }
  };

  const getConflictTypeColor = (type: string) => {
    switch (type) {
      case 'duplicate':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'mismatch':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'duplicate':
        return AlertTriangle;
      case 'mismatch':
        return XCircle;
      default:
        return AlertTriangle;
    }
  };

  const formatConfigValue = (value: any) => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getTenantName = (config: any) => {
    return config.tenant_id ? `Tenant ${config.tenant_id}` : 'Global';
  };

  if (conflicts.length === 0) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="text-center py-12">
          <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
          <h3 className="text-lg font-medium text-green-800 mb-2">No Conflicts Detected</h3>
          <p className="text-green-600 mb-4">
            All tenant configurations are properly synchronized and conflict-free
          </p>
          <Button variant="outline" onClick={handleResolveAll} disabled={resolving}>
            <RefreshCw className={`h-4 w-4 mr-2 ${resolving ? 'animate-spin' : ''}`} />
            Refresh Check
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            Configuration Conflicts
          </h2>
          <p className="text-muted-foreground">
            {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} detected that need resolution
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleResolveAll} 
            disabled={resolving}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${resolving ? 'animate-spin' : ''}`} />
            Refresh Check
          </Button>
          
          <Button 
            onClick={() => {
              const allKeys = new Set(conflicts.map(c => c.key));
              setExpandedConflicts(allKeys);
            }}
            variant="outline"
          >
            <Eye className="h-4 w-4 mr-2" />
            Expand All
          </Button>
          
          <Button 
            onClick={() => setExpandedConflicts(new Set())}
            variant="outline"
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Collapse All
          </Button>
        </div>
      </div>

      {/* Conflicts List */}
      <div className="space-y-4">
        {conflicts.map((conflict, index) => {
          const ConflictIcon = getConflictIcon(conflict.type);
          const isExpanded = expandedConflicts.has(conflict.key);
          
          return (
            <Card key={`${conflict.key}-${index}`} className="border-l-4 border-l-orange-500">
              <CardHeader className="cursor-pointer" onClick={() => toggleConflictExpansion(conflict.key)}>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ConflictIcon className="h-5 w-5 text-orange-600" />
                      <CardTitle className="text-lg">{conflict.key}</CardTitle>
                      <Badge className={getConflictTypeColor(conflict.type)}>
                        {conflict.type}
                      </Badge>
                    </div>
                    <CardDescription>{conflict.message}</CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{conflict.configs.length} configs</Badge>
                    <Button variant="ghost" size="sm">
                      {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-4">
                  <Separator />
                  
                  {/* Conflicting Configurations */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Conflicting Configurations:</h4>
                    
                    {conflict.configs.map((config, configIndex) => (
                      <div key={config.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {getTenantName(config)}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                v{config.version}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Created: {new Date(config.created_at).toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Updated: {new Date(config.updated_at).toLocaleString()}
                            </p>
                          </div>
                          
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Configuration Value:</p>
                          <pre className="bg-muted p-3 rounded-md text-sm font-mono overflow-x-auto">
                            {formatConfigValue(config.config_value)}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resolution Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button size="sm" variant="outline">
                      Keep Most Recent
                    </Button>
                    <Button size="sm" variant="outline">
                      Keep Global
                    </Button>
                    <Button size="sm" variant="outline">
                      Manual Resolution
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Resolution Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">Resolution Guidelines</CardTitle>
          <CardDescription>Best practices for resolving configuration conflicts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Duplicate Configurations</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Keep the most recent configuration</li>
                <li>• Verify tenant-specific needs</li>
                <li>• Remove outdated duplicates</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Value Mismatches</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Check business requirements</li>
                <li>• Validate against country standards</li>
                <li>• Consider global vs tenant override</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};