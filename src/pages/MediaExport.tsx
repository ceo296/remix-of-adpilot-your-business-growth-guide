import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

interface MediaRow {
  cat: string;
  outlet: string;
  stream: string;
  sector: string;
  city: string;
  vibe: string;
  reach: string;
  warning: string;
  product: string;
  ptype: string;
  gender: string;
  audience: string;
  mp_base: number;
  mp_client: number;
  tag: string;
  spec: string;
  dims: string;
  ps_base: number;
  ps_client: number;
}

const MediaExport = () => {
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch all 4 tables
      const [cats, outlets, products, specs] = await Promise.all([
        supabase.from('media_categories').select('*').order('sort_order'),
        supabase.from('media_outlets').select('*').eq('is_active', true),
        supabase.from('media_products').select('*').eq('is_active', true),
        supabase.from('product_specs').select('*').eq('is_active', true),
      ]);

      const catMap = Object.fromEntries((cats.data || []).map(c => [c.id, c.name_he]));
      const outletMap = Object.fromEntries((outlets.data || []).map(o => [o.id, o]));
      const result: MediaRow[] = [];

      for (const mp of (products.data || [])) {
        const outlet = outletMap[mp.outlet_id];
        if (!outlet) continue;
        const cat = catMap[outlet.category_id] || '';
        const matchingSpecs = (specs.data || []).filter(s => s.product_id === mp.id);

        if (matchingSpecs.length === 0) {
          result.push({
            cat, outlet: outlet.name_he || outlet.name, stream: outlet.stream || '', sector: outlet.sector || '',
            city: outlet.city || '', vibe: outlet.vibe_he || '', reach: outlet.reach_info || '', warning: outlet.warning_text || '',
            product: mp.name_he || mp.name, ptype: mp.product_type, gender: mp.gender_target || '',
            audience: mp.target_audience || '', mp_base: mp.base_price || 0, mp_client: mp.client_price || 0,
            tag: mp.special_tag || '', spec: '', dims: '', ps_base: 0, ps_client: 0,
          });
        } else {
          for (const s of matchingSpecs) {
            result.push({
              cat, outlet: outlet.name_he || outlet.name, stream: outlet.stream || '', sector: outlet.sector || '',
              city: outlet.city || '', vibe: outlet.vibe_he || '', reach: outlet.reach_info || '', warning: outlet.warning_text || '',
              product: mp.name_he || mp.name, ptype: mp.product_type, gender: mp.gender_target || '',
              audience: mp.target_audience || '', mp_base: mp.base_price || 0, mp_client: mp.client_price || 0,
              tag: mp.special_tag || '', spec: s.name_he || s.name, dims: s.dimensions || '',
              ps_base: s.base_price || 0, ps_client: s.client_price || 0,
            });
          }
        }
      }

      // Sort by category then outlet
      result.sort((a, b) => a.cat.localeCompare(b.cat) || a.outlet.localeCompare(b.outlet));
      setRows(result);
      setLoading(false);
    };
    fetchData();
  }, []);

  const downloadCSV = () => {
    const BOM = '\uFEFF';
    const header = 'קטגוריה,ערוץ,זרם,סקטור,עיר,אווירה,חשיפה,אזהרה,מוצר,סוג מוצר,מגדר,קהל יעד,מחיר בסיס,מחיר לקוח,תג מיוחד,מפרט,ממדים,מחיר מפרט בסיס,מחיר מפרט לקוח';
    const csvRows = rows.map(r =>
      [r.cat, r.outlet, r.stream, r.sector, r.city, r.vibe, r.reach, r.warning, r.product, r.ptype, r.gender, r.audience, r.mp_base, r.mp_client, r.tag, r.spec, r.dims, r.ps_base, r.ps_client]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = BOM + header + '\n' + csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'adkop-media-catalog.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-8" dir="rtl" lang="he">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-raleway font-bold text-foreground">ייצוא מאגר מדיה</h1>
            <p className="text-muted-foreground mt-1">{loading ? 'טוען נתונים...' : `${rows.length} שורות נמצאו`}</p>
          </div>
          <Button onClick={downloadCSV} disabled={loading} size="lg" className="gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            הורד CSV
          </Button>
        </div>

        {!loading && (
          <div className="bg-card border border-border rounded-xl overflow-auto max-h-[70vh]">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  {['קטגוריה','ערוץ','זרם','סקטור','אווירה','מוצר','מגדר','מפרט','ממדים','מחיר בסיס','מחיר לקוח'].map(h => (
                    <th key={h} className="px-3 py-2 text-right font-semibold text-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-2 whitespace-nowrap">{r.cat}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-medium">{r.outlet}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.stream}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.sector}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.vibe}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.product}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.gender}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.spec}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.dims}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-primary font-medium">{r.mp_base || r.ps_base || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-primary font-medium">{r.mp_client || r.ps_client || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaExport;
