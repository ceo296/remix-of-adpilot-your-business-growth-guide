import { WizardData, Integration } from '@/types/wizard';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageCircle, Mail, Database, FileSpreadsheet } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface StepIntegrationsProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const integrations: { id: Integration; title: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'whatsapp',
    title: 'ווטסאפ',
    description: 'קבל התראות ישירות לווטסאפ',
    icon: <MessageCircle className="w-5 h-5" />,
  },
  {
    id: 'email',
    title: 'אימייל',
    description: 'קבל לידים למייל שלך',
    icon: <Mail className="w-5 h-5" />,
  },
  {
    id: 'crm',
    title: 'מערכת CRM',
    description: 'שלח לידים ישירות למערכת שלך',
    icon: <Database className="w-5 h-5" />,
  },
  {
    id: 'sheets',
    title: 'Google Sheets',
    description: 'רכז את כל הלידים בטבלה',
    icon: <FileSpreadsheet className="w-5 h-5" />,
  },
];

const StepIntegrations = ({ data, updateData, onNext, onPrev }: StepIntegrationsProps) => {
  const toggleIntegration = (integration: Integration) => {
    const current = data.integrations;
    const updated = current.includes(integration)
      ? current.filter((i) => i !== integration)
      : [...current, integration];
    updateData({ integrations: updated });
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-foreground">לאן לשלוח את הלידים?</h1>
        <p className="text-lg text-muted-foreground">
          בחר איפה תרצה לקבל התראות על לקוחות חדשים
        </p>
      </div>

      <div className="space-y-3">
        {integrations.map((integration) => {
          const isEnabled = data.integrations.includes(integration.id);
          
          return (
            <div
              key={integration.id}
              className={`
                p-4 rounded-xl border transition-all duration-300
                ${isEnabled 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border bg-card'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <Switch
                  checked={isEnabled}
                  onCheckedChange={() => toggleIntegration(integration.id)}
                />
                <div className="flex items-center gap-3 flex-1 mr-4">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${isEnabled 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {integration.icon}
                  </div>
                  <div className="text-right">
                    <h3 className="font-medium text-foreground">{integration.title}</h3>
                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button 
          variant="gradient" 
          size="lg"
          onClick={onNext}
        >
          המשך
        </Button>
        <Button 
          variant="ghost" 
          size="lg"
          onClick={onPrev}
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          חזור
        </Button>
      </div>
    </div>
  );
};

export default StepIntegrations;
