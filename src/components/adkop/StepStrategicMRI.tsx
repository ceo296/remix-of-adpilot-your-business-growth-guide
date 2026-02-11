import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  StrategicMRIData,
  TARGET_EMOTIONS,
  AUDIENCE_SEGMENTS,
  CONSERVATISM_LABELS,
  TargetEmotion,
  AudienceSegment,
} from '@/types/adkop';

interface Props {
  data: StrategicMRIData;
  onChange: (data: StrategicMRIData) => void;
}

const StepStrategicMRI = ({ data, onChange }: Props) => {
  const currentLabel = CONSERVATISM_LABELS[data.conservatismLevel] || '';

  const toggleAudience = (segment: AudienceSegment) => {
    const next = data.targetAudience.includes(segment)
      ? data.targetAudience.filter((s) => s !== segment)
      : [...data.targetAudience, segment];
    onChange({ ...data, targetAudience: next });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-rubik font-bold text-foreground">MRI אסטרטגי</h2>
        <p className="text-muted-foreground mt-2">בואו נבין את הלב של המוצר שלכם</p>
      </div>

      {/* Product Function */}
      <div className="space-y-2">
        <Label htmlFor="productFunction" className="text-base font-semibold">
          מה המוצר/שירות עושה?
        </Label>
        <Textarea
          id="productFunction"
          placeholder="תארו בקצרה את הפונקציה העיקרית של המוצר..."
          className="text-lg min-h-[100px] resize-none"
          value={data.productFunction}
          onChange={(e) => onChange({ ...data, productFunction: e.target.value })}
        />
      </div>

      {/* Pain / Problem */}
      <div className="space-y-2">
        <Label htmlFor="painProblem" className="text-base font-semibold">
          איזה כאב/בעיה זה פותר?
        </Label>
        <Textarea
          id="painProblem"
          placeholder="מה הבעיה שהלקוח חווה לפני שהוא פוגש את המוצר שלכם?"
          className="text-lg min-h-[100px] resize-none"
          value={data.painProblem}
          onChange={(e) => onChange({ ...data, painProblem: e.target.value })}
        />
      </div>

      {/* Target Emotion */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">רגש מטרה</Label>
        <Select
          value={data.targetEmotion || ''}
          onValueChange={(v) => onChange({ ...data, targetEmotion: v as TargetEmotion })}
        >
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder="בחרו את הרגש שהקמפיין צריך לעורר" />
          </SelectTrigger>
          <SelectContent>
            {TARGET_EMOTIONS.map((e) => (
              <SelectItem key={e.value} value={e.value} className="text-base">
                <span className="flex items-center gap-2">
                  <span>{e.icon}</span>
                  <span>{e.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Target Audience */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">קהל יעד</Label>
        <div className="grid grid-cols-2 gap-3">
          {AUDIENCE_SEGMENTS.map((seg) => (
            <label
              key={seg.value}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                data.targetAudience.includes(seg.value)
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <Checkbox
                checked={data.targetAudience.includes(seg.value)}
                onCheckedChange={() => toggleAudience(seg.value)}
              />
              <span className="font-medium">{seg.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Conservatism Slider */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">מד שמרנות</Label>
        <div className="bg-card border border-border rounded-xl p-6">
          <Slider
            value={[data.conservatismLevel]}
            onValueChange={([v]) => onChange({ ...data, conservatismLevel: v })}
            min={1}
            max={10}
            step={1}
            className="mb-4"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">דתי/מודרני כללי</span>
            <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {data.conservatismLevel} — {currentLabel}
            </span>
            <span className="text-xs text-muted-foreground">חסידי קיצוני</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepStrategicMRI;
