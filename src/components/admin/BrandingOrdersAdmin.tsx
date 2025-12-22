import { useState, useEffect } from 'react';
import { 
  Palette, Package, Crown, Clock, CheckCircle, 
  AlertCircle, Search, Filter, Eye, Mail, Phone,
  Calendar, DollarSign, User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BrandingOrder {
  id: string;
  user_id: string;
  essence: string | null;
  differentiator: string | null;
  persona: string | null;
  audience: string | null;
  vision: string | null;
  design_preferences: string | null;
  package_type: string | null;
  package_price: number | null;
  status: string;
  payment_status: string | null;
  created_at: string;
  updated_at: string;
  // Joined from profiles
  profile?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    company_name: string | null;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'ממתין', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock },
  paid: { label: 'שולם', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: DollarSign },
  in_progress: { label: 'בעבודה', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: Palette },
  completed: { label: 'הושלם', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle },
};

const PACKAGE_CONFIG: Record<string, { label: string; icon: typeof Package }> = {
  visibility: { label: 'חבילת נראות', icon: Package },
  full_brand: { label: 'חבילת מותג מלאה', icon: Crown },
};

const BrandingOrdersAdmin = () => {
  const [orders, setOrders] = useState<BrandingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<BrandingOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // Fetch branding orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('branding_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch profiles for all unique user_ids
      const userIds = [...new Set(ordersData?.map(o => o.user_id) || [])];
      
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, company_name')
          .in('id', userIds);
        
        profilesData?.forEach(p => {
          profilesMap[p.id] = p;
        });
      }

      // Combine orders with profiles
      const enrichedOrders = ordersData?.map(order => ({
        ...order,
        profile: profilesMap[order.user_id] || null
      })) || [];

      setOrders(enrichedOrders);
    } catch (error) {
      console.error('Error fetching branding orders:', error);
      toast.error('שגיאה בטעינת ההזמנות');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('branding_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }

      toast.success('הסטטוס עודכן בהצלחה');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('שגיאה בעדכון הסטטוס');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.profile?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    inProgress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.package_price || 0), 0),
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openOrderDetail = (order: BrandingOrder) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#888]">טוען הזמנות מיתוג...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            הזמנות מיתוג
          </h2>
          <p className="text-[#888] text-sm mt-1">ניהול הזמנות Branding Studio</p>
        </div>
        <Button onClick={fetchOrders} variant="outline" size="sm">
          רענן
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-[#111113] border-[#222]">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-[#888]">סה״כ הזמנות</div>
          </CardContent>
        </Card>
        <Card className="bg-[#111113] border-[#222]">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <div className="text-sm text-[#888]">ממתינות</div>
          </CardContent>
        </Card>
        <Card className="bg-[#111113] border-[#222]">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-500">{stats.inProgress}</div>
            <div className="text-sm text-[#888]">בעבודה</div>
          </CardContent>
        </Card>
        <Card className="bg-[#111113] border-[#222]">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            <div className="text-sm text-[#888]">הושלמו</div>
          </CardContent>
        </Card>
        <Card className="bg-[#111113] border-[#222]">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">₪{stats.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-[#888]">הכנסות</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888]" />
          <Input
            placeholder="חיפוש לפי שם, מייל או חברה..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-[#111113] border-[#222]"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-[#111113] border-[#222]">
            <Filter className="h-4 w-4 ml-2" />
            <SelectValue placeholder="סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            <SelectItem value="pending">ממתין</SelectItem>
            <SelectItem value="paid">שולם</SelectItem>
            <SelectItem value="in_progress">בעבודה</SelectItem>
            <SelectItem value="completed">הושלם</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card className="bg-[#111113] border-[#222]">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-[#444] mb-4" />
            <p className="text-[#888]">אין הזמנות מיתוג</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(order => {
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const packageConfig = order.package_type ? PACKAGE_CONFIG[order.package_type] : null;
            const StatusIcon = statusConfig.icon;
            const PackageIcon = packageConfig?.icon || Package;

            return (
              <Card 
                key={order.id} 
                className="bg-[#111113] border-[#222] hover:border-[#333] transition-colors cursor-pointer"
                onClick={() => openOrderDetail(order)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <PackageIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {order.profile?.full_name || 'לקוח ללא שם'}
                          {order.profile?.company_name && (
                            <span className="text-sm text-[#888]">({order.profile.company_name})</span>
                          )}
                        </div>
                        <div className="text-sm text-[#888] flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(order.created_at)}
                          </span>
                          {packageConfig && (
                            <span>• {packageConfig.label}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <div className="font-bold text-primary">
                          ₪{(order.package_price || 0).toLocaleString()}
                        </div>
                      </div>
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 ml-1" />
                        {statusConfig.label}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openOrderDetail(order); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#111113] border-[#222]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              פרטי הזמנת מיתוג
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <Card className="bg-[#0a0a0b] border-[#222]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    פרטי לקוח
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#888]">שם:</span>
                    <span>{selectedOrder.profile?.full_name || 'לא צוין'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#888]">חברה:</span>
                    <span>{selectedOrder.profile?.company_name || 'לא צוין'}</span>
                  </div>
                  {selectedOrder.profile?.email && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#888]">מייל:</span>
                      <a href={`mailto:${selectedOrder.profile.email}`} className="text-primary hover:underline flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedOrder.profile.email}
                      </a>
                    </div>
                  )}
                  {selectedOrder.profile?.phone && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#888]">טלפון:</span>
                      <a href={`tel:${selectedOrder.profile.phone}`} className="text-primary hover:underline flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedOrder.profile.phone}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Package & Status */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-[#0a0a0b] border-[#222]">
                  <CardContent className="p-4">
                    <div className="text-sm text-[#888] mb-1">חבילה</div>
                    <div className="font-bold flex items-center gap-2">
                      {selectedOrder.package_type === 'full_brand' ? (
                        <><Crown className="h-4 w-4 text-primary" /> חבילת מותג מלאה</>
                      ) : (
                        <><Package className="h-4 w-4 text-primary" /> חבילת נראות</>
                      )}
                    </div>
                    <div className="text-xl font-bold text-primary mt-1">
                      ₪{(selectedOrder.package_price || 0).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[#0a0a0b] border-[#222]">
                  <CardContent className="p-4">
                    <div className="text-sm text-[#888] mb-1">סטטוס</div>
                    <Select 
                      value={selectedOrder.status} 
                      onValueChange={(value) => updateOrderStatus(selectedOrder.id, value)}
                    >
                      <SelectTrigger className="bg-[#111113] border-[#333]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">ממתין</SelectItem>
                        <SelectItem value="paid">שולם</SelectItem>
                        <SelectItem value="in_progress">בעבודה</SelectItem>
                        <SelectItem value="completed">הושלם</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </div>

              {/* Brief Answers */}
              <Card className="bg-[#0a0a0b] border-[#222]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">תשובות הבריף</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {selectedOrder.essence && (
                    <div>
                      <div className="text-[#888] mb-1">התמחות העסק:</div>
                      <div className="bg-[#111113] p-3 rounded-lg">{selectedOrder.essence}</div>
                    </div>
                  )}
                  {selectedOrder.differentiator && (
                    <div>
                      <div className="text-[#888] mb-1">הבידול:</div>
                      <div className="bg-[#111113] p-3 rounded-lg">{selectedOrder.differentiator}</div>
                    </div>
                  )}
                  {selectedOrder.persona && (
                    <div>
                      <div className="text-[#888] mb-1">אופי המותג:</div>
                      <div className="bg-[#111113] p-3 rounded-lg">{selectedOrder.persona}</div>
                    </div>
                  )}
                  {selectedOrder.audience && (
                    <div>
                      <div className="text-[#888] mb-1">קהל יעד:</div>
                      <div className="bg-[#111113] p-3 rounded-lg">{selectedOrder.audience}</div>
                    </div>
                  )}
                  {selectedOrder.vision && (
                    <div>
                      <div className="text-[#888] mb-1">החזון:</div>
                      <div className="bg-[#111113] p-3 rounded-lg">{selectedOrder.vision}</div>
                    </div>
                  )}
                  {selectedOrder.design_preferences && (
                    <div>
                      <div className="text-[#888] mb-1">העדפות עיצוב:</div>
                      <div className="bg-[#111113] p-3 rounded-lg">{selectedOrder.design_preferences}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timestamps */}
              <div className="text-xs text-[#666] flex justify-between">
                <span>נוצר: {formatDate(selectedOrder.created_at)}</span>
                <span>עודכן: {formatDate(selectedOrder.updated_at)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrandingOrdersAdmin;