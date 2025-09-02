import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Save, Calculator, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface DistanceRule {
  id?: string;
  tenant_id: number;
  min_distance_km: number;
  max_distance_km?: number;
  deduction_sek: number;
  created_at?: string;
  updated_at?: string;
}

interface DistanceRulesManagerProps {
  tenantId: string;
}

const DistanceRulesManager: React.FC<DistanceRulesManagerProps> = ({ tenantId }) => {
  const [rules, setRules] = useState<DistanceRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRule, setEditingRule] = useState<DistanceRule | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newRule, setNewRule] = useState<Omit<DistanceRule, 'id' | 'created_at' | 'updated_at'>>({
    tenant_id: parseInt(tenantId),
    min_distance_km: 0,
    max_distance_km: undefined,
    deduction_sek: 0
  });

  useEffect(() => {
    loadDistanceRules();
  }, [tenantId]);

  const loadDistanceRules = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('distance_rules')
        .select('*')
        .eq('tenant_id', parseInt(tenantId))
        .order('min_distance_km', { ascending: true });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error loading distance rules:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda distansregler",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateRule = (rule: Omit<DistanceRule, 'id' | 'created_at' | 'updated_at'>): string | null => {
    if (rule.min_distance_km < 0) {
      return "Minsta avstånd kan inte vara negativt";
    }
    if (rule.max_distance_km && rule.max_distance_km <= rule.min_distance_km) {
      return "Maximalt avstånd måste vara större än minsta avstånd";
    }
    if (rule.deduction_sek > 0) {
      return "Avdrag måste vara negativt eller noll";
    }
    return null;
  };

  const checkRuleOverlap = (rule: Omit<DistanceRule, 'id' | 'created_at' | 'updated_at'>, excludeId?: string): boolean => {
    return rules.some(existingRule => {
      if (excludeId && existingRule.id === excludeId) return false;
      
      const existingMin = existingRule.min_distance_km;
      const existingMax = existingRule.max_distance_km || Infinity;
      const newMin = rule.min_distance_km;
      const newMax = rule.max_distance_km || Infinity;
      
      return (newMin < existingMax && newMax > existingMin);
    });
  };

  const saveRule = async (rule: Omit<DistanceRule, 'id' | 'created_at' | 'updated_at'>) => {
    const validationError = validateRule(rule);
    if (validationError) {
      toast({
        title: "Valideringsfel",
        description: validationError,
        variant: "destructive"
      });
      return false;
    }

    if (checkRuleOverlap(rule)) {
      toast({
        title: "Regelkonflikt",
        description: "Denna regel överlappar med en befintlig regel",
        variant: "destructive"
      });
      return false;
    }

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('distance_rules')
        .insert([rule]);

      if (error) throw error;

      toast({
        title: "Framgång",
        description: "Distansregel sparad"
      });
      
      await loadDistanceRules();
      return true;
    } catch (error) {
      console.error('Error saving distance rule:', error);
      toast({
        title: "Fel",
        description: "Kunde inte spara distansregeln",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateRule = async (id: string, rule: Omit<DistanceRule, 'id' | 'created_at' | 'updated_at'>) => {
    const validationError = validateRule(rule);
    if (validationError) {
      toast({
        title: "Valideringsfel",
        description: validationError,
        variant: "destructive"
      });
      return false;
    }

    if (checkRuleOverlap(rule, id)) {
      toast({
        title: "Regelkonflikt",
        description: "Denna regel överlappar med en befintlig regel",
        variant: "destructive"
      });
      return false;
    }

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('distance_rules')
        .update(rule)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Framgång",
        description: "Distansregel uppdaterad"
      });
      
      await loadDistanceRules();
      return true;
    } catch (error) {
      console.error('Error updating distance rule:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera distansregeln",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRule = async (id: string) => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('distance_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Framgång",
        description: "Distansregel borttagen"
      });
      
      await loadDistanceRules();
    } catch (error) {
      console.error('Error deleting distance rule:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort distansregeln",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRule = async () => {
    const success = await saveRule(newRule);
    if (success) {
      setNewRule({
        tenant_id: parseInt(tenantId),
        min_distance_km: 0,
        max_distance_km: undefined,
        deduction_sek: 0
      });
      setIsAddDialogOpen(false);
    }
  };

  const handleEditRule = async () => {
    if (!editingRule?.id) return;
    
    const success = await updateRule(editingRule.id, {
      tenant_id: editingRule.tenant_id,
      min_distance_km: editingRule.min_distance_km,
      max_distance_km: editingRule.max_distance_km,
      deduction_sek: editingRule.deduction_sek
    });
    
    if (success) {
      setEditingRule(null);
      setIsEditDialogOpen(false);
    }
  };

  const formatDistanceRange = (rule: DistanceRule): string => {
    if (rule.max_distance_km) {
      return `${rule.min_distance_km}–${rule.max_distance_km} km`;
    }
    return `${rule.min_distance_km}+ km`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Laddar distansregler...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Distansbaserade Avdrag</CardTitle>
              <CardDescription>
                Hantera automatiska avdrag baserat på körsträcka. Längre avstånd ger högre avdrag från bilens värde.
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Lägg till ny regel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Lägg till distansregel</DialogTitle>
                  <DialogDescription>
                    Skapa en ny regel för distansbaserade avdrag från bilens värde.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min-distance">Minsta avstånd (km)</Label>
                      <Input
                        id="min-distance"
                        type="number"
                        value={newRule.min_distance_km}
                        onChange={(e) => setNewRule(prev => ({
                          ...prev,
                          min_distance_km: parseInt(e.target.value) || 0
                        }))}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-distance">Största avstånd (km)</Label>
                      <Input
                        id="max-distance"
                        type="number"
                        value={newRule.max_distance_km || ''}
                        onChange={(e) => setNewRule(prev => ({
                          ...prev,
                          max_distance_km: e.target.value ? parseInt(e.target.value) : undefined
                        }))}
                        placeholder="Lämna tom för ∞"
                        min="1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="deduction">Avdrag (SEK)</Label>
                    <div className="flex items-center">
                      <span className="px-3 py-2 border border-r-0 rounded-l-md bg-muted text-muted-foreground">-</span>
                      <Input
                        id="deduction"
                        type="number"
                        value={Math.abs(newRule.deduction_sek)}
                        onChange={(e) => setNewRule(prev => ({
                          ...prev,
                          deduction_sek: -(parseInt(e.target.value) || 0)
                        }))}
                        min="0"
                        placeholder="Avdrag i SEK"
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Avbryt
                  </Button>
                  <Button onClick={handleAddRule} disabled={isSaving}>
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Spara regel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Inga distansregler än</p>
              <p>Lägg till regler för att automatiskt applicera avdrag baserat på avstånd</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">
                      {formatDistanceRange(rule)}
                    </Badge>
                    <div>
                      <span className="font-medium">
                        {rule.deduction_sek} SEK avdrag
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog open={isEditDialogOpen && editingRule?.id === rule.id} onOpenChange={(open) => {
                      setIsEditDialogOpen(open);
                      if (!open) setEditingRule(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingRule(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Redigera distansregel</DialogTitle>
                          <DialogDescription>
                            Uppdatera inställningar för denna distansregel.
                          </DialogDescription>
                        </DialogHeader>
                        {editingRule && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="edit-min-distance">Minsta avstånd (km)</Label>
                                <Input
                                  id="edit-min-distance"
                                  type="number"
                                  value={editingRule.min_distance_km}
                                  onChange={(e) => setEditingRule(prev => prev ? ({
                                    ...prev,
                                    min_distance_km: parseInt(e.target.value) || 0
                                  }) : null)}
                                  min="0"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-max-distance">Största avstånd (km)</Label>
                                <Input
                                  id="edit-max-distance"
                                  type="number"
                                  value={editingRule.max_distance_km || ''}
                                  onChange={(e) => setEditingRule(prev => prev ? ({
                                    ...prev,
                                    max_distance_km: e.target.value ? parseInt(e.target.value) : undefined
                                  }) : null)}
                                  placeholder="Lämna tom för ∞"
                                  min="1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="edit-deduction">Avdrag (SEK)</Label>
                              <div className="flex items-center">
                                <span className="px-3 py-2 border border-r-0 rounded-l-md bg-muted text-muted-foreground">-</span>
                                <Input
                                  id="edit-deduction"
                                  type="number"
                                  value={Math.abs(editingRule.deduction_sek)}
                                  onChange={(e) => setEditingRule(prev => prev ? ({
                                    ...prev,
                                    deduction_sek: -(parseInt(e.target.value) || 0)
                                  }) : null)}
                                  min="0"
                                  placeholder="Avdrag i SEK"
                                  className="rounded-l-none"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                          Avbryt
                        </Button>
                          <Button onClick={handleEditRule} disabled={isSaving}>
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Uppdatera regel
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Ta bort distansregel</AlertDialogTitle>
                          <AlertDialogDescription>
                            Är du säker på att du vill ta bort denna distansregel? Detta går inte att ångra.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => rule.id && deleteRule(rule.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Ta bort
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {rules.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Tips:</strong> Distansregler tillämpas automatiskt när en kund anger sin pickup-adress. 
            Längre avstånd resulterar i högre avdrag från det slutliga priset för att kompensera för transportkostnader.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DistanceRulesManager;