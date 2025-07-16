import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Recycle, Car, Users, Calendar, Settings, LogOut, Plus, MapPin, Clock } from 'lucide-react';

const TenantDashboard = () => {
  const { user, logout } = useAuth();

  const stats = [
    {
      title: 'Nya ärenden',
      value: '12',
      change: '+4 idag',
      icon: Car,
      color: 'bg-status-new'
    },
    {
      title: 'Pågående',
      value: '8',
      change: '+2 sedan igår',
      icon: Clock,
      color: 'bg-status-processing'
    },
    {
      title: 'Klara',
      value: '34',
      change: '+6 denna vecka',
      icon: Recycle,
      color: 'bg-status-completed'
    },
    {
      title: 'Aktiva förare',
      value: '5',
      change: 'Alla tillgängliga',
      icon: Users,
      color: 'bg-tenant-primary'
    }
  ];

  const recentOrders = [
    { id: 'ORD001', customer: 'Anna Andersson', vehicle: 'Volvo V70 2015', location: 'Stockholm', status: 'Ny', price: '4,500 kr' },
    { id: 'ORD002', customer: 'Erik Johansson', vehicle: 'Saab 9-3 2012', location: 'Göteborg', status: 'Pågående', price: '3,200 kr' },
    { id: 'ORD003', customer: 'Maria Nilsson', vehicle: 'BMW X5 2018', location: 'Malmö', status: 'Hämtas', price: '8,900 kr' },
    { id: 'ORD004', customer: 'Lars Petersson', vehicle: 'Ford Focus 2010', location: 'Uppsala', status: 'Ny', price: '2,800 kr' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ny': return 'bg-status-new text-white';
      case 'Pågående': return 'bg-status-processing text-white';
      case 'Hämtas': return 'bg-status-pending text-white';
      case 'Klar': return 'bg-status-completed text-white';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="theme-tenant min-h-screen bg-tenant-muted">
      {/* Header */}
      <header className="bg-tenant-primary text-tenant-primary-foreground shadow-custom-md">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Recycle className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Panta Bilen</h1>
                <p className="text-tenant-primary-foreground/80">{user?.tenant_name || 'Skrotbil hantering'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold">{user?.name}</p>
                <p className="text-sm text-tenant-primary-foreground/80">{user?.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="border-tenant-primary-foreground/30 text-tenant-primary-foreground hover:bg-tenant-primary-foreground/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logga ut
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-white shadow-custom-sm hover:shadow-custom-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.color} text-white`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Management */}
          <Card className="lg:col-span-2 bg-white shadow-custom-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-tenant-primary">Ärendehantering</CardTitle>
                  <CardDescription>Hantera bilhämtningar och värderingar</CardDescription>
                </div>
                <Button className="bg-tenant-primary hover:bg-tenant-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Nytt ärende
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-tenant-accent/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-tenant-accent rounded-full">
                        <Car className="h-4 w-4 text-tenant-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{order.id} - {order.customer}</h4>
                        <p className="text-sm text-muted-foreground">{order.vehicle}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {order.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <div className="text-right">
                        <p className="font-semibold">{order.price}</p>
                        <p className="text-sm text-muted-foreground">Uppskattad</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white shadow-custom-sm">
            <CardHeader>
              <CardTitle className="text-tenant-primary">Snabbåtgärder</CardTitle>
              <CardDescription>Vanliga uppgifter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schemaläggning
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Hantera förare
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Prishantering
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MapPin className="h-4 w-4 mr-2" />
                Servicezoner
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card className="mt-6 bg-white shadow-custom-sm">
          <CardHeader>
            <CardTitle className="text-tenant-primary">Dagens schema</CardTitle>
            <CardDescription>Planerade hämtningar och aktiviteter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { time: '09:00', driver: 'Erik Andersson', task: 'Hämta Volvo V70 - Stockholm', status: 'Pågående' },
                { time: '11:30', driver: 'Maria Larsson', task: 'Värdera BMW X5 - Malmö', status: 'Schemalagd' },
                { time: '14:00', driver: 'Johan Svensson', task: 'Hämta Saab 9-3 - Göteborg', status: 'Schemalagd' },
                { time: '16:30', driver: 'Anna Petersson', task: 'Leverera delar - Återvinning', status: 'Schemalagd' }
              ].map((schedule, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-tenant-accent/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="font-bold text-tenant-primary">{schedule.time}</p>
                    </div>
                    <div>
                      <p className="font-medium">{schedule.task}</p>
                      <p className="text-sm text-muted-foreground">{schedule.driver}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-tenant-primary border-tenant-primary">
                    {schedule.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TenantDashboard;