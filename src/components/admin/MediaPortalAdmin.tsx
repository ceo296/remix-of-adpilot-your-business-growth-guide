import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Link2, 
  Copy, 
  Check, 
  X, 
  Eye, 
  Newspaper,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Loader2,
  ExternalLink,
  Calendar,
  Building2,
  Image as ImageIcon
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface PortalAccess {
  id: string;
  outlet_id: string;
  access_token: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  last_accessed_at: string | null;
  created_at: string;
  outlet: {
    id: string;
    name: string;
    name_he: string | null;
    logo_url: string | null;
  };
}

interface MediaProof {
  id: string;
  campaign_id: string;
  order_id: string | null;
  media_outlet_name: string;
  image_url: string;
  proof_type: string;
  publication_date: string | null;
  notes: string | null;
  admin_status: string | null;
  admin_notes: string | null;
  admin_reviewed_at: string | null;
  created_at: string;
  campaign: {
    name: string;
    client_profile: {
      business_name: string;
    };
  };
}

interface MediaOutlet {
  id: string;
  name: string;
  name_he: string | null;
}

const MediaPortalAdmin = () => {
  const [activeTab, setActiveTab] = useState("links");
  const [loading, setLoading] = useState(true);
  
  // Portal Access State
  const [accessList, setAccessList] = useState<PortalAccess[]>([]);
  const [outlets, setOutlets] = useState<MediaOutlet[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [creating, setCreating] = useState(false);
  
  // Proofs State
  const [proofs, setProofs] = useState<MediaProof[]>([]);
  const [proofFilter, setProofFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [selectedProof, setSelectedProof] = useState<MediaProof | null>(null);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadAccessList(), loadOutlets(), loadProofs()]);
    setLoading(false);
  };

  const loadAccessList = async () => {
    const { data, error } = await supabase
      .from("media_portal_access")
      .select(`
        *,
        outlet:media_outlets(id, name, name_he, logo_url)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading access list:", error);
      return;
    }

    const transformed = (data || []).map(item => ({
      ...item,
      outlet: Array.isArray(item.outlet) ? item.outlet[0] : item.outlet
    }));

    setAccessList(transformed as PortalAccess[]);
  };

  const loadOutlets = async () => {
    const { data, error } = await supabase
      .from("media_outlets")
      .select("id, name, name_he")
      .eq("is_active", true)
      .order("name_he");

    if (error) {
      console.error("Error loading outlets:", error);
      return;
    }

    setOutlets(data || []);
  };

  const loadProofs = async () => {
    const { data, error } = await supabase
      .from("campaign_media_proofs")
      .select(`
        *,
        campaign:campaigns(
          name,
          client_profile:client_profiles(business_name)
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading proofs:", error);
      return;
    }

    const transformed = (data || []).map(item => ({
      ...item,
      campaign: Array.isArray(item.campaign) ? item.campaign[0] : item.campaign
    }));

    setProofs(transformed as MediaProof[]);
  };

  const handleCreateAccess = async () => {
    if (!selectedOutlet) {
      toast.error("בחר אמצעי תקשורת");
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase
        .from("media_portal_access")
        .insert({
          outlet_id: selectedOutlet,
          contact_name: contactName || null,
          contact_email: contactEmail || null,
          contact_phone: contactPhone || null
        });

      if (error) throw error;

      toast.success("לינק גישה נוצר בהצלחה");
      setCreateDialogOpen(false);
      setSelectedOutlet("");
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      loadAccessList();
    } catch (err) {
      console.error("Error creating access:", err);
      toast.error("שגיאה ביצירת לינק גישה");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (accessId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("media_portal_access")
      .update({ is_active: !currentActive })
      .eq("id", accessId);

    if (error) {
      toast.error("שגיאה בעדכון סטטוס");
      return;
    }

    toast.success(currentActive ? "הגישה הושבתה" : "הגישה הופעלה");
    loadAccessList();
  };

  const handleCopyLink = (token: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/#/media-portal?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success("הלינק הועתק ללוח");
  };

  const handleApproveProof = async (status: "approved" | "rejected") => {
    if (!selectedProof) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("campaign_media_proofs")
        .update({
          admin_status: status,
          admin_notes: adminNotes || null,
          admin_reviewed_at: new Date().toISOString()
        })
        .eq("id", selectedProof.id);

      if (error) throw error;

      // If approved, update order status
      if (status === "approved" && selectedProof.order_id) {
        await supabase
          .from("media_orders")
          .update({ status: "proof_approved" })
          .eq("id", selectedProof.order_id);
      } else if (status === "rejected" && selectedProof.order_id) {
        await supabase
          .from("media_orders")
          .update({ status: "proof_rejected" })
          .eq("id", selectedProof.order_id);
      }

      toast.success(status === "approved" ? "ההוכחה אושרה" : "ההוכחה נדחתה");
      setProofDialogOpen(false);
      setAdminNotes("");
      loadProofs();
    } catch (err) {
      console.error("Error updating proof:", err);
      toast.error("שגיאה בעדכון ההוכחה");
    } finally {
      setUpdating(false);
    }
  };

  const filteredProofs = proofs.filter(proof => {
    if (proofFilter === "all") return true;
    return (proof.admin_status || "pending") === proofFilter;
  });

  const pendingCount = proofs.filter(p => !p.admin_status || p.admin_status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">פורטל מדיה</h2>
        <p className="text-[#888]">ניהול לינקים ייחודיים ואישור הוכחות פרסום</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1a1a1d]">
          <TabsTrigger value="links" className="data-[state=active]:bg-primary">
            <Link2 className="h-4 w-4 ml-2" />
            לינקי גישה
          </TabsTrigger>
          <TabsTrigger value="proofs" className="data-[state=active]:bg-primary relative">
            <Newspaper className="h-4 w-4 ml-2" />
            אישור הוכחות
            {pendingCount > 0 && (
              <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Links Tab */}
        <TabsContent value="links" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-[#888]">{accessList.length} לינקים פעילים</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              צור לינק חדש
            </Button>
          </div>

          <div className="grid gap-4">
            {accessList.map((access) => (
              <Card key={access.id} className="bg-[#111113] border-[#222]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {access.outlet?.logo_url ? (
                        <img 
                          src={access.outlet.logo_url} 
                          alt=""
                          className="h-10 w-10 rounded object-contain bg-white"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-[#222] flex items-center justify-center">
                          <Newspaper className="h-5 w-5 text-[#888]" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-white">
                          {access.outlet?.name_he || access.outlet?.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-[#888]">
                          {access.contact_name && <span>{access.contact_name}</span>}
                          {access.contact_email && <span>• {access.contact_email}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {access.last_accessed_at && (
                        <span className="text-xs text-[#888]">
                          נכנס לאחרונה: {format(new Date(access.last_accessed_at), "d/M/yy HH:mm")}
                        </span>
                      )}
                      <Badge variant={access.is_active ? "default" : "secondary"}>
                        {access.is_active ? "פעיל" : "מושבת"}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopyLink(access.access_token)}
                      >
                        <Copy className="h-4 w-4 ml-1" />
                        העתק לינק
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(access.id, access.is_active)}
                      >
                        {access.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {accessList.length === 0 && (
              <Card className="bg-[#111113] border-[#222]">
                <CardContent className="py-12 text-center">
                  <Link2 className="h-12 w-12 text-[#444] mx-auto mb-4" />
                  <p className="text-[#888]">אין לינקי גישה. צור לינק חדש לאמצעי תקשורת.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Proofs Tab */}
        <TabsContent value="proofs" className="space-y-4 mt-4">
          <div className="flex gap-2">
            {(["pending", "approved", "rejected", "all"] as const).map(filter => (
              <Button
                key={filter}
                variant={proofFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setProofFilter(filter)}
              >
                {filter === "pending" && <Clock className="h-4 w-4 ml-1" />}
                {filter === "approved" && <CheckCircle2 className="h-4 w-4 ml-1" />}
                {filter === "rejected" && <XCircle className="h-4 w-4 ml-1" />}
                {filter === "pending" && "ממתינות"}
                {filter === "approved" && "אושרו"}
                {filter === "rejected" && "נדחו"}
                {filter === "all" && "הכל"}
                {filter === "pending" && pendingCount > 0 && ` (${pendingCount})`}
              </Button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProofs.map((proof) => (
              <Card 
                key={proof.id} 
                className="bg-[#111113] border-[#222] overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => {
                  setSelectedProof(proof);
                  setAdminNotes(proof.admin_notes || "");
                  setProofDialogOpen(true);
                }}
              >
                <div className="aspect-video relative bg-[#0a0a0b]">
                  <img 
                    src={proof.image_url} 
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <Badge 
                    className={`absolute top-2 right-2 ${
                      proof.admin_status === "approved" 
                        ? "bg-green-500" 
                        : proof.admin_status === "rejected"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                    }`}
                  >
                    {proof.admin_status === "approved" && "אושר"}
                    {proof.admin_status === "rejected" && "נדחה"}
                    {(!proof.admin_status || proof.admin_status === "pending") && "ממתין"}
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <h4 className="font-medium text-white text-sm truncate">
                    {proof.campaign?.client_profile?.business_name}
                  </h4>
                  <p className="text-xs text-[#888] truncate">{proof.media_outlet_name}</p>
                  <p className="text-xs text-[#666] mt-1">
                    {format(new Date(proof.created_at), "d/M/yy")}
                  </p>
                </CardContent>
              </Card>
            ))}

            {filteredProofs.length === 0 && (
              <Card className="bg-[#111113] border-[#222] col-span-full">
                <CardContent className="py-12 text-center">
                  <ImageIcon className="h-12 w-12 text-[#444] mx-auto mb-4" />
                  <p className="text-[#888]">אין הוכחות בסטטוס זה</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Access Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#111113] border-[#222]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-white">יצירת לינק גישה חדש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">אמצעי תקשורת *</Label>
              <select
                value={selectedOutlet}
                onChange={(e) => setSelectedOutlet(e.target.value)}
                className="w-full mt-1 bg-[#0a0a0b] border border-[#222] rounded-md p-2 text-white"
              >
                <option value="">בחר אמצעי תקשורת</option>
                {outlets.map(outlet => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name_he || outlet.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-white">שם איש קשר</Label>
              <Input 
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="mt-1 bg-[#0a0a0b] border-[#222]"
                placeholder="לדוגמה: יוסי כהן"
              />
            </div>
            <div>
              <Label className="text-white">אימייל</Label>
              <Input 
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="mt-1 bg-[#0a0a0b] border-[#222]"
                placeholder="example@media.co.il"
              />
            </div>
            <div>
              <Label className="text-white">טלפון</Label>
              <Input 
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="mt-1 bg-[#0a0a0b] border-[#222]"
                placeholder="050-0000000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleCreateAccess} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
              צור לינק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proof Review Dialog */}
      <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
        <DialogContent className="bg-[#111113] border-[#222] max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-white">בדיקת הוכחת פרסום</DialogTitle>
          </DialogHeader>
          {selectedProof && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden bg-[#0a0a0b]">
                <img 
                  src={selectedProof.image_url} 
                  alt=""
                  className="w-full max-h-96 object-contain"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#888]">לקוח:</span>
                  <p className="text-white">{selectedProof.campaign?.client_profile?.business_name}</p>
                </div>
                <div>
                  <span className="text-[#888]">קמפיין:</span>
                  <p className="text-white">{selectedProof.campaign?.name}</p>
                </div>
                <div>
                  <span className="text-[#888]">אמצעי תקשורת:</span>
                  <p className="text-white">{selectedProof.media_outlet_name}</p>
                </div>
                {selectedProof.publication_date && (
                  <div>
                    <span className="text-[#888]">תאריך פרסום:</span>
                    <p className="text-white">
                      {format(new Date(selectedProof.publication_date), "d בMMMM yyyy", { locale: he })}
                    </p>
                  </div>
                )}
              </div>

              {selectedProof.notes && (
                <div className="bg-[#0a0a0b] rounded-lg p-3">
                  <span className="text-[#888] text-sm">הערות מהמדיה:</span>
                  <p className="text-white text-sm mt-1">{selectedProof.notes}</p>
                </div>
              )}

              <div>
                <Label className="text-white">הערות אדמין</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="mt-1 bg-[#0a0a0b] border-[#222]"
                  placeholder="הערות לגבי ההוכחה..."
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setProofDialogOpen(false)}>
              ביטול
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleApproveProof("rejected")}
              disabled={updating}
            >
              <XCircle className="h-4 w-4 ml-2" />
              דחה
            </Button>
            <Button 
              onClick={() => handleApproveProof("approved")}
              disabled={updating}
              className="bg-green-600 hover:bg-green-700"
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <CheckCircle2 className="h-4 w-4 ml-2" />}
              אשר הוכחה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaPortalAdmin;
