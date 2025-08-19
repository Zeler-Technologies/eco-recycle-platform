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
}

interface UserManagementProps {
  onBack: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: '' as User['role'] | '',
    tenant_id: ''
  });
  const [editForm, setEditForm] = useState({ 
    email: '', 
    role: '' as User['role'] | '',
    tenant_id: ''
  });

  // Fetch users from Supabase
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('auth_users')
        .select(`
          *,
          tenants:tenant_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

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

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'super_admin': return 'bg-red-500 text-white hover:bg-red-600';
      case 'tenant_admin': return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'scrapyard_admin': return 'bg-green-500 text-white hover:bg-green-600';
      case 'driver': return 'bg-yellow-500 text-white hover:bg-yellow-600';
      case 'customer': return 'bg-gray-500 text-white hover:bg-gray-600';
      case 'user': return 'bg-purple-500 text-white hover:bg-purple-600';
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

    try {
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true
      });

      if (authError) {
        toast({
          title: "Error",
          description: "Failed to create user: " + authError.message,
          variant: "destructive"
        });
        return;
      }

      // Create user profile in auth_users table
      const { error: profileError } = await supabase
        .from('auth_users')
        .insert({
          id: authData.user.id,
          email: newUser.email,
          role: newUser.role,
          tenant_id: newUser.tenant_id ? parseInt(newUser.tenant_id) : null
        });

      if (profileError) {
        toast({
          title: "Error",
          description: "Failed to create user profile: " + profileError.message,
          variant: "destructive"
        });
        return;
      }

      setNewUser({ email: '', password: '', role: '', tenant_id: '' });
      setIsAddModalOpen(false);
      await fetchUsers(); // Refresh the user list
      
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
      tenant_id: user.tenant_id?.toString() || ''
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
    
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('auth_users')
        .update({
          email: editForm.email,
          role: editForm.role,
          tenant_id: editForm.tenant_id ? parseInt(editForm.tenant_id) : null,
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
    <div className="min-h-screen bg-purple-50">
      {/* Header */}
      <header className="bg-purple-600 text-white shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-white hover:text-purple-200 transition-colors"
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
        <Card className="bg-white shadow-lg border-purple-200">
          <CardHeader className="bg-purple-100 border-b border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600 rounded-full">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-purple-800">User Management</CardTitle>
                  <p className="text-purple-600 text-sm">Manage users and permissions for the system</p>
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
                    <h3 className="text-lg font-semibold text-purple-800">User Management</h3>
                    <p className="text-purple-600 text-sm">Manage all users in the system</p>
                  </div>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading users...</span>
                    </div>
                  ) : (
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-purple-800">Add New User</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="text-purple-700">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="user@example.com"
                        className="border-purple-200 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-purple-700">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="Enter password"
                        className="border-purple-200 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role" className="text-purple-700">Role</Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value as User['role'] })}>
                        <SelectTrigger className="border-purple-200 focus:border-purple-500">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                          <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                          <SelectItem value="scrapyard_admin">Scrapyard Admin</SelectItem>
                          <SelectItem value="scrapyard_staff">Scrapyard Staff</SelectItem>
                          <SelectItem value="driver">Driver</SelectItem>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tenant_id" className="text-purple-700">Tenant ID (optional)</Label>
                      <Input
                        id="tenant_id"
                        type="number"
                        value={newUser.tenant_id}
                        onChange={(e) => setNewUser({ ...newUser, tenant_id: e.target.value })}
                        placeholder="Enter tenant ID"
                        className="border-purple-200 focus:border-purple-500"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handleAddUser}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        Add User
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsAddModalOpen(false)}
                        className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
                  </Dialog>
                  )}
                </div>
                
                <Card className="border-purple-200">
                  <CardContent className="p-0">
                    <Table>
              <TableHeader>
                <TableRow className="bg-purple-50">
                  <TableHead className="text-purple-800 font-semibold">Email</TableHead>
                  <TableHead className="text-purple-800 font-semibold">Role</TableHead>
                  <TableHead className="text-purple-800 font-semibold">Tenant Name</TableHead>
                  <TableHead className="text-purple-800 font-semibold">Created</TableHead>
                  <TableHead className="text-purple-800 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-purple-25">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-purple-200 text-purple-800 font-semibold">
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
                    <TableCell className="text-purple-700">
                      {user.tenant_name || 'N/A'}
                    </TableCell>
                    <TableCell className="text-purple-700">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartEdit(user)}
                          className="border-purple-200 text-purple-700 hover:bg-purple-50"
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
                              <AlertDialogCancel className="border-purple-200 text-purple-700">
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
          <Card className="bg-white shadow-md border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-full">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {users.filter(u => u.role === 'super_admin').length}
                  </p>
                  <p className="text-sm text-purple-600">Super Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {users.filter(u => u.role === 'tenant_admin').length}
                  </p>
                  <p className="text-sm text-purple-600">Tenant Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gray-100 rounded-full">
                  <Users className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">
                    {users.filter(u => u.role === 'driver').length}
                  </p>
                  <p className="text-sm text-purple-600">Drivers</p>
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
                  <DialogTitle className="text-purple-800">Edit User</DialogTitle>
                  <DialogDescription>Update user information.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-email" className="text-purple-700">Email Address</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="user@example.com"
                      className="border-purple-200 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-role" className="text-purple-700">Role</Label>
                    <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value as User['role'] })}>
                      <SelectTrigger className="border-purple-200 focus:border-purple-500">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                        <SelectItem value="scrapyard_admin">Scrapyard Admin</SelectItem>
                        <SelectItem value="scrapyard_staff">Scrapyard Staff</SelectItem>
                        <SelectItem value="driver">Driver</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-tenant-id" className="text-purple-700">Tenant ID (optional)</Label>
                    <Input
                      id="edit-tenant-id"
                      type="number"
                      value={editForm.tenant_id}
                      onChange={(e) => setEditForm({ ...editForm, tenant_id: e.target.value })}
                      placeholder="Enter tenant ID"
                      className="border-purple-200 focus:border-purple-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleSaveEdit}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      Save Changes
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingUser(null)}
                      className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
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