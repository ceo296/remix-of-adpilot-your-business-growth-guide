import { useState } from 'react';
import { useAdminClients } from '@/hooks/useAdminClients';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RotateCcw, Shield, UserPlus, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const AdminClientSelector = () => {
  const navigate = useNavigate();
  const { 
    isAdmin, 
    clients, 
    selectedClient, 
    selectedClientId, 
    setSelectedClientId, 
    loading,
    resetClient,
    createClient 
  } = useAdminClients();

  const [newClientName, setNewClientName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Only show for admins
  if (!isAdmin || loading) return null;

  const handleReset = async () => {
    if (!selectedClientId) return;
    try {
      await resetClient(selectedClientId);
      toast.success('הפרופיל אופס בהצלחה');
    } catch (err) {
      toast.error('שגיאה באיפוס הפרופיל');
    }
  };

  const handleImpersonate = () => {
    if (!selectedClientId) return;
    sessionStorage.setItem('admin_impersonate_client', selectedClientId);
    toast.success(`עובד כעת בתור: ${selectedClient?.business_name}`);
    navigate('/dashboard');
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      toast.error('יש להזין שם לקוח');
      return;
    }
    
    setIsCreating(true);
    try {
      const newClient = await createClient(newClientName.trim());
      setSelectedClientId(newClient.id);
      toast.success(`לקוח "${newClientName}" נוצר בהצלחה`);
      setNewClientName('');
      setDialogOpen(false);
    } catch (err) {
      toast.error('שגיאה ביצירת לקוח');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-destructive/10 px-3 py-1 rounded-lg border border-destructive/30">
      <Shield className="w-4 h-4 text-destructive" />
      <Select 
        value={selectedClientId || ''} 
        onValueChange={(value) => setSelectedClientId(value)}
      >
        <SelectTrigger className="w-[180px] bg-background border-border h-8 text-sm">
          <SelectValue placeholder="בחר לקוח" />
        </SelectTrigger>
        <SelectContent>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded flex items-center justify-center text-[8px] text-white font-bold"
                  style={{ backgroundColor: client.primary_color || '#E31E24' }}
                >
                  {client.business_name.charAt(0)}
                </div>
                <span className="text-sm">{client.business_name}</span>
                {client.onboarding_completed ? (
                  <span className="text-[10px] text-green-600">✓</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">(לא הושלם)</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Create new client */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-green-600 hover:text-green-700"
            title="צור לקוח חדש"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>יצירת לקוח חדש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">שם העסק</Label>
              <Input
                id="client-name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="הזן שם עסק..."
                onKeyDown={(e) => e.key === 'Enter' && handleCreateClient()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleCreateClient} disabled={isCreating}>
              {isCreating ? 'יוצר...' : 'צור לקוח'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive hover:text-destructive"
            title="אפס פרופיל לקוח"
            disabled={!selectedClientId}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>אפס פרופיל לקוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תאפס את כל נתוני האסטרטגיה של {selectedClient?.business_name} ותחזיר אותו למצב אונבורדינג.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive hover:bg-destructive/90">
              אפס
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        title="עבוד בתור לקוח זה"
        onClick={handleImpersonate}
        disabled={!selectedClientId}
      >
        <UserPlus className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default AdminClientSelector;
