/**
 * Visual mini-previews for InternalStudio template cards.
 * Each template style gets a distinct, recognizable preview.
 */

interface TemplatePreviewProps {
  templateId: string;
  primaryColor?: string;
  secondaryColor?: string;
  businessName?: string;
  doubleSided?: boolean;
}

/** Realistic business card front/back previews */
const BusinessCardFront = ({ color, secondaryColor, businessName, style }: { color: string; secondaryColor: string; businessName: string; style: string }) => {
  const darkBg = secondaryColor || '#1a1a2e';
  
  const styles: Record<string, React.ReactNode> = {
    'classic': (
      <div className="w-full h-full bg-white rounded-sm flex flex-col justify-between p-[10%]" dir="rtl">
        <div className="flex items-start justify-between">
          <div className="w-[22%] aspect-square rounded-sm" style={{ backgroundColor: color }} />
          <div className="text-right">
            <div className="text-[7px] font-black text-gray-800 leading-tight">{businessName}</div>
            <div className="text-[5px] text-gray-400 mt-0.5">מנכ״ל</div>
          </div>
        </div>
        <div className="space-y-[3px]">
          <div className="flex items-center gap-1 justify-end">
            <div className="text-[4.5px] text-gray-500">054-000-0000</div>
            <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: color, opacity: 0.5 }} />
          </div>
          <div className="flex items-center gap-1 justify-end">
            <div className="text-[4.5px] text-gray-500">info@example.com</div>
            <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: color, opacity: 0.5 }} />
          </div>
          <div className="flex items-center gap-1 justify-end">
            <div className="text-[4.5px] text-gray-500">בני ברק</div>
            <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: color, opacity: 0.5 }} />
          </div>
        </div>
      </div>
    ),
    'modern': (
      <div className="w-full h-full rounded-sm overflow-hidden flex" dir="rtl">
        <div className="w-[35%] h-full flex flex-col items-center justify-center" style={{ backgroundColor: color }}>
          <div className="w-[50%] aspect-square rounded-sm bg-white/20" />
        </div>
        <div className="w-[65%] bg-white flex flex-col justify-between p-[8%]">
          <div>
            <div className="text-[8px] font-black text-gray-800 leading-tight">{businessName}</div>
            <div className="text-[4.5px] text-gray-400 mt-0.5 tracking-[0.15em] uppercase">Creative Studio</div>
          </div>
          <div className="space-y-[2px]">
            <div className="h-[2px] rounded-full w-[70%]" style={{ backgroundColor: color, opacity: 0.2 }} />
            <div className="text-[4px] text-gray-400">054-000-0000</div>
            <div className="text-[4px] text-gray-400">info@example.com</div>
          </div>
        </div>
      </div>
    ),
    'minimal': (
      <div className="w-full h-full bg-white rounded-sm flex flex-col items-center justify-center p-[10%]">
        <div className="text-[9px] font-bold text-gray-800 tracking-wide text-center">{businessName}</div>
        <div className="w-[30%] h-[1.5px] my-[6%]" style={{ backgroundColor: color }} />
        <div className="text-[4.5px] text-gray-400 text-center">054-000-0000</div>
        <div className="text-[4.5px] text-gray-400 text-center mt-[2px]">info@example.com</div>
      </div>
    ),
    'premium': (
      <div className="w-full h-full rounded-sm overflow-hidden relative" style={{ backgroundColor: darkBg }}>
        <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, ${color} 0%, transparent 60%)` }} />
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
        <div className="relative h-full flex flex-col justify-between p-[10%]" dir="rtl">
          <div className="flex items-start justify-between">
            <div className="w-[18%] aspect-square rounded-sm border" style={{ borderColor: `${color}60` }} />
            <div className="text-right">
              <div className="text-[8px] font-bold text-white leading-tight">{businessName}</div>
              <div className="text-[4.5px] mt-0.5" style={{ color }}>מותג יוקרתי</div>
            </div>
          </div>
          <div className="space-y-[2px]">
            <div className="text-[4px] text-white/50">054-000-0000</div>
            <div className="text-[4px] text-white/50">info@example.com</div>
          </div>
        </div>
      </div>
    ),
    'bold': (
      <div className="w-full h-full rounded-sm overflow-hidden" style={{ backgroundColor: color }}>
        <div className="h-full flex flex-col justify-between p-[10%]" dir="rtl">
          <div>
            <div className="text-[9px] font-black text-white leading-tight">{businessName}</div>
            <div className="text-[5px] text-white/60 mt-0.5">עיצוב ומיתוג</div>
          </div>
          <div className="flex items-end justify-between">
            <div className="space-y-[2px]">
              <div className="text-[4px] text-white/70">054-000-0000</div>
              <div className="text-[4px] text-white/70">info@example.com</div>
            </div>
            <div className="w-[20%] aspect-square rounded-sm bg-white/20" />
          </div>
        </div>
      </div>
    ),
    'elegant': (
      <div className="w-full h-full bg-white rounded-sm overflow-hidden" dir="rtl">
        <div className="h-[3px] w-full" style={{ backgroundColor: color }} />
        <div className="p-[10%] h-full flex flex-col justify-between">
          <div className="text-center">
            <div className="w-[20%] aspect-square mx-auto rounded-full border-2 mb-[6%]" style={{ borderColor: color }} />
            <div className="text-[8px] font-bold text-gray-800">{businessName}</div>
            <div className="text-[4.5px] text-gray-400 mt-[2px]">שירות מקצועי</div>
          </div>
          <div className="flex justify-center gap-3">
            <div className="text-[4px] text-gray-400">054-000-0000</div>
            <div className="text-[4px]" style={{ color }}>|</div>
            <div className="text-[4px] text-gray-400">info@example.com</div>
          </div>
        </div>
      </div>
    ),
  };
  return styles[style] || styles['classic'];
};

const BusinessCardBack = ({ color, secondaryColor, businessName, style }: { color: string; secondaryColor: string; businessName: string; style: string }) => {
  const darkBg = secondaryColor || '#1a1a2e';
  
  const styles: Record<string, React.ReactNode> = {
    'classic': (
      <div className="w-full h-full rounded-sm flex items-center justify-center" style={{ backgroundColor: color }}>
        <div className="w-[35%] aspect-square rounded-md bg-white/20 flex items-center justify-center">
          <div className="text-[10px] font-black text-white">{businessName.charAt(0)}</div>
        </div>
      </div>
    ),
    'modern': (
      <div className="w-full h-full rounded-sm overflow-hidden" style={{ backgroundColor: color }}>
        <div className="h-full flex items-center justify-center relative">
          <div className="absolute inset-0 opacity-10" style={{ background: 'repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 8px)' }} />
          <div className="text-[14px] font-black text-white/90 tracking-tight">{businessName}</div>
        </div>
      </div>
    ),
    'minimal': (
      <div className="w-full h-full bg-gray-50 rounded-sm flex items-center justify-center">
        <div className="w-[30%] aspect-square rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <div className="text-[12px] font-bold" style={{ color }}>{businessName.charAt(0)}</div>
        </div>
      </div>
    ),
    'premium': (
      <div className="w-full h-full rounded-sm overflow-hidden relative" style={{ backgroundColor: darkBg }}>
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${color}30 0%, transparent 70%)` }} />
        <div className="h-full flex items-center justify-center relative">
          <div className="text-center">
            <div className="text-[12px] font-bold text-white">{businessName.charAt(0)}</div>
            <div className="w-[40%] mx-auto h-[1px] mt-1" style={{ backgroundColor: color }} />
          </div>
        </div>
      </div>
    ),
    'bold': (
      <div className="w-full h-full bg-white rounded-sm flex items-center justify-center">
        <div className="text-[16px] font-black" style={{ color }}>{businessName.charAt(0)}</div>
      </div>
    ),
    'elegant': (
      <div className="w-full h-full rounded-sm overflow-hidden" style={{ backgroundColor: color }}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-[25%] aspect-square mx-auto rounded-full bg-white/20 flex items-center justify-center mb-1">
              <div className="text-[10px] font-bold text-white">{businessName.charAt(0)}</div>
            </div>
            <div className="text-[6px] text-white/70 tracking-widest uppercase">{businessName}</div>
          </div>
        </div>
      </div>
    ),
  };
  return styles[style] || styles['classic'];
};

/** Business card wrapper — shows front + optional back */
const BusinessCardPreview = ({ style, color, secondaryColor, businessName, doubleSided }: { 
  style: string; color: string; secondaryColor: string; businessName: string; doubleSided: boolean; 
}) => {
  if (doubleSided) {
    return (
      <div className="w-full h-full flex flex-col gap-[6%] p-[4%]">
        <div className="flex-1 rounded shadow-md overflow-hidden" style={{ aspectRatio: '9/5' }}>
          <BusinessCardFront color={color} secondaryColor={secondaryColor} businessName={businessName} style={style} />
        </div>
        <div className="flex-1 rounded shadow-md overflow-hidden" style={{ aspectRatio: '9/5' }}>
          <BusinessCardBack color={color} secondaryColor={secondaryColor} businessName={businessName} style={style} />
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center p-[6%]">
      <div className="w-full rounded shadow-lg overflow-hidden" style={{ aspectRatio: '9/5' }}>
        <BusinessCardFront color={color} secondaryColor={secondaryColor} businessName={businessName} style={style} />
      </div>
    </div>
  );
};

export const TemplatePreview = ({ templateId, primaryColor = '#E34870', secondaryColor, businessName = 'שם העסק' }: TemplatePreviewProps) => {
  const color = primaryColor;
  const secColor = secondaryColor || '#2A2F33';

  // Business card mapping
  const bcMap: Record<string, { style: string; doubleSided: boolean }> = {
    'bc-classic': { style: 'classic', doubleSided: true },
    'bc-modern': { style: 'modern', doubleSided: true },
    'bc-minimal': { style: 'minimal', doubleSided: false },
    'bc-premium': { style: 'premium', doubleSided: true },
    'bc-bold': { style: 'bold', doubleSided: true },
    'bc-elegant': { style: 'elegant', doubleSided: false },
  };

  if (bcMap[templateId]) {
    const { style, doubleSided } = bcMap[templateId];
    return (
      <div className="w-full h-full bg-muted/30">
        <BusinessCardPreview style={style} color={color} secondaryColor={secColor} businessName={businessName} doubleSided={doubleSided} />
      </div>
    );
  }

  const previews: Record<string, React.ReactNode> = {
    // Flyers
    'flyer-a5': (
      <div className="w-full h-full bg-white rounded flex flex-col overflow-hidden" dir="rtl">
        <div className="h-2/5 w-full" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
          <div className="p-2">
            <div className="text-[7px] font-black text-white">{businessName}</div>
          </div>
        </div>
        <div className="flex-1 p-2 space-y-1">
          <div className="h-[3px] bg-gray-200 rounded w-full" />
          <div className="h-[3px] bg-gray-200 rounded w-4/5" />
          <div className="h-[3px] bg-gray-200 rounded w-3/5" />
          <div className="mt-1 h-4 rounded text-[5px] text-white flex items-center justify-center" style={{ backgroundColor: color }}>
            להזמנות
          </div>
        </div>
      </div>
    ),
    'flyer-a4': (
      <div className="w-full h-full bg-white rounded flex flex-col overflow-hidden" dir="rtl">
        <div className="h-1/3 w-full bg-gray-100 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: color, opacity: 0.2 }} />
        </div>
        <div className="flex-1 p-2 space-y-1">
          <div className="text-[7px] font-bold text-gray-800">{businessName}</div>
          <div className="h-[2px] bg-gray-200 rounded w-full" />
          <div className="h-[2px] bg-gray-200 rounded w-4/5" />
          <div className="grid grid-cols-2 gap-1 mt-1">
            <div className="h-3 bg-gray-100 rounded" />
            <div className="h-3 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    ),
    'flyer-dl': (
      <div className="w-full h-full bg-white rounded flex flex-col overflow-hidden" dir="rtl">
        <div className="h-1/4" style={{ backgroundColor: color }}>
          <div className="p-1.5 text-[6px] font-bold text-white">{businessName}</div>
        </div>
        <div className="flex-1 p-1.5 space-y-1">
          <div className="h-[2px] bg-gray-200 rounded w-full" />
          <div className="h-[2px] bg-gray-200 rounded w-3/4" />
          <div className="h-[2px] bg-gray-200 rounded w-1/2" />
        </div>
        <div className="h-3 flex items-center justify-center text-[4px] text-white" style={{ backgroundColor: color }}>
          054-000-0000
        </div>
      </div>
    ),
    'flyer-square': (
      <div className="w-full h-full bg-white rounded overflow-hidden relative" dir="rtl">
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${color}15, transparent)` }} />
        <div className="relative p-2 h-full flex flex-col justify-between">
          <div className="text-[7px] font-bold text-gray-800">{businessName}</div>
          <div className="w-10 h-10 mx-auto rounded-lg bg-gray-100" />
          <div className="text-center">
            <div className="text-[5px] text-gray-500">להזמנות: 054-000-0000</div>
          </div>
        </div>
      </div>
    ),

    // Invitations
    'inv-wedding': (
      <div className="w-full h-full rounded overflow-hidden flex flex-col items-center justify-center p-2" style={{ background: 'linear-gradient(135deg, #fdf6e3, #f5e6d0)' }}>
        <div className="text-[5px] text-amber-700 tracking-widest">בשעה טובה</div>
        <div className="text-[8px] font-bold text-amber-900 mt-1">שם החתן ושם הכלה</div>
        <div className="w-6 h-[1px] bg-amber-400 my-1" />
        <div className="text-[5px] text-amber-700">יום ראשון • כ״ה אדר</div>
      </div>
    ),
    'inv-bar': (
      <div className="w-full h-full rounded overflow-hidden flex flex-col items-center justify-center p-2" style={{ background: 'linear-gradient(135deg, #e8f0fe, #d0e0ff)' }}>
        <div className="text-[5px] text-blue-600">בס״ד</div>
        <div className="text-[7px] font-bold text-blue-900 mt-1">שמחת הבר מצוה</div>
        <div className="w-5 h-[1px] bg-blue-300 my-1" />
        <div className="text-[5px] text-blue-600">לבננו היקר</div>
      </div>
    ),
    'inv-brit': (
      <div className="w-full h-full rounded overflow-hidden flex flex-col items-center justify-center p-2" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
        <div className="text-[5px] text-emerald-600">בשמחה רבה</div>
        <div className="text-[7px] font-bold text-emerald-900 mt-1">ברית מילה</div>
        <div className="w-5 h-[1px] bg-emerald-300 my-1" />
        <div className="text-[5px] text-emerald-600">לבננו בכורנו</div>
      </div>
    ),
    'inv-event': (
      <div className="w-full h-full rounded overflow-hidden flex flex-col items-center justify-center p-2" style={{ background: 'linear-gradient(135deg, #faf5ff, #ede9fe)' }}>
        <div className="text-[5px] text-violet-600">הנכם מוזמנים</div>
        <div className="text-[7px] font-bold text-violet-900 mt-1">אירוע מיוחד</div>
        <div className="w-5 h-[1px] bg-violet-300 my-1" />
        <div className="text-[5px] text-violet-600">{businessName}</div>
      </div>
    ),

    // Letterhead — realistic minimalist with bottom contact grid
    'lh-classic': (
      <div className="w-full h-full bg-white rounded flex flex-col overflow-hidden" dir="rtl">
        {/* Header — logo + business name */}
        <div className="flex items-center gap-1.5 p-2 pb-1">
          <div className="w-5 h-5 rounded-sm" style={{ backgroundColor: color }} />
          <div>
            <div className="text-[7px] font-bold text-gray-800">{businessName}</div>
            <div className="text-[4px] text-gray-300">בס״ד</div>
          </div>
        </div>
        <div className="w-[85%] mx-auto h-[0.5px]" style={{ backgroundColor: `${color}30` }} />
        {/* Body lines */}
        <div className="flex-1 p-3 space-y-[5px]">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[1.5px] bg-gray-50 rounded w-full" />
          ))}
        </div>
        {/* Bottom contact grid */}
        <div className="border-t px-2 py-1.5 flex items-center justify-between" style={{ borderColor: `${color}20` }}>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color, opacity: 0.15 }} />
            <div className="text-[3.5px] text-gray-400">{businessName}</div>
          </div>
          <div className="flex gap-2">
            <div className="text-[3px] text-gray-300">054-000-0000</div>
            <div className="text-[3px] text-gray-300">info@example.com</div>
            <div className="text-[3px] text-gray-300">בני ברק</div>
          </div>
        </div>
      </div>
    ),
    'lh-modern': (
      <div className="w-full h-full bg-white rounded flex flex-col overflow-hidden" dir="rtl">
        {/* Top accent line */}
        <div className="h-[3px] w-full" style={{ backgroundColor: color }} />
        {/* Header */}
        <div className="px-2 pt-2 flex items-start justify-between">
          <div>
            <div className="text-[7px] font-black text-gray-800">{businessName}</div>
            <div className="text-[4px] text-gray-400 tracking-wider">PROFESSIONAL SERVICES</div>
          </div>
          <div className="w-5 h-5 rounded-sm border" style={{ borderColor: color }} />
        </div>
        {/* Body */}
        <div className="flex-1 px-3 pt-3 space-y-[5px]">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-[1.5px] bg-gray-50 rounded w-full" />
          ))}
        </div>
        {/* Bottom bar */}
        <div className="px-2 py-1.5" style={{ backgroundColor: `${color}08` }}>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <div className="text-[3px] text-gray-400">📞 054-000-0000</div>
              <div className="text-[3px] text-gray-400">✉ info@example.com</div>
            </div>
            <div className="text-[3px] text-gray-400">📍 בני ברק</div>
          </div>
        </div>
        <div className="h-[1.5px] w-full" style={{ backgroundColor: color, opacity: 0.3 }} />
      </div>
    ),
    'lh-minimal': (
      <div className="w-full h-full bg-white rounded flex flex-col overflow-hidden" dir="rtl">
        {/* Clean header — just name */}
        <div className="px-2 pt-3 text-center">
          <div className="text-[8px] font-bold text-gray-800">{businessName}</div>
          <div className="w-4 h-[0.5px] mx-auto mt-1" style={{ backgroundColor: color }} />
        </div>
        {/* Body */}
        <div className="flex-1 px-3 pt-3 space-y-[5px]">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[1.5px] bg-gray-50 rounded w-full" />
          ))}
        </div>
        {/* Minimal bottom */}
        <div className="text-center py-1.5 border-t" style={{ borderColor: `${color}15` }}>
          <div className="text-[3px] text-gray-300">054-000-0000 | info@example.com | בני ברק</div>
        </div>
      </div>
    ),
  };

  return previews[templateId] || (
    <div className="w-full h-full bg-muted rounded flex items-center justify-center">
      <div className="text-[8px] text-muted-foreground">תצוגה מקדימה</div>
    </div>
  );
};
