import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Truck, User } from 'lucide-react';

const LoginSelection = () => {
  const navigate = useNavigate();

  const loginTypes = [
    {
      type: 'super-admin',
      title: 'Super Admin',
      description: 'System administrator with full access',
      icon: <Shield className="h-8 w-8" />,
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      hoverColor: 'hover:from-red-600 hover:to-red-700',
    },
    {
      type: 'tenant-admin',
      title: 'Tenant Admin',
      description: 'Scrapyard manager and operations',
      icon: <Users className="h-8 w-8" />,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
    },
    {
      type: 'driver',
      title: 'Driver',
      description: 'Vehicle pickup and transport',
      icon: <Truck className="h-8 w-8" />,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
    },
    {
      type: 'customer',
      title: 'Customer',
      description: 'Request vehicle pickup service',
      icon: <User className="h-8 w-8" />,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">PantaBilen</h1>
          <p className="text-yellow-100 text-lg">Välj din inloggningstyp</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loginTypes.map((loginType) => (
            <Card
              key={loginType.type}
              className={`cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${loginType.color} ${loginType.hoverColor} text-white border-none`}
              onClick={() => navigate(`/login/${loginType.type}`)}
            >
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-white/20 rounded-full">
                    {loginType.icon}
                  </div>
                </div>
                <CardTitle className="text-xl font-bold">{loginType.title}</CardTitle>
                <CardDescription className="text-white/80">
                  {loginType.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-white/70">Klicka för att logga in</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginSelection;