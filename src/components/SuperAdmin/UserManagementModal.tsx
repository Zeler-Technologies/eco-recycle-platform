import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, X } from 'lucide-react';

type UserRole = "user" | "tenant_admin" | "super_admin" | "customer" | "driver" | "scrapyard_admin" | "scrapyard_staff";

interface TenantUser {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  pnr_num?: string;
  tenant_id: number;
  first_name?: string;
  last_name?: string;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: TenantUser | null;
  tenantId: number;
  tenantName: string;
  onSuccess: () => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  user,
  tenantId,
  tenantName,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'tenant_admin' as UserRole,
    pnr_num: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        role: user.role,
        pnr_num: user.pnr_num || '',
        password: '', // Don't prefill password for editing
        first_name: user.first_name || '',
        last_name: user.last_name || ''
      });
    } else {
      setFormData({
        email: '',
        role: 'tenant_admin' as UserRole,
        pnr_num: '',
        password: '',
        first_name: '',
        last_name: ''
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing) {
        // Update existing user via secure Edge Function
        const { data: response, error: updateError } = await supabase.functions.invoke('update-tenant-user', {
          body: {
            userId: user.id,
            email: formData.email,
            firstName: formData.first_name,
            lastName: formData.last_name,
            role: formData.role,
            pnrNum: formData.pnr_num
          }
        });

        if (updateError) {
          console.error('Edge function error:', updateError);
          throw new Error(`Failed to update user: ${updateError.message}`);
        }

        if (response?.error) {
          console.error('User update error:', response.error);
          throw new Error(response.error);
        }

        // If password is provided, update it via Edge Function
        if (formData.password.trim()) {
          const { data: passwordResponse, error: passwordError } = await supabase.functions.invoke('update-user-password', {
            body: {
              userId: user.id,
              password: formData.password
            }
          });

          if (passwordError) {
            console.error('Password update error:', passwordError);
            throw new Error(`Failed to update password: ${passwordError.message}`);
          }

          if (passwordResponse?.error) {
            console.error('Password update error:', passwordResponse.error);
            throw new Error(passwordResponse.error);
          }
        }

        console.log('User updated successfully:', response);
        toast.success('User updated successfully');
      } else {
        // Create new user via secure Edge Function
        const { data: response, error: createError } = await supabase.functions.invoke('create-tenant-user', {
          body: {
            email: formData.email,
            password: formData.password,
            firstName: formData.first_name,
            lastName: formData.last_name,
            role: formData.role,
            tenantId: tenantId,
            pnrNum: formData.pnr_num
          }
        });

        if (createError) {
          console.error('Edge function error:', createError);
          throw new Error(`Failed to create user: ${createError.message}`);
        }

        if (response?.error) {
          console.error('User creation error:', response.error);
          throw new Error(response.error);
        }

        console.log('User created successfully:', response);
        toast.success('User created successfully');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error managing user:', error);
      toast.error(isEditing ? 'Failed to update user' : 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-admin-primary">
            {isEditing ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? `Update user information for ${tenantName}` 
              : `Create a new user for ${tenantName}`
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              disabled={isEditing} // Email shouldn't be changed for existing users
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value: UserRole) => handleInputChange('role', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="scrapyard_admin">Scrapyard Admin</SelectItem>
                <SelectItem value="scrapyard_staff">Scrapyard Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="pnr_num">Personal Number (Optional)</Label>
            <Input
              id="pnr_num"
              value={formData.pnr_num}
              onChange={(e) => handleInputChange('pnr_num', e.target.value)}
              placeholder="YYYYMMDD-XXXX"
            />
          </div>

          <div>
            <Label htmlFor="password">
              {isEditing ? 'New Password (leave blank to keep current)' : 'Password'}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required={!isEditing}
              minLength={8}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-admin-primary hover:bg-admin-primary/90"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting 
                ? (isEditing ? 'Updating...' : 'Creating...') 
                : (isEditing ? 'Update User' : 'Create User')
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserManagementModal;