import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, Edit, Trash2, ArrowLeft, Settings, Truck, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DriverManagement from './DriverManagement';

interface User {
  id: string;
  email: string;
  role: 'super_admin' | 'tenant_admin' | 'scrapyard_admin' | 'driver' | 'customer' | 'user' | 'scrapyard_staff';
  created_at: string;
  updated_at: string;
  tenant_id?: number;
  tenant_name?: string;
  first_name?: string;
  last_name?: string;
}

interface UserManagementProps {
  onBack: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Array<{ tenants_id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: '' as User['role'] | '',
    tenant_id: '',
    first_name: '',
    last_name: ''
  });
  const [editForm, setEditForm] = useState({ 
    email: '', 
    role: '' as User['role'] | '',
    tenant_id: '',
    first_name: '',
    last_name: ''
  });

  // Get current user's information
  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;

      const { data: userProfile, error: profileError } = await supabase
        .from('auth_users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return null;
      }

      return userProfile;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  };

  // Fetch users from Supabase with tenant filtering
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const currentUserProfile = await getCurrentUser();
      if (!currentUserProfile) return;

      setCurrentUser(currentUserProfile);

      // Build query with tenant filtering
      let query = supabase
        .from('auth_users')
        .select(`
          *,
          tenants:tenant_id (
            name
          )
        `);

      // If user is not super_admin, filter by their tenant only
      if (currentUserProfile.role !== 'super_admin') {
        if (currentUserProfile.tenant_id) {
          query = query.eq('tenant_id', currentUserProfile.tenant_id);
        } else {
          // If tenant_admin has no tenant_id, they can't see any users
          setUsers([]);
          return;
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch users: " + error.message,
          variant: "destructive"
        });
        return;
      }

      // Map the data to include tenant_name
      const usersWithTenantNames = (data || []).map(user => ({
        ...user,
        tenant_name: user.tenants?.name || null
      }));
      setUsers(usersWithTenantNames);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch tenants with filtering based on user role
  const fetchTenants = async () => {
    try {
      const currentUserProfile = await getCurrentUser();
      if (!currentUserProfile) return;

      let query = supabase
        .from('tenants')
        .select('tenants_id, name');

      // If user is not super_admin, only show their own tenant
      if (currentUserProfile.role !== 'super_admin') {
        if (currentUserProfile.tenant_id) {
          query = query.eq('tenants_id', currentUserProfile.tenant_id);
        } else {
          // If no tenant_id, they can't see any tenants
          setTenants([]);
          return;
        }
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) {
        console.error('Error fetching tenants:', error);
        return;
      }

      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTenants();
  }, []);

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'super_admin': return 'bg-red-500 text-white hover:bg-red-600';
      case 'tenant_admin': return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'scrapyard_admin': return 'bg-green-500 text-white hover:bg-green-600';
      case 'driver': return 'bg-yellow-500 text-white hover:bg-yellow-600';
      case 'customer': return 'bg-gray-500 text-white hover:bg-gray-600';
      case 'user': return 'bg-green-500 text-white hover:bg-green-600';
      case 'scrapyard_staff': return 'bg-orange-500 text-white hover:bg-orange-600';
      default: return 'bg-gray-300';
    }
  };

  const getRoleDisplayName = (role: User['role']) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'tenant_admin': return 'Tenant Admin';
      case 'scrapyard_admin': return 'Scrapyard Admin';
      case 'driver': return 'Driver';
      case 'customer': return 'Customer';
      case 'user': return 'User';
      case 'scrapyard_staff': return 'Scrapyard Staff';
      default: return role;
    }
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.role) {
      toast({
        title: "Error",
        description: "All fields must be filled in.",
        variant: "destructive"
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Error",
        description: "Unable to verify current user permissions.",
        variant: "destructive"
      });
      return;
    }

    // Tenant admins cannot assign super_admin role
    if (currentUser.role !== 'super_admin' && newUser.role === 'super_admin') {
      toast({
        title: "Not allowed",
        description: "Tenant admins cannot assign the Super Admin role.",
        variant: "destructive",
      });
      return;
    }

    try {
      let tenantId = newUser.tenant_id === 'none' ? null : parseInt(newUser.tenant_id) || null;

      // Enforce tenant restrictions for non-super admins
      if (currentUser.role !== 'super_admin') {
        if (!currentUser.tenant_id) {
          toast({
            title: "Error",
            description: "You don't have permission to create users.",
            variant: "destructive"
          });
          return;
        }
        // Force tenant_admin to only create users in their own tenant
        tenantId = currentUser.tenant_id;
      }

      // Use secured Edge Function to create user with service role
      const { data, error } = await supabase.functions.invoke('create-tenant-user', {
        body: {
          email: newUser.email,
          password: newUser.password,
          name: `${(newUser.first_name || '').trim()} ${(newUser.last_name || '').trim()}`.trim(),
          role: newUser.role,
          tenantId: tenantId,
          pnrNum: null,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: `Failed to create user: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      setNewUser({ email: '', password: '', role: '', tenant_id: '', first_name: '', last_name: '' });
      setIsAddModalOpen(false);
      await fetchUsers();

      toast({
        title: "User added",
        description: `${newUser.email} has been added successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      });
    }
  };
  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('auth_users')
        .delete()
        .eq('id', userId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete user: " + error.message,
          variant: "destructive"
        });
        return;
      }

      await fetchUsers(); // Refresh the user list
      toast({
        title: "User deleted",
        description: "User has been removed from the system.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const getInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const handleStartEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({ 
      email: user.email, 
      role: user.role,
      tenant_id: user.tenant_id?.toString() || 'none',
      first_name: user.first_name || '',
      last_name: user.last_name || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.email || !editForm.role) {
      toast({
        title: 'Error',
        description: 'All fields must be filled in.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!editingUser || !currentUser) return;

    // Tenant admins cannot assign super_admin role
    if (currentUser.role !== 'super_admin' && editForm.role === 'super_admin') {
      toast({
        title: 'Not allowed',
        description: 'Tenant admins cannot assign the Super Admin role.',
        variant: 'destructive',
      });
      return;
    }

    try {
      let tenantId = editForm.tenant_id === 'none' ? null : parseInt(editForm.tenant_id) || null;
      
      // Enforce tenant restrictions for non-super admins
      if (currentUser.role !== 'super_admin') {
        if (!currentUser.tenant_id) {
          toast({
            title: "Error",
            description: "You don't have permission to edit users.",
            variant: "destructive"
          });
          return;
        }
        // Force tenant_admin to only edit users in their own tenant
        tenantId = currentUser.tenant_id;
        
        // Verify the user being edited belongs to their tenant
        if (editingUser.tenant_id !== currentUser.tenant_id) {
          toast({
            title: "Error",
            description: "You can only edit users in your own tenant.",
            variant: "destructive"
          });
          return;
        }
      }
      
      const { error } = await supabase
        .from('auth_users')
        .update({
          email: editForm.email,
          role: editForm.role,
          tenant_id: tenantId,
          first_name: editForm.first_name || null,
          last_name: editForm.last_name || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update user: ' + error.message,
          variant: 'destructive',
        });
        return;
      }

      setEditingUser(null);
      await fetchUsers(); // Refresh the user list
      toast({ 
        title: 'User updated', 
        description: 'User information has been saved.' 
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-green-600 text-white shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-white hover:text-green-200 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
                <span>Tillbaka till Dashboard</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6" />
              <h1 className="text-xl font-bold">Användarhantering</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Card className="bg-white shadow-lg border-green-200">
          <CardHeader className="bg-green-100 border-b border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600 rounded-full">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-green-800">User Management</CardTitle>
                  <p className="text-green-600 text-sm">Manage users and permissions for the system</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="fleet" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Fleet Management
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="users" className="mt-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">User Management</h3>
                    <p className="text-green-600 text-sm">Manage all users in the system</p>
                  </div>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading users...</span>
                    </div>
                  ) : (
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-green-800">Add New User</DialogTitle>
                    <DialogDescription>Enter details for the new user.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="text-green-700">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="user@example.com"
                        className="border-green-200 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="first-name" className="text-green-700">First Name</Label>
                      <Input
                        id="first-name"
                        type="text"
                        value={newUser.first_name}
                        onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                        placeholder="Enter first name"
                        className="border-green-200 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last-name" className="text-green-700">Last Name</Label>
                      <Input
                        id="last-name"
                        type="text"
                        value={newUser.last_name}
                        onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                        placeholder="Enter last name"
                        className="border-green-200 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-green-700">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="Enter password"
                        className="border-green-200 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role" className="text-green-700">Role</Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value as User['role'] })}>
                        <SelectTrigger className="border-green-200 focus:border-green-500">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {currentUser?.role === 'super_admin' && (
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          )}
                          <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                          <SelectItem value="scrapyard_admin">Scrapyard Admin</SelectItem>
                          <SelectItem value="scrapyard_staff">Scrapyard Staff</SelectItem>
                          <SelectItem value="driver">Driver</SelectItem>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Only show tenant selection for super admins */}
                    {currentUser?.role === 'super_admin' && (
                      <div>
                        <Label htmlFor="tenant_id" className="text-green-700">Tenant (optional)</Label>
                        <Select 
                          value={newUser.tenant_id} 
                          onValueChange={(value) => setNewUser({ ...newUser, tenant_id: value })}
                        >
                          <SelectTrigger className="border-green-200 focus:border-green-500">
                            <SelectValue placeholder="Select tenant" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Tenant</SelectItem>
                            {tenants.map((tenant) => (
                              <SelectItem key={tenant.tenants_id} value={tenant.tenants_id.toString()}>
                                {tenant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {/* Show readonly tenant for non-super admins */}
                    {currentUser?.role !== 'super_admin' && currentUser?.tenant_id && (
                      <div>
                        <Label className="text-green-700">Tenant</Label>
                        <Input
                          value={tenants.find(t => t.tenants_id === currentUser.tenant_id)?.name || 'Loading...'}
                          disabled
                          className="bg-muted cursor-not-allowed border-green-200"
                        />
                      </div>
                    )}
                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handleAddUser}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Add User
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsAddModalOpen(false)}
                        className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
                  </Dialog>
                  )}
                </div>
                
                <Card className="border-green-200">
                  <CardContent className="p-0">
                    <Table>
              <TableHeader>
                <TableRow className="bg-green-50">
                  <TableHead className="text-green-800 font-semibold">Email</TableHead>
                  <TableHead className="text-green-800 font-semibold">Role</TableHead>
                  <TableHead className="text-green-800 font-semibold">Tenant Name</TableHead>
                  <TableHead className="text-green-800 font-semibold">Created</TableHead>
                  <TableHead className="text-green-800 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-green-25">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-green-200 text-green-800 font-semibold">
                            {getInitials(user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-green-700">
                      {user.tenant_name || 'N/A'}
                    </TableCell>
                    <TableCell className="text-green-700">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartEdit(user)}
                          className="border-green-200 text-green-700 hover:bg-green-50"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.email}? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-green-200 text-green-700">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* User Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card className="bg-white shadow-md border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-full">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {users.filter(u => u.role === 'super_admin').length}
                  </p>
                  <p className="text-sm text-green-600">Super Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {users.filter(u => u.role === 'tenant_admin').length}
                  </p>
                  <p className="text-sm text-green-600">Tenant Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gray-100 rounded-full">
                  <Users className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">
                    {users.filter(u => u.role === 'driver').length}
                  </p>
                  <p className="text-sm text-green-600">Drivers</p>
                </div>
              </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

            {/* Edit User Modal */}
            <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) setEditingUser(null); }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-green-800">Edit User</DialogTitle>
                  <DialogDescription>Update user information.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-email" className="text-green-700">Email Address</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="user@example.com"
                      className="border-green-200 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-first-name" className="text-green-700">First Name</Label>
                    <Input
                      id="edit-first-name"
                      type="text"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      placeholder="Enter first name"
                      className="border-green-200 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-last-name" className="text-green-700">Last Name</Label>
                    <Input
                      id="edit-last-name"
                      type="text"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      placeholder="Enter last name"
                      className="border-green-200 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-role" className="text-green-700">Role</Label>
                    <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value as User['role'] })}>
                      <SelectTrigger className="border-green-200 focus:border-green-500">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentUser?.role === 'super_admin' && (
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        )}
                        <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                        <SelectItem value="scrapyard_admin">Scrapyard Admin</SelectItem>
                        <SelectItem value="scrapyard_staff">Scrapyard Staff</SelectItem>
                        <SelectItem value="driver">Driver</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Only show tenant selection for super admins */}
                  {currentUser?.role === 'super_admin' && (
                    <div>
                      <Label htmlFor="edit-tenant-id" className="text-green-700">Tenant (optional)</Label>
                      <Select 
                        value={editForm.tenant_id} 
                        onValueChange={(value) => setEditForm({ ...editForm, tenant_id: value })}
                      >
                        <SelectTrigger className="border-green-200 focus:border-green-500">
                          <SelectValue placeholder="Select tenant" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Tenant</SelectItem>
                          {tenants.map((tenant) => (
                            <SelectItem key={tenant.tenants_id} value={tenant.tenants_id.toString()}>
                              {tenant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {/* Show readonly tenant for non-super admins */}
                  {currentUser?.role !== 'super_admin' && currentUser?.tenant_id && (
                    <div>
                      <Label className="text-green-700">Tenant</Label>
                      <Input
                        value={tenants.find(t => t.tenants_id === currentUser.tenant_id)?.name || 'Loading...'}
                        disabled
                        className="bg-muted cursor-not-allowed border-green-200"
                      />
                    </div>
                  )}
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleSaveEdit}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Save Changes
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingUser(null)}
                      className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

          <TabsContent value="fleet" className="mt-6">
            <div className="bg-white rounded-lg">
              <DriverManagement onBack={() => setActiveTab('users')} embedded={true} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </div>
</div>
  );
};

export default UserManagement;