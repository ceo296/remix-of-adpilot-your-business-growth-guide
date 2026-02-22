import { useAgencyClients } from '@/hooks/useAgencyClients';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Building2, Plus, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClientSelector = () => {
  const navigate = useNavigate();
  const { isAgency, clients, selectedClient, selectedClientId, setSelectedClientId, loading } = useAgencyClients();

  // Only show for agencies
  if (!isAgency || loading) return null;

  return (
    <div className="flex items-center gap-2">
      <Select 
        value={selectedClientId || ''} 
        onValueChange={(value) => setSelectedClientId(value)}
      >
        <SelectTrigger className="w-[200px] bg-card border-border">
          <div className="flex items-center gap-2">
            {selectedClient?.logo_url ? (
              <img 
                src={selectedClient.logo_url} 
                alt="" 
                className="w-5 h-5 rounded object-contain"
              />
            ) : (
              <div 
                className="w-5 h-5 rounded flex items-center justify-center text-[10px] text-white font-bold"
                style={{ backgroundColor: selectedClient?.primary_color || '#6366f1' }}
              >
                {selectedClient?.business_name?.charAt(0) || '?'}
              </div>
            )}
            <SelectValue placeholder="בחר לקוח" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              <div className="flex items-center gap-2">
                {client.logo_url ? (
                  <img 
                    src={client.logo_url} 
                    alt="" 
                    className="w-5 h-5 rounded object-contain"
                  />
                ) : (
                  <div 
                    className="w-5 h-5 rounded flex items-center justify-center text-[10px] text-white font-bold"
                    style={{ backgroundColor: client.primary_color || '#6366f1' }}
                  >
                    {client.business_name.charAt(0)}
                  </div>
                )}
                <span>{client.business_name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => navigate('/clients')}
        title="נהל לקוחות"
      >
        <Building2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ClientSelector;
