import { useAdminClients } from '@/hooks/useAdminClients';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RotateCcw, Shield, UserPlus } from 'lucide-react';
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

const AdminClientSelector = () => {
  const navigate = useNavigate();
  const { 
    isAdmin, 
    clients, 
    selectedClient, 
    selectedClientId, 
    setSelectedClientId, 
    loading,
    resetClient 
  } = useAdminClients();

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
    // Store selected client in sessionStorage for impersonation
    sessionStorage.setItem('admin_impersonate_client', selectedClientId);
    toast.success(`עובד כעת בתור: ${selectedClient?.business_name}`);
    navigate('/dashboard');
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
