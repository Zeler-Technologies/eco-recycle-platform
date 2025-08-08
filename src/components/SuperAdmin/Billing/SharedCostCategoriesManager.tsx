import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, DollarSign, AlertTriangle } from 'lucide-react';

interface SharedCostCategory {
  name: string;
  percentage: number;
}

interface SharedCostCategoriesManagerProps {
  categories: { [category: string]: { percentage: number } };
  onChange: (categories: { [category: string]: { percentage: number } }) => void;
}

export const SharedCostCategoriesManager: React.FC<SharedCostCategoriesManagerProps> = ({
  categories,
  onChange
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const categoriesArray: SharedCostCategory[] = Object.entries(categories || {}).map(([name, data]) => ({
    name,
    percentage: data.percentage
  }));

  const totalPercentage = categoriesArray.reduce((sum, cat) => sum + cat.percentage, 0);

  const validateCategories = useCallback((cats: SharedCostCategory[], newCategory?: SharedCostCategory): string[] => {
    const validationErrors: string[] = [];
    const allCategories = newCategory ? [...cats, newCategory] : cats;
    
    // Check for duplicate names
    const names = allCategories.map(cat => cat.name.toLowerCase());
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
      validationErrors.push(`Duplicate category names found: ${duplicates.join(', ')}`);
    }

    // Check percentage validity
    allCategories.forEach(cat => {
      if (cat.percentage < 0 || cat.percentage > 100) {
        validationErrors.push(`${cat.name}: Percentage must be between 0 and 100`);
      }
    });

    // Check total percentage
    const total = allCategories.reduce((sum, cat) => sum + cat.percentage, 0);
    if (total > 100) {
      validationErrors.push(`Total percentage cannot exceed 100% (currently ${total.toFixed(1)}%)`);
    }

    return validationErrors;
  }, []);

  const updateCategory = useCallback((index: number, field: 'name' | 'percentage', value: string | number) => {
    const updatedCategories = [...categoriesArray];
    if (field === 'name') {
      updatedCategories[index].name = value as string;
    } else {
      updatedCategories[index].percentage = Math.max(0, Math.min(100, value as number));
    }

    const validationErrors = validateCategories(updatedCategories);
    setErrors(validationErrors);

    if (validationErrors.length === 0) {
      const categoryMap = updatedCategories.reduce((acc, cat) => {
        acc[cat.name] = { percentage: cat.percentage };
        return acc;
      }, {} as { [category: string]: { percentage: number } });
      
      onChange(categoryMap);
    }
  }, [categoriesArray, onChange, validateCategories]);

  const addCategory = useCallback(() => {
    if (!newCategoryName.trim()) return;

    const newCategory: SharedCostCategory = {
      name: newCategoryName.trim(),
      percentage: 0
    };

    const validationErrors = validateCategories(categoriesArray, newCategory);
    setErrors(validationErrors);

    if (validationErrors.length === 0) {
      const updatedCategories = [...categoriesArray, newCategory];
      const categoryMap = updatedCategories.reduce((acc, cat) => {
        acc[cat.name] = { percentage: cat.percentage };
        return acc;
      }, {} as { [category: string]: { percentage: number } });
      
      onChange(categoryMap);
      setNewCategoryName('');
    }
  }, [newCategoryName, categoriesArray, onChange, validateCategories]);

  const removeCategory = useCallback((index: number) => {
    const updatedCategories = categoriesArray.filter((_, i) => i !== index);
    const categoryMap = updatedCategories.reduce((acc, cat) => {
      acc[cat.name] = { percentage: cat.percentage };
      return acc;
    }, {} as { [category: string]: { percentage: number } });
    
    onChange(categoryMap);
    setErrors([]); // Clear errors when removing categories
  }, [categoriesArray, onChange]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addCategory();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Shared Cost Categories
        </CardTitle>
        <CardDescription>
          Manage shared infrastructure and service cost allocation categories
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Add new category */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="new-category">Add Category</Label>
            <Input
              id="new-category"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Infrastructure, Support, Administration"
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={addCategory} 
              disabled={!newCategoryName.trim()}
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Categories table */}
        {categoriesArray.length > 0 ? (
          <div className="space-y-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Allocation</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoriesArray.map((category, index) => (
                  <TableRow key={category.name}>
                    <TableCell>
                      <Input
                        value={category.name}
                        onChange={(e) => updateCategory(index, 'name', e.target.value)}
                        className="border-none p-1 h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={category.percentage}
                        onChange={(e) => updateCategory(index, 'percentage', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={category.percentage > 0 ? "default" : "secondary"}
                        className="whitespace-nowrap"
                      >
                        {category.percentage.toFixed(1)}% allocation
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCategory(index)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Total percentage display */}
            <div className="flex justify-end items-center gap-2 pt-2 border-t">
              <span className="text-sm font-medium">Total Allocation:</span>
              <Badge 
                variant={totalPercentage <= 100 ? "default" : "destructive"}
                className="text-base px-3 py-1"
              >
                {totalPercentage.toFixed(1)}%
              </Badge>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No shared cost categories defined</p>
            <p className="text-sm">Add a category above to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};