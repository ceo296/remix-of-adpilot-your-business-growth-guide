import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CampaignConfigData,
  CAMPAIGN_STRUCTURES,
  TIMING_OPTIONS,
  MEDIA_CHANNELS,
  CampaignStructureType,
  MediaChannel,
} from '@/types/adkop';

interface Props {
  data: CampaignConfigData;
  onChange: (data: CampaignConfigData) => void;
}

const StepCampaignConfig = ({ data, onChange }: Props) => {
  const toggleChannel = (channel: MediaChannel) => {
    const next = data.mediaChannels.includes(channel)
      ? data.mediaChannels.filter((c) => c !== channel)
      : [...data.mediaChannels, channel];
    onChange({ ...data, mediaChannels: next });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-rubik font-bold text-foreground">הגדרת קמפיין</h2>
        <p className="text-muted-foreground mt-2">איך הקמפיין ייראה ואיפה הוא ירוץ</p>
      </div>

      {/* Campaign Structure */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">מבנה קמפיין</Label>
        <RadioGroup
          value={data.campaignStructure || ''}
          onValueChange={(v) => onChange({ ...data, campaignStructure: v as CampaignStructureType })}
          className="space-y-3"
        >
          {CAMPAIGN_STRUCTURES.map((s) => (
            <label
              key={s.value}
              className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                data.campaignStructure === s.value
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <RadioGroupItem value={s.value} className="mt-1" />
              <div>
                <span className="font-semibold text-foreground">{s.label}</span>
                <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Timing */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">תזמון</Label>
        <Select value={data.timing} onValueChange={(v) => onChange({ ...data, timing: v })}>
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder="בחרו עונה / חג" />
          </SelectTrigger>
          <SelectContent>
            {TIMING_OPTIONS.map((t) => (
              <SelectItem key={t} value={t} className="text-base">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Media Channels */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">ערוצי מדיה</Label>
        <div className="grid grid-cols-2 gap-3">
          {MEDIA_CHANNELS.map((ch) => (
            <label
              key={ch.value}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                data.mediaChannels.includes(ch.value)
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <Checkbox
                checked={data.mediaChannels.includes(ch.value)}
                onCheckedChange={() => toggleChannel(ch.value)}
              />
              <span className="text-xl">{ch.icon}</span>
              <span className="font-medium">{ch.label}</span>
            </label>
          ))}
        </div>
      </div>
      {/* Decision Maker */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">מי מקבל ההחלטות?</Label>
        <p className="text-sm text-muted-foreground">למי אנחנו פונים במודעה — מי מחליט על הרכישה?</p>
        <Input
          value={data.decisionMaker}
          onChange={(e) => onChange({ ...data, decisionMaker: e.target.value })}
          placeholder="למשל: האמא, הגבר, מנהל הרכש..."
          className="h-12 text-base"
        />
      </div>
    </div>
  );
};

export default StepCampaignConfig;
