import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Newspaper, 
  Check, 
  Upload, 
  Calendar, 
  Clock, 
  FileImage,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Building2
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface MediaAccess {
  id: string;
  outlet_id: string;
  contact_name: string | null;
  contact_email: string | null;
  is_active: boolean;
  outlet: {
    id: string;
    name: string;
    name_he: string | null;
    logo_url: string | null;
    brand_color: string | null;
  };
}

interface MediaOrder {
  id: string;
  campaign_id: string;
  status: string;
  order_notes: string | null;
  media_notes: string | null;
  client_price: number | null;
  publication_date: string | null;
  deadline_date: string | null;
  creative_url: string | null;
  created_at: string;
  campaign: {
    name: string;
    client_profile: {
      business_name: string;
      logo_url: string | null;
    };
  };
  product: {
    name: string;
    name_he: string | null;
  } | null;
  spec: {
    name: string;
    name_he: string | null;
    dimensions: string | null;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "ממתין לאישור", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
  confirmed: { label: "אושר", color: "bg-blue-100 text-blue-800", icon: <Check className="h-3 w-3" /> },
  in_production: { label: "בהפקה", color: "bg-purple-100 text-purple-800", icon: <Loader2 className="h-3 w-3" /> },
  published: { label: "פורסם", color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="h-3 w-3" /> },
  proof_uploaded: { label: "הוכחה הועלתה", color: "bg-indigo-100 text-indigo-800", icon: <FileImage className="h-3 w-3" /> },
  proof_approved: { label: "הוכחה אושרה", color: "bg-emerald-100 text-emerald-800", icon: <CheckCircle2 className="h-3 w-3" /> },
  proof_rejected: { label: "הוכחה נדחתה", color: "bg-red-100 text-red-800", icon: <AlertCircle className="h-3 w-3" /> },
  completed: { label: "הושלם", color: "bg-gray-100 text-gray-800", icon: <CheckCircle2 className="h-3 w-3" /> },
};

const MediaPortal = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<MediaAccess | null>(null);
  const [orders, setOrders] = useState<MediaOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MediaOrder | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofNotes, setProofNotes] = useState("");
  const [publicationDate, setPublicationDate] = useState("");

  useEffect(() => {
    if (token) {
      validateTokenAndLoadData();
    } else {
      setError("לינק לא תקין - חסר טוקן גישה");
      setLoading(false);
    }
  }, [token]);

  const validateTokenAndLoadData = async () => {
    try {
      // Validate token and get outlet info
      const { data: accessData, error: accessError } = await supabase
        .from("media_portal_access")
        .select(`
          id,
          outlet_id,
          contact_name,
          contact_email,
          is_active,
          outlet:media_outlets(id, name, name_he, logo_url, brand_color)
        `)
        .eq("access_token", token)
        .maybeSingle();

      if (accessError) throw accessError;
      
      if (!accessData) {
        setError("לינק לא תקין או שפג תוקפו");
        setLoading(false);
        return;
      }

      if (!accessData.is_active) {
        setError("הגישה לפורטל זה הושבתה");
        setLoading(false);
        return;
      }

      // Transform outlet data
      const outletData = Array.isArray(accessData.outlet) ? accessData.outlet[0] : accessData.outlet;
      setAccess({
        ...accessData,
        outlet: outletData
      } as MediaAccess);

      // Update last accessed
      await supabase
        .from("media_portal_access")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("id", accessData.id);

      // Load orders for this outlet
      await loadOrders(accessData.outlet_id);
    } catch (err) {
      console.error("Error validating token:", err);
      setError("שגיאה בטעינת הפורטל");
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async (outletId: string) => {
    const { data, error } = await supabase
      .from("media_orders")
      .select(`
        *,
        campaign:campaigns(
          name,
          client_profile:client_profiles(business_name, logo_url)
        ),
        product:media_products(name, name_he),
        spec:product_specs(name, name_he, dimensions)
      `)
      .eq("outlet_id", outletId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading orders:", error);
      return;
    }

    // Transform the data
    const transformedOrders = (data || []).map(order => ({
      ...order,
      campaign: Array.isArray(order.campaign) ? order.campaign[0] : order.campaign,
      product: Array.isArray(order.product) ? order.product[0] : order.product,
      spec: Array.isArray(order.spec) ? order.spec[0] : order.spec,
    }));

    setOrders(transformedOrders as MediaOrder[]);
  };

  const handleConfirmOrder = async (orderId: string) => {
    const { error } = await supabase
      .from("media_orders")
      .update({ status: "confirmed" })
      .eq("id", orderId);

    if (error) {
      toast.error("שגיאה באישור ההזמנה");
      return;
    }

    toast.success("ההזמנה אושרה בהצלחה");
    if (access) loadOrders(access.outlet_id);
  };

  const handleUploadProof = async () => {
    if (!selectedOrder || !proofFile) return;

    setUploadingProof(true);
    try {
      // Upload file to storage
      const fileExt = proofFile.name.split(".").pop();
      const fileName = `${selectedOrder.id}_${Date.now()}.${fileExt}`;
      const filePath = `proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("campaign-proofs")
        .upload(filePath, proofFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("campaign-proofs")
        .getPublicUrl(filePath);

      // Create proof record
      const { error: proofError } = await supabase
        .from("campaign_media_proofs")
        .insert({
          campaign_id: selectedOrder.campaign_id,
          order_id: selectedOrder.id,
          media_outlet_name: access?.outlet.name_he || access?.outlet.name || "",
          image_url: urlData.publicUrl,
          proof_type: "clipping",
          publication_date: publicationDate || null,
          notes: proofNotes || null,
          admin_status: "pending"
        });

      if (proofError) throw proofError;

      // Update order status
      await supabase
        .from("media_orders")
        .update({ status: "proof_uploaded" })
        .eq("id", selectedOrder.id);

      toast.success("ההוכחה הועלתה בהצלחה וממתינה לאישור");
      setUploadDialogOpen(false);
      setProofFile(null);
      setProofNotes("");
      setPublicationDate("");
      if (access) loadOrders(access.outlet_id);
    } catch (err) {
      console.error("Error uploading proof:", err);
      toast.error("שגיאה בהעלאת ההוכחה");
    } finally {
      setUploadingProof(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">טוען פורטל מדיה...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center" dir="rtl">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">שגיאה</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      {/* Header */}
      <header 
        className="border-b bg-card"
        style={{ borderColor: access?.outlet.brand_color || undefined }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {access?.outlet.logo_url ? (
              <img 
                src={access.outlet.logo_url} 
                alt={access.outlet.name}
                className="h-12 w-auto object-contain"
              />
            ) : (
              <div 
                className="h-12 w-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: access?.outlet.brand_color || "#E31E24" }}
              >
                <Newspaper className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">
                {access?.outlet.name_he || access?.outlet.name}
              </h1>
              <p className="text-sm text-muted-foreground">פורטל הזמנות פרסום</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">ההזמנות שלך</h2>
          <p className="text-muted-foreground">
            כאן תוכל לראות את כל ההזמנות, לאשר אותן ולהעלות הוכחות פרסום
          </p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">אין הזמנות כרגע</h3>
              <p className="text-muted-foreground">
                כשיהיו הזמנות חדשות, הן יופיעו כאן
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {order.campaign?.client_profile?.logo_url ? (
                        <img 
                          src={order.campaign.client_profile.logo_url}
                          alt=""
                          className="h-10 w-10 rounded-lg object-contain bg-muted"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">
                          {order.campaign?.client_profile?.business_name || "לקוח"}
                        </CardTitle>
                        <CardDescription>
                          קמפיין: {order.campaign?.name}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={STATUS_CONFIG[order.status]?.color || ""}>
                      {STATUS_CONFIG[order.status]?.icon}
                      <span className="mr-1">{STATUS_CONFIG[order.status]?.label}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {order.product && (
                      <div>
                        <span className="text-sm text-muted-foreground">מוצר:</span>
                        <p className="font-medium">{order.product.name_he || order.product.name}</p>
                      </div>
                    )}
                    {order.spec && (
                      <div>
                        <span className="text-sm text-muted-foreground">מפרט:</span>
                        <p className="font-medium">
                          {order.spec.name_he || order.spec.name}
                          {order.spec.dimensions && ` (${order.spec.dimensions})`}
                        </p>
                      </div>
                    )}
                    {order.deadline_date && (
                      <div>
                        <span className="text-sm text-muted-foreground">דדליין:</span>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(order.deadline_date), "d בMMMM yyyy", { locale: he })}
                        </p>
                      </div>
                    )}
                    {order.publication_date && (
                      <div>
                        <span className="text-sm text-muted-foreground">תאריך פרסום:</span>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(order.publication_date), "d בMMMM yyyy", { locale: he })}
                        </p>
                      </div>
                    )}
                  </div>

                  {order.order_notes && (
                    <div className="bg-muted/50 rounded-lg p-3 mb-4">
                      <span className="text-sm font-medium">הערות:</span>
                      <p className="text-sm text-muted-foreground mt-1">{order.order_notes}</p>
                    </div>
                  )}

                  {order.creative_url && (
                    <div className="mb-4">
                      <span className="text-sm font-medium mb-2 block">קריאייטיב:</span>
                      <img 
                        src={order.creative_url} 
                        alt="Creative"
                        className="max-h-48 rounded-lg border"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    {order.status === "pending" && (
                      <Button onClick={() => handleConfirmOrder(order.id)}>
                        <Check className="h-4 w-4 ml-2" />
                        אשר הזמנה
                      </Button>
                    )}
                    {["confirmed", "in_production", "published", "proof_rejected"].includes(order.status) && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(order);
                          setUploadDialogOpen(true);
                        }}
                      >
                        <Upload className="h-4 w-4 ml-2" />
                        העלה הוכחת פרסום
                      </Button>
                    )}
                    {order.status === "proof_uploaded" && (
                      <Badge variant="secondary" className="py-2">
                        <Clock className="h-4 w-4 ml-2" />
                        ההוכחה ממתינה לאישור
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Upload Proof Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>העלאת הוכחת פרסום</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>צילום ההוכחה *</Label>
              <Input 
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>תאריך פרסום</Label>
              <Input 
                type="date"
                value={publicationDate}
                onChange={(e) => setPublicationDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>הערות</Label>
              <Textarea
                placeholder="הערות נוספות..."
                value={proofNotes}
                onChange={(e) => setProofNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              ביטול
            </Button>
            <Button 
              onClick={handleUploadProof}
              disabled={!proofFile || uploadingProof}
            >
              {uploadingProof ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  מעלה...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 ml-2" />
                  העלה הוכחה
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaPortal;
