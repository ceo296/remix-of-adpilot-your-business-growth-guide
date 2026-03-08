/**
 * Visual mini-previews for InternalStudio template cards.
 * Each template style gets a distinct, recognizable preview.
 */

interface TemplatePreviewProps {
  templateId: string;
  primaryColor?: string;
  businessName?: string;
}

export const TemplatePreview = ({ templateId, primaryColor = '#E34870', businessName = 'שם העסק' }: TemplatePreviewProps) => {
  const color = primaryColor;

  const previews: Record<string, React.ReactNode> = {
    // Business Cards
    'bc-classic': (
      <div className="w-full h-full bg-white rounded flex flex-col justify-between p-3 text-right" dir="rtl">
        <div>
          <div className="w-6 h-6 rounded" style={{ backgroundColor: color }} />
          <div className="mt-2 text-[8px] font-bold text-gray-800">{businessName}</div>
          <div className="text-[6px] text-gray-400 mt-0.5">מנהל/ת</div>
        </div>
        <div className="space-y-0.5">
          <div className="h-[3px] rounded-full bg-gray-200 w-3/4" />
          <div className="h-[3px] rounded-full bg-gray-200 w-1/2" />
          <div className="h-[3px] rounded-full bg-gray-200 w-2/3" />
        </div>
      </div>
    ),
    'bc-modern': (
      <div className="w-full h-full rounded overflow-hidden flex" dir="rtl">
        <div className="w-1/3 h-full" style={{ backgroundColor: color }} />
        <div className="w-2/3 bg-white flex flex-col justify-center p-3">
          <div className="text-[8px] font-black text-gray-800">{businessName}</div>
          <div className="text-[5px] text-gray-400 mt-0.5 tracking-wider">CREATIVE AGENCY</div>
          <div className="mt-2 space-y-0.5">
            <div className="h-[2px] rounded-full w-full" style={{ backgroundColor: color, opacity: 0.3 }} />
            <div className="h-[2px] rounded-full bg-gray-200 w-3/4" />
          </div>
        </div>
      </div>
    ),
    'bc-minimal': (
      <div className="w-full h-full bg-white rounded flex flex-col items-center justify-center p-3">
        <div className="text-[9px] font-bold text-gray-800 tracking-wide">{businessName}</div>
        <div className="w-8 h-[1px] my-1.5" style={{ backgroundColor: color }} />
        <div className="text-[5px] text-gray-400">054-000-0000</div>
        <div className="text-[5px] text-gray-400">info@example.com</div>
      </div>
    ),
    'bc-premium': (
      <div className="w-full h-full rounded overflow-hidden relative" style={{ backgroundColor: '#1a1a2e' }}>
        <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, ${color} 0%, transparent 60%)` }} />
        <div className="relative h-full flex flex-col justify-between p-3 text-right" dir="rtl">
          <div className="w-5 h-5 rounded-sm border" style={{ borderColor: color, opacity: 0.6 }} />
          <div>
            <div className="text-[8px] font-bold text-white">{businessName}</div>
            <div className="text-[5px] mt-0.5" style={{ color }}}>מותג יוקרתי</div>
          </div>
        </div>
      </div>
    ),

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
      <div className="w-full h-full rounded overflow-hidden flex flex-col items-center justify-center p-2" style={{ background: `linear-gradient(135deg, #fdf6e3, #f5e6d0)` }}>
        <div className="text-[5px] text-amber-700 tracking-widest">בשעה טובה</div>
        <div className="text-[8px] font-bold text-amber-900 mt-1">שם החתן ושם הכלה</div>
        <div className="w-6 h-[1px] bg-amber-400 my-1" />
        <div className="text-[5px] text-amber-700">יום ראשון • כ״ה אדר</div>
      </div>
    ),
    'inv-bar': (
      <div className="w-full h-full rounded overflow-hidden flex flex-col items-center justify-center p-2" style={{ background: `linear-gradient(135deg, #e8f0fe, #d0e0ff)` }}>
        <div className="text-[5px] text-blue-600">בס״ד</div>
        <div className="text-[7px] font-bold text-blue-900 mt-1">שמחת הבר מצוה</div>
        <div className="w-5 h-[1px] bg-blue-300 my-1" />
        <div className="text-[5px] text-blue-600">לבננו היקר</div>
      </div>
    ),
    'inv-brit': (
      <div className="w-full h-full rounded overflow-hidden flex flex-col items-center justify-center p-2" style={{ background: `linear-gradient(135deg, #f0fdf4, #dcfce7)` }}>
        <div className="text-[5px] text-emerald-600">בשמחה רבה</div>
        <div className="text-[7px] font-bold text-emerald-900 mt-1">ברית מילה</div>
        <div className="w-5 h-[1px] bg-emerald-300 my-1" />
        <div className="text-[5px] text-emerald-600">לבננו בכורנו</div>
      </div>
    ),
    'inv-event': (
      <div className="w-full h-full rounded overflow-hidden flex flex-col items-center justify-center p-2" style={{ background: `linear-gradient(135deg, #faf5ff, #ede9fe)` }}>
        <div className="text-[5px] text-violet-600">הנכם מוזמנים</div>
        <div className="text-[7px] font-bold text-violet-900 mt-1">אירוע מיוחד</div>
        <div className="w-5 h-[1px] bg-violet-300 my-1" />
        <div className="text-[5px] text-violet-600">{businessName}</div>
      </div>
    ),

    // Letterhead
    'lh-classic': (
      <div className="w-full h-full bg-white rounded flex flex-col p-2" dir="rtl">
        <div className="flex items-center justify-between border-b pb-1 mb-2" style={{ borderColor: `${color}40` }}>
          <div className="w-5 h-5 rounded" style={{ backgroundColor: color }} />
          <div className="text-[6px] font-bold text-gray-800">{businessName}</div>
        </div>
        <div className="flex-1 space-y-1">
          <div className="h-[2px] bg-gray-100 rounded w-full" />
          <div className="h-[2px] bg-gray-100 rounded w-full" />
          <div className="h-[2px] bg-gray-100 rounded w-3/4" />
        </div>
      </div>
    ),
    'lh-modern': (
      <div className="w-full h-full bg-white rounded flex flex-col overflow-hidden" dir="rtl">
        <div className="h-2 w-full" style={{ backgroundColor: color }} />
        <div className="p-2 flex-1">
          <div className="text-[7px] font-bold text-gray-800">{businessName}</div>
          <div className="mt-2 space-y-1">
            <div className="h-[2px] bg-gray-100 rounded w-full" />
            <div className="h-[2px] bg-gray-100 rounded w-full" />
          </div>
        </div>
        <div className="h-1 w-full" style={{ backgroundColor: color, opacity: 0.3 }} />
      </div>
    ),
    'lh-minimal': (
      <div className="w-full h-full bg-white rounded flex flex-col p-2" dir="rtl">
        <div className="text-[7px] font-bold text-gray-800">{businessName}</div>
        <div className="text-[4px] text-gray-400 mb-3">054-000-0000 | info@example.com</div>
        <div className="flex-1 space-y-1">
          <div className="h-[2px] bg-gray-50 rounded w-full" />
          <div className="h-[2px] bg-gray-50 rounded w-full" />
          <div className="h-[2px] bg-gray-50 rounded w-4/5" />
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
