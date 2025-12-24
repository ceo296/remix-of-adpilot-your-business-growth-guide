import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAgencyClients } from '@/hooks/useAgencyClients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Building2, 
  Plus, 
  ArrowRight, 
  Upload, 
  Trash2, 
  Edit2,
  Loader2,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

const AgencyClients = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAgency, clients, selectedClientId, setSelectedClientId, loading, addClient, deleteClient } = useAgencyClients();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientLogo, setNewClientLogo] = useState<string | null>(null);
  const [newClientWebsite, setNewClientWebsite] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#E31E24');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle redirects with useEffect to avoid render-time navigation
  useEffect(() => {
    if (authLoading || loading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!isAgency) {
      navigate('/dashboard');
      return;
    }
  }, [authLoading, loading, user, isAgency, navigate]);

  // Show loading or nothing while checking
  if (authLoading || loading || !user || !isAgency) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewClientLogo(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddClient = async () => {
    if (!newClientName.trim()) {
      toast.error('יש להזין שם לקוח');
      return;
    }

    setIsSubmitting(true);
    try {
      await addClient({
        business_name: newClientName.trim(),
        logo_url: newClientLogo || undefined,
        website_url: newClientWebsite.trim() || undefined,
        primary_color: primaryColor,
      });
      toast.success('הלקוח נוסף בהצלחה!');
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בהוספת לקוח');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!confirm(`האם למחוק את "${clientName}"? הפעולה בלתי הפיכה.`)) return;
    
    try {
      await deleteClient(clientId);
      toast.success('הלקוח נמחק');
    } catch (error: any) {
      toast.error(error.message || 'שגיאה במחיקת לקוח');
    }
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    toast.success('הלקוח נבחר');
    navigate('/dashboard');
  };

  const resetForm = () => {
    setNewClientName('');
    setNewClientLogo(null);
    setNewClientWebsite('');
    setPrimaryColor('#E31E24');
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ניהול לקוחות</h1>
              <p className="text-sm text-muted-foreground">סוכנות שיווק</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowRight className="w-4 h-4 ml-2" />
              חזרה לדשבורד
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף לקוח
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>הוספת לקוח חדש</DialogTitle>
                  <DialogDescription>
                    הזן את פרטי הלקוח החדש
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>שם העסק *</Label>
                    <Input
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="שם העסק"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>לוגו</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      {newClientLogo ? (
                        <img src={newClientLogo} alt="Logo" className="h-14 object-contain" />
                      ) : (
                        <div className="text-center">
                          <Upload className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">לחץ להעלאה</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>אתר אינטרנט</Label>
                    <Input
                      value={newClientWebsite}
                      onChange={(e) => setNewClientWebsite(e.target.value)}
                      placeholder="https://..."
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>צבע ראשי</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground">{primaryColor}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleAddClient}
                    disabled={isSubmitting || !newClientName.trim()}
                    className="w-full"
                    variant="gradient"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        מוסיף...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 ml-2" />
                        הוסף לקוח
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Stats */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{clients.length} לקוחות</span>
          </div>
        </div>

        {/* Clients Grid */}
        {clients.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">עדיין אין לקוחות</h3>
              <p className="text-muted-foreground mb-4">הוסף את הלקוח הראשון שלך כדי להתחיל</p>
              <Button variant="gradient" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 ml-2" />
                הוסף לקוח
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <Card 
                key={client.id}
                className={`group cursor-pointer transition-all hover:shadow-lg ${
                  selectedClientId === client.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleSelectClient(client.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    {client.logo_url ? (
                      <img 
                        src={client.logo_url} 
                        alt={client.business_name}
                        className="h-12 w-12 object-contain rounded-lg"
                      />
                    ) : (
                      <div 
                        className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: client.primary_color || '#E31E24' }}
                      >
                        {client.business_name.charAt(0)}
                      </div>
                    )}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profile?client=${client.id}`);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClient(client.id, client.business_name);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-foreground mb-1">{client.business_name}</h3>
                  {client.website_url && (
                    <p className="text-sm text-muted-foreground truncate">{client.website_url}</p>
                  )}
                  
                  {selectedClientId === client.id && (
                    <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary font-medium">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      לקוח פעיל
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AgencyClients;
