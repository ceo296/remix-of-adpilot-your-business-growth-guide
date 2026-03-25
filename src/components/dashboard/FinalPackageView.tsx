import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  MessageCircle,
  Loader2,
  FileText,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface PackageItem {
  id: string;
  outlet_name: string;
  product_name: string;
  spec_name: string | null;
  dimensions: string | null;
  price: number;
  quantity: number;
  publication_date: string | null;
  notes: string | null;
}

interface FinalPackage {
  id: string;
  campaign_id: string;
  status: string;
  admin_notes: string | null;
  total_price: number;
  created_at: string;
  items: PackageItem[];
}

interface FinalPackageViewProps {
  campaignId: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending_approval: {
    label: 'ממתין לאישורך',
    icon: <Clock className="h-5 w-5" />,
    color: 'text-amber-500',
  },
  approved: {
    label: 'אושר',
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: 'text-emerald-500',
  },
  rejected: {
    label: 'נדחה',
    icon: <XCircle className="h-5 w-5" />,
    color: 'text-destructive',
  },
};

export const FinalPackageView = ({ campaignId }: FinalPackageViewProps) => {
  const [pkg, setPkg] = useState<FinalPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchPackage = async () => {
      setLoading(true);
      // Fetch final package
      const { data: packages } = await supabase
        .from('campaign_final_packages')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (packages && packages.length > 0) {
        const fp = packages[0];
        // Fetch items
        const { data: items } = await supabase
          .from('campaign_final_package_items')
          .select('*')
          .eq('package_id', fp.id)
          .order('publication_date', { ascending: true });

        setPkg({
          ...fp,
          items: items || [],
        });
      }
      setLoading(false);
    };

    fetchPackage();
  }, [campaignId]);

  const handleApprove = async () => {
    if (!pkg) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('campaign_final_packages')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', pkg.id);

      if (error) throw error;

      // Also update campaign status
      await supabase
        .from('campaigns')
        .update({ status: 'active' })
        .eq('id', campaignId);

      setPkg({ ...pkg, status: 'approved' });
      toast.success('החבילה אושרה! הקמפיין יופעל בהקדם 🚀');
    } catch {
      toast.error('שגיאה באישור החבילה');
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!pkg) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('campaign_final_packages')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', pkg.id);

      if (error) throw error;

      setPkg({ ...pkg, status: 'rejected' });
      toast.info('החבילה נדחתה. נציג ייצור עמך קשר');
    } catch {
      toast.error('שגיאה בעדכון הסטטוס');
    } finally {
      setUpdating(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground">טוען חבילה סופית...</p>
        </CardContent>
      </Card>
    );
  }

  if (!pkg) {
    return (
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="p-8 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Clock className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">החבילה הסופית בהכנה</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            הצוות שלנו בודק זמינות ומחירים סופיים מול ערוצי המדיה. תקבל הודעה כשהחבילה המפורטת תהיה מוכנה.
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = STATUS_CONFIG[pkg.status] || STATUS_CONFIG.pending_approval;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              חבילת מדיה סופית
            </CardTitle>
            <Badge
              variant={pkg.status === 'approved' ? 'default' : pkg.status === 'rejected' ? 'destructive' : 'outline'}
              className={`gap-1 ${statusInfo.color}`}
            >
              {statusInfo.icon}
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>

        {pkg.admin_notes && (
          <CardContent className="pt-0 pb-4">
            <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">{pkg.admin_notes}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Items Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-right font-bold">ערוץ מדיה</TableHead>
                  <TableHead className="text-right font-bold">מוצר / גודל</TableHead>
                  <TableHead className="text-right font-bold">תאריך פרסום</TableHead>
                  <TableHead className="text-right font-bold">כמות</TableHead>
                  <TableHead className="text-right font-bold">מחיר</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pkg.items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-semibold text-foreground">{item.outlet_name}</TableCell>
                    <TableCell className="text-sm">
                      <span className="block font-medium text-foreground">{item.product_name}</span>
                      {item.spec_name && <span className="block text-muted-foreground text-xs">{item.spec_name}</span>}
                      {item.dimensions && <span className="block text-muted-foreground text-xs">{item.dimensions}</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.publication_date ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(item.publication_date), 'd בMMM yyyy', { locale: he })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">טרם נקבע</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">×{item.quantity}</TableCell>
                    <TableCell className="font-bold text-primary">{formatPrice(item.price * item.quantity)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center px-6 py-4 bg-muted/30 border-t border-border">
            <span className="font-bold text-foreground text-lg">סה"כ לתשלום (לפני מע"מ)</span>
            <span className="text-2xl font-bold text-primary">{formatPrice(pkg.total_price)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {pkg.status === 'pending_approval' && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            className="flex-1 h-14 text-lg gap-2"
            onClick={handleApprove}
            disabled={updating}
          >
            {updating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            מאשר, קדימה!
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1 h-14 text-lg gap-2"
            onClick={handleReject}
            disabled={updating}
          >
            <MessageCircle className="h-5 w-5" />
            רוצה לדבר על זה
          </Button>
        </div>
      )}

      {pkg.status === 'approved' && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-primary mx-auto" />
            <h3 className="text-xl font-bold text-foreground">החבילה אושרה! 🎉</h3>
            <p className="text-muted-foreground">הקמפיין שלך בדרך לאוויר. תקבל עדכונים על כל שלב.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
