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
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        role: user.role,
        pnr_num: user.pnr_num || '',
        password: '' // Don't prefill password for editing
      });
    } else {
      setFormData({
        email: '',
        role: 'tenant_admin' as UserRole,
        pnr_num: '',
        password: ''
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing) {
        // Update existing user
        const { error: updateError } = await supabase
          .from('auth_users')
          .update({
            email: formData.email,
            role: formData.role,
            pnr_num: formData.pnr_num || null,
          })
          .eq('id', user.id);

        if (updateError) throw updateError;

        // If password is provided, update it via Auth API
        if (formData.password.trim()) {
          const { error: passwordError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: formData.password }
          );
          if (passwordError) throw passwordError;
        }

        toast.success('User updated successfully');
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true,
          user_metadata: {
            tenant_id: tenantId,
            role: formData.role
          }
        });

        if (createError) throw createError;

        // Update the auth_users table with additional info
        if (newUser.user) {
          const { error: updateError } = await supabase
            .from('auth_users')
            .update({
              tenant_id: tenantId,
              role: formData.role,
              pnr_num: formData.pnr_num || null,
            })
            .eq('id', newUser.user.id);

          if (updateError) throw updateError;
        }

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