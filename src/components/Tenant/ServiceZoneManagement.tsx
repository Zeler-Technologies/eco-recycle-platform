import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, ArrowLeft, CheckCircle, Download, Edit, FileUp, MapPin, Plus, Search, Settings, Trash2, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ServiceZoneManagementProps {
  onBack: () => void;
}

// Mock data för svenska postnummer
const mockPostalCodes = [
  { code: '11120', city: 'Stockholm', address: 'Drottninggatan 45', lat: 59.3293, lng: 18.0686, active: true },
  { code: '41118', city: 'Göteborg', address: 'Avenyn 12', lat: 57.7089, lng: 11.9746, active: true },
  { code: '21147', city: 'Malmö', address: 'Stortorget 8', lat: 55.6050, lng: 13.0038, active: false },
  { code: '41314', city: 'Göteborg', address: 'Nordstan 1', lat: 57.7089, lng: 11.9746, active: true },
  { code: '11634', city: 'Stockholm', address: 'Östermalm 23', lat: 59.3293, lng: 18.0686, active: false },
];

const mockPickupRequests = [
  { id: 1, address: 'Storgatan 15, 11120 Stockholm', distance: 12, deduction: -250, bonus: 0, total: -250, status: 'completed' },
  { id: 2, address: 'Kungsgatan 30, 41118 Göteborg', distance: 35, deduction: -750, bonus: 500, total: -250, status: 'confirmed' },
  { id: 3, address: 'Malmögatan 5, 21147 Malmö', distance: 85, deduction: -1500, bonus: 1000, total: -500, status: 'requested' },
];

const distanceTiers = [
  { range: '0-20 km', deduction: -250 },
  { range: '21-50 km', deduction: -750 },
  { range: '51-100 km', deduction: -1500 },
  { range: '100+ km', deduction: -2500 },
];

export const ServiceZoneManagement: React.FC<ServiceZoneManagementProps> = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [baseAddress, setBaseAddress] = useState('Industrivägen 12, 41234 Göteborg');
  const [isAddingPostal, setIsAddingPostal] = useState(false);
  const [newPostalCode, setNewPostalCode] = useState('');
  const [selectedTab, setSelectedTab] = useState('zones');

  const filteredPostalCodes = mockPostalCodes.filter(code => 
    code.code.includes(searchTerm) || 
    code.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Tillbaka
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary">Servicezoner & Prisberäkning</h1>
          <p className="text-muted-foreground">Hantera geografiska områden och prislogik för hämtningar</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="zones">Hämtningszoner</TabsTrigger>
          <TabsTrigger value="address">Basadress</TabsTrigger>
          <TabsTrigger value="pricing">Prislogik</TabsTrigger>
          <TabsTrigger value="statistics">Statistik</TabsTrigger>
        </TabsList>

        {/* Hämtningszoner Tab */}
        <TabsContent value="zones" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Postnummerdatabas & Täckningsområden</CardTitle>
                  <CardDescription>Konfigurera vilka postnummer som omfattas av era hämtningstjänster</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Importera postnummer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Importera postnummerdatabas</DialogTitle>
                        <DialogDescription>
                          Ladda upp en CSV-fil med svenska postnummer (SE.txt format)
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Om SE.txt filen</AlertTitle>
                          <AlertDescription>
                            SE.txt filen kan laddas ner från GeoNames.org gratis. Alternativt kan du manuellt lägga till postnummer nedan.
                          </AlertDescription>
                        </Alert>
                        <Input type="file" accept=".csv,.txt" />
                      </div>
                      <DialogFooter>
                        <Button variant="outline">Avbryt</Button>
                        <Button>Importera</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isAddingPostal} onOpenChange={setIsAddingPostal}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Lägg till postnummer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Lägg till nytt postnummer</DialogTitle>
                        <DialogDescription>Aktivera ett nytt postnummer för hämtningstjänster</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="postal">Postnummer</Label>
                          <Input 
                            id="postal" 
                            placeholder="12345" 
                            value={newPostalCode}
                            onChange={(e) => setNewPostalCode(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="city">Ort</Label>
                          <Input id="city" placeholder="Stockholm" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddingPostal(false)}>Avbryt</Button>
                        <Button onClick={() => setIsAddingPostal(false)}>Lägg till</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Sök postnummer eller ort..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrera status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla</SelectItem>
                    <SelectItem value="active">Aktiva</SelectItem>
                    <SelectItem value="inactive">Inaktiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Postnummer</TableHead>
                        <TableHead>Ort</TableHead>
                        <TableHead>Adress</TableHead>
                        <TableHead>Koordinater</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Åtgärder</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {filteredPostalCodes.map((postal, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{postal.code}</TableCell>
                        <TableCell>{postal.city}</TableCell>
                        <TableCell>{postal.address}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {postal.lat.toFixed(4)}, {postal.lng.toFixed(4)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={postal.active ? "default" : "secondary"}>
                            {postal.active ? "Aktiv" : "Inaktiv"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Basadress Tab */}
        <TabsContent value="address" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skrotfirmans Basadress</CardTitle>
              <CardDescription>Den fysiska adress varifrån alla hämtningar utgår</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="base-address">Basadress</Label>
                <Textarea 
                  id="base-address"
                  value={baseAddress}
                  onChange={(e) => setBaseAddress(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Denna adress används för att beräkna avstånd till hämtningsplatser
                </p>
              </div>
              
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Adress verifierad</AlertTitle>
                <AlertDescription>
                  Adressen har geokodats till koordinater: 57.7089, 11.9746
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button>Uppdatera adress</Button>
                <Button variant="outline">Verifiera på karta</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prislogik Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distansbaserade Avdrag</CardTitle>
                <CardDescription>Automatiska avdrag baserat på körsträcka</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {distanceTiers.map((tier, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="font-medium">{tier.range}</span>
                      <span className="text-destructive font-bold">{tier.deduction} SEK</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Settings className="h-4 w-4 mr-2" />
                  Redigera prislogik
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bonuserbjudanden</CardTitle>
                <CardDescription>Tillfälliga kampanjer och bonusar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 border rounded-lg bg-green-50">
                  <h4 className="font-medium text-green-800">Sommarkampanj 2024</h4>
                  <p className="text-sm text-green-600">+500 SEK extra för alla hämtningar</p>
                  <p className="text-xs text-green-500 mt-1">Aktiv till 31 augusti</p>
                </div>
                
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Lägg till bonus
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Senaste Hämtningsförfrågningar</CardTitle>
              <CardDescription>Översikt av prisberäkningar och ersättningar</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Adress</TableHead>
                    <TableHead>Avstånd</TableHead>
                    <TableHead>Avdrag</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Total ersättning</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPickupRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.address}</TableCell>
                      <TableCell>{request.distance} km</TableCell>
                      <TableCell className="text-destructive">{request.deduction} SEK</TableCell>
                      <TableCell className="text-green-600">+{request.bonus} SEK</TableCell>
                      <TableCell className="font-bold">{request.total} SEK</TableCell>
                      <TableCell>
                        <Badge variant={
                          request.status === 'completed' ? 'default' : 
                          request.status === 'confirmed' ? 'secondary' : 'outline'
                        }>
                          {request.status === 'completed' ? 'Genomförd' : 
                           request.status === 'confirmed' ? 'Bekräftad' : 'Förfrågan'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistik Tab */}
        <TabsContent value="statistics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Aktiva Zoner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">247</div>
                <p className="text-xs text-muted-foreground">postnummer täckta</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Genomsnittlig Distans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42 km</div>
                <p className="text-xs text-muted-foreground">senaste 30 dagarna</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avvisade Förfrågningar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">18</div>
                <p className="text-xs text-muted-foreground">utanför täckningsområde</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Veckostatistik</CardTitle>
              <CardDescription>Accepterade vs avvisade adresser</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Accepterade förfrågningar</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '84%' }}></div>
                    </div>
                    <span className="text-sm font-medium">84%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Avvisade förfrågningar</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-secondary rounded-full h-2">
                      <div className="bg-destructive h-2 rounded-full" style={{ width: '16%' }}></div>
                    </div>
                    <span className="text-sm font-medium">16%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rekommendationer</CardTitle>
              <CardDescription>Förslag för att optimera täckningsområden</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Utvidgningsmöjlighet</AlertTitle>
                <AlertDescription>
                  12 förfrågningar från postnummer 41527 senaste veckan. Överväg att lägga till detta område.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};