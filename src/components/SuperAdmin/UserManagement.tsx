import React, { useState } from 'react';
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
import { Users, Plus, Edit, Trash2, ArrowLeft, Settings, Truck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import DriverManagement from './DriverManagement';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Chef' | 'Operatör';
  status: 'Aktiv' | 'Inaktiv';
}

interface UserManagementProps {
  onBack: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Anna Andersson',
      email: 'anna.andersson@bilteknikskrot.se',
      role: 'Administrator',
      status: 'Aktiv'
    },
    {
      id: '2',
      name: 'Björn Karlsson',
      email: 'bjorn.karlsson@bilteknikskrot.se',
      role: 'Chef',
      status: 'Aktiv'
    },
    {
      id: '3',
      name: 'Cecilia Lindberg',
      email: 'cecilia.lindberg@bilteknikskrot.se',
      role: 'Operatör',
      status: 'Inaktiv'
    }
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '' as User['role'] | ''
  });
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '' as User['role'] | '' });

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'Administrator': return 'bg-red-500 text-white hover:bg-red-600';
      case 'Chef': return 'bg-green-500 text-white hover:bg-green-600';
      case 'Operatör': return 'bg-gray-500 text-white hover:bg-gray-600';
      default: return 'bg-gray-300';
    }
  };

  const getStatusColor = (status: User['status']) => {
    return status === 'Aktiv' 
      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
      : 'bg-red-100 text-red-800 hover:bg-red-200';
  };

  const validateEmail = (email: string) => {
    return email.endsWith('@bilteknikskrot.se');
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.role) {
      toast({
        title: "Fel",
        description: "Alla fält måste fyllas i.",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(newUser.email)) {
      toast({
        title: "Fel",
        description: "E-postadressen måste ha domänen @bilteknikskrot.se",
        variant: "destructive"
      });
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as User['role'],
      status: 'Aktiv'
    };

    setUsers([...users, user]);
    setNewUser({ name: '', email: '', role: '' });
    setIsAddModalOpen(false);
    
    toast({
      title: "Användaren har lagts till",
      description: `${user.name} har lagts till och kommer att få inloggningsinformation via e-post.`,
    });
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
    toast({
      title: "Användare borttagen",
      description: "Användaren har tagits bort från systemet.",
    });
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'Aktiv' ? 'Inaktiv' : 'Aktiv' }
        : user
    ));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleStartEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role });
  };

  const handleSaveEdit = () => {
    if (!editForm.name || !editForm.email || !editForm.role) {
      toast({
        title: 'Fel',
        description: 'Alla fält måste fyllas i.',
        variant: 'destructive',
      });
      return;
    }
    if (!validateEmail(editForm.email)) {
      toast({
        title: 'Fel',
        description: 'E-postadressen måste ha domänen @bilteknikskrot.se',
        variant: 'destructive',
      });
      return;
    }
    if (!editingUser) return;

    setUsers(users.map(u =>
      u.id === editingUser.id
        ? { ...u, name: editForm.name, email: editForm.email, role: editForm.role as User['role'] }
        : u
    ));

    setEditingUser(null);
    toast({ title: 'Användare uppdaterad', description: 'Användarinformationen har sparats.' });
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
                  <CardTitle className="text-purple-800">Hantera Förare</CardTitle>
                  <p className="text-purple-600 text-sm">Hantera användare och flotta för skrotkontot</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Användare
                </TabsTrigger>
                <TabsTrigger value="fleet" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Flotthantering
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="users" className="mt-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-purple-800">Användarhantering</h3>
                    <p className="text-purple-600 text-sm">Hantera alla användare kopplade till skrotkontot</p>
                  </div>
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Lägg till användare
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-purple-800">Lägg till ny användare</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-purple-700">Fullständigt namn</Label>
                      <Input
                        id="name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="Ange fullständigt namn"
                        className="border-purple-200 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-purple-700">E-postadress</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="namn@bilteknikskrot.se"
                        className="border-purple-200 focus:border-purple-500"
                      />
                      <p className="text-xs text-purple-600 mt-1">
                        E-postadressen måste ha domänen @bilteknikskrot.se
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="role" className="text-purple-700">Roll</Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value as User['role'] })}>
                        <SelectTrigger className="border-purple-200 focus:border-purple-500">
                          <SelectValue placeholder="Välj roll" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Administrator">Administratör</SelectItem>
                          <SelectItem value="Chef">Chef/Manager</SelectItem>
                          <SelectItem value="Operatör">Operatör</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handleAddUser}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        Lägg till användare
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsAddModalOpen(false)}
                        className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        Avbryt
                      </Button>
                    </div>
                  </div>
                </DialogContent>
                  </Dialog>
                </div>
                
                <Card className="border-purple-200">
                  <CardContent className="p-0">
                    <Table>
              <TableHeader>
                <TableRow className="bg-purple-50">
                  <TableHead className="text-purple-800 font-semibold">Namn</TableHead>
                  <TableHead className="text-purple-800 font-semibold">E-postadress</TableHead>
                  <TableHead className="text-purple-800 font-semibold">Roll</TableHead>
                  <TableHead className="text-purple-800 font-semibold">Status</TableHead>
                  <TableHead className="text-purple-800 font-semibold">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-purple-25">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-purple-200 text-purple-800 font-semibold">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-purple-700">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className="p-0 border-0 bg-transparent"
                      >
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </button>
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
                          Redigera
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Ta bort
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Ta bort användare</AlertDialogTitle>
                              <AlertDialogDescription>
                                Är du säker på att du vill ta bort {user.name}? 
                                Denna åtgärd kan inte ångras.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-purple-200 text-purple-700">
                                Avbryt
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Ta bort
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
                    {users.filter(u => u.role === 'Administrator').length}
                  </p>
                  <p className="text-sm text-purple-600">Administratörer</p>
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
                    {users.filter(u => u.role === 'Chef').length}
                  </p>
                  <p className="text-sm text-purple-600">Chefer/Managers</p>
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
                    {users.filter(u => u.role === 'Operatör').length}
                  </p>
                  <p className="text-sm text-purple-600">Operatörer</p>
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
                  <DialogTitle className="text-purple-800">Redigera användare</DialogTitle>
                  <DialogDescription>Uppdatera informationen för användaren.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-name" className="text-purple-700">Fullständigt namn</Label>
                    <Input
                      id="edit-name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Ange fullständigt namn"
                      className="border-purple-200 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email" className="text-purple-700">E-postadress</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="namn@bilteknikskrot.se"
                      className="border-purple-200 focus:border-purple-500"
                    />
                    <p className="text-xs text-purple-600 mt-1">
                      E-postadressen måste ha domänen @bilteknikskrot.se
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="edit-role" className="text-purple-700">Roll</Label>
                    <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value as User['role'] })}>
                      <SelectTrigger className="border-purple-200 focus:border-purple-500">
                        <SelectValue placeholder="Välj roll" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Administrator">Administratör</SelectItem>
                        <SelectItem value="Chef">Chef/Manager</SelectItem>
                        <SelectItem value="Operatör">Operatör</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleSaveEdit}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      Spara ändringar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingUser(null)}
                      className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      Avbryt
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