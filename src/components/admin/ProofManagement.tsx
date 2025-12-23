import { useState, useEffect } from 'react';
import { Newspaper, Upload, Trash2, Search, Calendar, Image as ImageIcon, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  name: string;
  client_profile_id: string;
  client_profiles?: {
    business_name: string;
  };
}

interface MediaProof {
  id: string;
  campaign_id: string;
  media_outlet_name: string;
  proof_type: string;
  image_url: string;
  publication_date: string | null;
  notes: string | null;
  created_at: string;
}

const ProofManagement = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [proofs, setProofs] = useState<MediaProof[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formCampaignId, setFormCampaignId] = useState('');
  const [formOutletName, setFormOutletName] = useState('');
  const [formProofType, setFormProofType] = useState('clipping');
  const [formPublicationDate, setFormPublicationDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    // Load all campaigns with client info
    const { data: campaignsData, error: campaignsError } = await supabase
      .from('campaigns')
      .select(`
        id,
        name,
        client_profile_id,
        client_profiles (
          business_name
        )
      `)
      .order('created_at', { ascending: false });

    if (campaignsError) {
      console.error('Error loading campaigns:', campaignsError);
    } else {
      setCampaigns(campaignsData || []);
    }

    // Load all proofs
    const { data: proofsData, error: proofsError } = await supabase
      .from('campaign_media_proofs')
      .select('*')
      .order('created_at', { ascending: false });

    if (proofsError) {
      console.error('Error loading proofs:', proofsError);
    } else {
      setProofs(proofsData || []);
    }

    setIsLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormFile(e.target.files[0]);
    }
  };

  const uploadProof = async () => {
    if (!formCampaignId || !formOutletName || !formFile) {
      toast.error('נא למלא את כל השדות הנדרשים');
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = formFile.name.split('.').pop();
      const fileName = `${formCampaignId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('campaign-proofs')
        .upload(fileName, formFile);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('campaign-proofs')
        .getPublicUrl(fileName);

      // Insert proof record
      const { error: insertError } = await supabase
        .from('campaign_media_proofs')
        .insert({
          campaign_id: formCampaignId,
          media_outlet_name: formOutletName,
          proof_type: formProofType,
          image_url: publicUrl,
          publication_date: formPublicationDate || null,
          notes: formNotes || null
        });

      if (insertError) {
        throw insertError;
      }

      toast.success('הוכחת הפרסום הועלתה בהצלחה');
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast.error('שגיאה בהעלאת הקובץ');
    } finally {
      setUploading(false);
    }
  };

  const deleteProof = async (proofId: string, imageUrl: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את ההוכחה?')) return;

    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/campaign-proofs/');
      if (urlParts[1]) {
        await supabase.storage
          .from('campaign-proofs')
          .remove([urlParts[1]]);
      }

      const { error } = await supabase
        .from('campaign_media_proofs')
        .delete()
        .eq('id', proofId);

      if (error) throw error;

      toast.success('ההוכחה נמחקה בהצלחה');
      loadData();
    } catch (error) {
      console.error('Error deleting proof:', error);
      toast.error('שגיאה במחיקת ההוכחה');
    }
  };

  const resetForm = () => {
    setFormCampaignId('');
    setFormOutletName('');
    setFormProofType('clipping');
    setFormPublicationDate('');
    setFormNotes('');
    setFormFile(null);
  };

  const getCampaignName = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return 'קמפיין לא ידוע';
    const clientName = campaign.client_profiles?.business_name || 'לקוח לא ידוע';
    return `${campaign.name} - ${clientName}`;
  };

  const filteredProofs = proofs.filter(proof => {
    const matchesSearch = 
      proof.media_outlet_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (proof.notes?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCampaign = selectedCampaign === 'all' || proof.campaign_id === selectedCampaign;
    
    return matchesSearch && matchesCampaign;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">הוכחות פרסום</h1>
          <p className="text-[#888]">ניהול גזרי עיתונים וצילומי מדיה</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-[#222] text-lg px-4 py-2">
            <Newspaper className="h-4 w-4 ml-2" />
            {proofs.length} הוכחות
          </Badge>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 ml-2" />
                העלאת הוכחה
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#111113] border-[#222] text-white max-w-md">
              <DialogHeader>
                <DialogTitle>העלאת הוכחת פרסום</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>קמפיין *</Label>
                  <Select value={formCampaignId} onValueChange={setFormCampaignId}>
                    <SelectTrigger className="bg-[#1a1a1d] border-[#333]">
                      <SelectValue placeholder="בחר קמפיין" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1d] border-[#333]">
                      {campaigns.map(campaign => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {getCampaignName(campaign.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>שם המדיה/עיתון *</Label>
                  <Input
                    value={formOutletName}
                    onChange={(e) => setFormOutletName(e.target.value)}
                    placeholder="לדוגמה: ידיעות אחרונות"
                    className="bg-[#1a1a1d] border-[#333]"
                  />
                </div>

                <div>
                  <Label>סוג הוכחה</Label>
                  <Select value={formProofType} onValueChange={setFormProofType}>
                    <SelectTrigger className="bg-[#1a1a1d] border-[#333]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1d] border-[#333]">
                      <SelectItem value="clipping">גזיר עיתון</SelectItem>
                      <SelectItem value="screenshot">צילום מסך</SelectItem>
                      <SelectItem value="photo">תצלום</SelectItem>
                      <SelectItem value="digital">דיגיטל</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>תאריך פרסום</Label>
                  <Input
                    type="date"
                    value={formPublicationDate}
                    onChange={(e) => setFormPublicationDate(e.target.value)}
                    className="bg-[#1a1a1d] border-[#333]"
                  />
                </div>

                <div>
                  <Label>הערות</Label>
                  <Textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="הערות נוספות..."
                    className="bg-[#1a1a1d] border-[#333]"
                  />
                </div>

                <div>
                  <Label>קובץ תמונה *</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="bg-[#1a1a1d] border-[#333]"
                  />
                  {formFile && (
                    <p className="text-sm text-[#888] mt-1">{formFile.name}</p>
                  )}
                </div>

                <Button 
                  onClick={uploadProof} 
                  disabled={uploading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {uploading ? 'מעלה...' : 'העלה הוכחה'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש לפי שם מדיה או הערות..."
            className="pr-10 bg-[#1a1a1d] border-[#333] text-white"
          />
        </div>
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
          <SelectTrigger className="w-64 bg-[#1a1a1d] border-[#333]">
            <SelectValue placeholder="כל הקמפיינים" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1d] border-[#333]">
            <SelectItem value="all">כל הקמפיינים</SelectItem>
            {campaigns.map(campaign => (
              <SelectItem key={campaign.id} value={campaign.id}>
                {getCampaignName(campaign.id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Proofs Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProofs.map(proof => (
          <Card key={proof.id} className="bg-[#111113] border-[#222] overflow-hidden group">
            <div className="aspect-video relative">
              <img
                src={proof.image_url}
                alt={proof.media_outlet_name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => deleteProof(proof.id, proof.image_url)}
                className="absolute top-2 left-2 p-2 bg-red-500/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4 text-white" />
              </button>
              <Badge className="absolute top-2 right-2 bg-black/60">
                {proof.proof_type === 'clipping' && 'גזיר עיתון'}
                {proof.proof_type === 'screenshot' && 'צילום מסך'}
                {proof.proof_type === 'photo' && 'תצלום'}
                {proof.proof_type === 'digital' && 'דיגיטל'}
              </Badge>
            </div>
            <CardContent className="p-3">
              <h3 className="font-semibold truncate">{proof.media_outlet_name}</h3>
              <p className="text-xs text-[#888] truncate">{getCampaignName(proof.campaign_id)}</p>
              {proof.publication_date && (
                <div className="flex items-center gap-1 text-xs text-[#666] mt-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(proof.publication_date).toLocaleDateString('he-IL')}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProofs.length === 0 && !isLoading && (
        <Card className="bg-[#111113] border-[#222]">
          <CardContent className="p-8 text-center text-[#888]">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-[#333]" />
            <p>אין הוכחות פרסום להצגה</p>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card className="bg-[#111113] border-[#222]">
          <CardContent className="p-8 text-center text-[#888]">
            טוען...
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProofManagement;
