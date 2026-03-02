import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Database, Brain, Users, LogOut, Menu, X, 
  Settings, ChevronLeft, Palette, Newspaper, Link2, Cpu, FileCode2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import MediaDatabaseAdmin from '@/components/admin/MediaDatabaseAdmin';
import ClientOverview from '@/components/admin/ClientOverview';
import BrandingOrdersAdmin from '@/components/admin/BrandingOrdersAdmin';
import ProofManagement from '@/components/admin/ProofManagement';
import MediaPortalAdmin from '@/components/admin/MediaPortalAdmin';
import AIModelConfigsAdmin from '@/components/admin/AIModelConfigsAdmin';
import TemplateEditor from '@/components/admin/TemplateEditor';

type AdminTab = 'media' | 'brain' | 'models' | 'templates' | 'clients' | 'branding' | 'proofs' | 'portal';

const TABS = [
  { id: 'media' as AdminTab, label: 'ערוצי מדיה', icon: Database },
  { id: 'brain' as AdminTab, label: 'אימון מערכת AI', icon: Brain },
  { id: 'models' as AdminTab, label: 'מודלים ייעודיים', icon: Cpu },
  { id: 'templates' as AdminTab, label: 'תבניות מודעה', icon: FileCode2 },
  { id: 'clients' as AdminTab, label: 'רשימת לקוחות', icon: Users },
  { id: 'branding' as AdminTab, label: 'הזמנות מיתוג', icon: Palette },
  { id: 'proofs' as AdminTab, label: 'הוכחות פרסום', icon: Newspaper },
  { id: 'portal' as AdminTab, label: 'פורטל מדיה', icon: Link2 },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('media');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate('/admin-auth');
        } else {
          // Defer admin check
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/admin-auth');
      } else {
        checkAdminRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!data) {
      toast.error('אין לך הרשאות גישה');
      await supabase.auth.signOut();
      navigate('/admin-auth');
      return;
    }

    setIsAdmin(true);
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin-auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-white">טוען...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'media':
        return <MediaDatabaseAdmin />;
      case 'models':
        return <AIModelConfigsAdmin />;
      case 'templates':
        return <TemplateEditor />;
      case 'clients':
        return <ClientOverview />;
      case 'branding':
        return <BrandingOrdersAdmin />;
      case 'proofs':
        return <ProofManagement />;
      case 'portal':
        return <MediaPortalAdmin />;
      default:
        return <MediaDatabaseAdmin />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex" dir="rtl">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-[#111113] border-l border-[#222] flex flex-col transition-all duration-300`}>
        {/* Header */}
        <div className="p-4 border-b border-[#222] flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h1 className="font-bold text-lg">Back Office</h1>
              <p className="text-xs text-[#888]">ממשק ניהול</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-[#222] rounded-lg transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          {TABS.map(tab => {
            // Special case: brain tab navigates to full /brain page
            if (tab.id === 'brain') {
              return (
                <Link
                  key={tab.id}
                  to="/brain"
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 text-[#888] hover:bg-[#1a1a1d] hover:text-white`}
                >
                  <tab.icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span>{tab.label}</span>}
                </Link>
              );
            }
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-[#888] hover:bg-[#1a1a1d] hover:text-white'
                }`}
              >
                <tab.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span>{tab.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#222]">
          <Link to="/dashboard">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg text-[#888] hover:bg-[#1a1a1d] hover:text-white transition-colors mb-2">
              <Settings className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span>חזרה לדשבורד</span>}
            </button>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span>התנתקות</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
