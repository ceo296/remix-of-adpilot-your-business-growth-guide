import { NavLink } from '@/components/NavLink';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Megaphone, 
  Rocket, 
  Settings, 
  HelpCircle,
  LogOut,
  Users,
  Shield,
  Brain
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAgencyClients } from '@/hooks/useAgencyClients';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import ClientSelector from './ClientSelector';
import AdminClientSelector from './AdminClientSelector';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const TopNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAgency } = useAgencyClients();
  const { signOut, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [clientLogo, setClientLogo] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
    const fetchClientLogo = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('client_profiles')
        .select('logo_url, business_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setClientName(data.business_name);
        // Only set logo if it's a renderable image (not PDF)
        if (data.logo_url && !data.logo_url.toLowerCase().includes('application/pdf') && !data.logo_url.toLowerCase().endsWith('.pdf')) {
          setClientLogo(data.logo_url);
        }
      }
    };
    fetchClientLogo();
  }, [user]);

  const menuItems = [
    { title: 'לוח בקרה', url: '/dashboard', icon: LayoutDashboard },
    { title: 'קמפיין חדש', url: '/new-campaign', icon: Megaphone },
    { title: 'סטודיו יצירתי', url: '/studio', icon: Rocket },
    ...(isAgency ? [{ title: 'ניהול לקוחות', url: '/clients', icon: Users }] : []),
    ...(isAdmin ? [
      { title: 'מוח', url: '/brain', icon: Brain },
      { title: 'ממשק ניהול', url: '/admin-dashboard', icon: Shield },
    ] : []),
    { title: 'פרופיל', url: '/profile', icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="h-16 border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto h-full px-4 flex items-center gap-4">
        {/* Logo - Fixed width */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl md:text-2xl font-bold tracking-tight">
            <span className="logo-black">AD</span>
            <span className="logo-red">KOP</span>
          </span>
          <span className="text-xs text-muted-foreground hidden sm:block">| בס״ד</span>
        </div>

        {/* Navigation - Centered with flex-1 */}
        <nav className="flex-1 flex items-center justify-center gap-1 md:gap-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              className={`
                flex items-center gap-1.5 px-2 md:px-3 py-2 rounded-lg transition-all duration-200 text-sm whitespace-nowrap
                ${isActive(item.url) 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }
              `}
            >
              <item.icon className="w-4 h-4" />
              <span className="font-medium hidden md:inline">{item.title}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right side - Admin selector, Agency selector & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Client Logo */}
          {clientLogo && (
            <img 
              src={clientLogo} 
              alt={clientName || 'לוגו'} 
              className="w-8 h-8 object-contain rounded"
              style={{ mixBlendMode: 'multiply' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          {isAdmin && (
            <div className="hidden md:block">
              <AdminClientSelector />
            </div>
          )}
          {isAgency && !isAdmin && (
            <div className="hidden lg:block">
              <ClientSelector />
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <HelpCircle className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-card border border-border z-50">
              <DropdownMenuItem className="cursor-pointer">
                <HelpCircle className="w-4 h-4 ml-2" />
                עזרה ותמיכה
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                <LogOut className="w-4 h-4 ml-2" />
                יציאה
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
