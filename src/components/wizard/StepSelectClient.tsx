import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Building2, Plus, Upload, Users, ArrowRight, Loader2, Globe, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type ClientProfile = Tables<'client_profiles'>;

interface StepSelectClientProps {
  onNext: (clientId: string, clientName: string, clientLogo: string | null, websiteUrl: string | null) => void;
  onPrev: () => void;
}

const StepSelectClient = ({ onNext, onPrev }: StepSelectClientProps) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  // Add client dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientLogo, setNewClientLogo] = useState<string | null>(null);
  const [newClientWebsite, setNewClientWebsite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing clients
  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('client_profiles')
          .select('*')
          .eq('agency_owner_id', user.id)
          .eq('is_agency_profile', false)
          .order('business_name');

        if (error) throw error;
        setClients(data || []);
      } catch (err) {
        console.error('Error fetching clients:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [user]);

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
    if (!newClientName.trim() || !user) {
      toast.error('יש להזין שם לקוח');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: newClient, error } = await supabase
        .from('client_profiles')
        .insert({
          business_name: newClientName.trim(),
          logo_url: newClientLogo || null,
          website_url: newClientWebsite.trim() || null,
          user_id: user.id,
          agency_owner_id: user.id,
          is_agency_profile: false,
          onboarding_completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      
      setClients(prev => [...prev, newClient]);
      setSelectedClientId(newClient.id);
      toast.success('הלקוח נוסף בהצלחה!');
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בהוספת לקוח');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewClientName('');
    setNewClientLogo(null);
    setNewClientWebsite('');
  };

  const handleContinue = () => {
    const selectedClient = clients.find(c => c.id === selectedClientId);
    if (selectedClient) {
      onNext(
        selectedClient.id, 
        selectedClient.business_name, 
        selectedClient.logo_url,
        selectedClient.website_url
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Users className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          בחר לקוח לתהליך ההיכרות
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          בחר לקוח קיים או הוסף לקוח חדש כדי להתחיל את תהליך ההיכרות
        </p>
      </div>

      {/* Clients Grid */}
      <div className="max-w-3xl mx-auto">
        {clients.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">עדיין אין לקוחות</h3>
              <p className="text-muted-foreground mb-4">הוסף את הלקוח הראשון שלך כדי להתחיל</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {clients.map((client) => {
              const needsOnboarding = !client.onboarding_completed;
              return (
                <Card 
                  key={client.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedClientId === client.id 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedClientId(client.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      {client.logo_url ? (
                        <img 
                          src={client.logo_url} 
                          alt={client.business_name}
                          className="h-14 w-14 object-contain rounded-xl border"
                        />
                      ) : (
                        <div 
                          className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                          style={{ backgroundColor: client.primary_color || '#E31E24' }}
                        >
                          {client.business_name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{client.business_name}</h3>
                        {client.website_url && (
                          <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {client.website_url.replace(/^https?:\/\//, '')}
                          </p>
                        )}
                        {needsOnboarding && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-1">
                            טרם עבר היכרות
                          </span>
                        )}
                        {!needsOnboarding && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                            <Check className="w-3 h-3" />
                            עבר היכרות
                          </span>
                        )}
                      </div>
                      {selectedClientId === client.id && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add New Client Button */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Card className="border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="py-6 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">הוסף לקוח חדש</span>
                </div>
              </CardContent>
            </Card>
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
                <Label>לוגו (אופציונלי)</Label>
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
                <Label>אתר אינטרנט (אופציונלי)</Label>
                <Input
                  value={newClientWebsite}
                  onChange={(e) => setNewClientWebsite(e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                />
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

      {/* Navigation */}
      <div className="flex justify-between max-w-3xl mx-auto pt-6">
        <Button variant="outline" size="lg" onClick={onPrev}>
          <ArrowRight className="w-4 h-4 ml-2" />
          חזרה
        </Button>
        <Button 
          variant="gradient" 
          size="xl" 
          onClick={handleContinue}
          disabled={!selectedClientId}
        >
          המשך עם הלקוח הנבחר
        </Button>
      </div>

      {!selectedClientId && clients.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          יש לבחור לקוח כדי להמשיך
        </p>
      )}
    </div>
  );
};

export default StepSelectClient;