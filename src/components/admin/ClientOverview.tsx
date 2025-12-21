import { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, Calendar, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  created_at: string;
}

const ClientOverview = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading profiles:', error);
    } else {
      setProfiles(data || []);
    }
    setIsLoading(false);
  };

  const filteredProfiles = profiles.filter(profile => {
    const searchLower = searchQuery.toLowerCase();
    return (
      profile.email?.toLowerCase().includes(searchLower) ||
      profile.full_name?.toLowerCase().includes(searchLower) ||
      profile.company_name?.toLowerCase().includes(searchLower)
    );
  });

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">רשימת לקוחות</h1>
          <p className="text-[#888]">כל המשתמשים הרשומים במערכת</p>
        </div>
        <Badge className="bg-[#222] text-lg px-4 py-2">
          <Users className="h-4 w-4 ml-2" />
          {profiles.length} לקוחות
        </Badge>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חיפוש לפי שם, אימייל או חברה..."
          className="pr-10 bg-[#1a1a1d] border-[#333] text-white"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProfiles.map(profile => (
          <Card key={profile.id} className="bg-[#111113] border-[#222] hover:border-[#333] transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 bg-primary/10 text-primary">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(profile.full_name, profile.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">
                    {profile.full_name || 'ללא שם'}
                  </h3>
                  
                  {profile.email && (
                    <div className="flex items-center gap-2 text-sm text-[#888] mt-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{profile.email}</span>
                    </div>
                  )}
                  
                  {profile.company_name && (
                    <div className="flex items-center gap-2 text-sm text-[#888] mt-1">
                      <Building className="h-3 w-3" />
                      <span className="truncate">{profile.company_name}</span>
                    </div>
                  )}
                  
                  {profile.phone && (
                    <div className="flex items-center gap-2 text-sm text-[#888] mt-1">
                      <Phone className="h-3 w-3" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-[#555] mt-2">
                    <Calendar className="h-3 w-3" />
                    <span>הצטרף: {new Date(profile.created_at).toLocaleDateString('he-IL')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProfiles.length === 0 && !isLoading && (
        <Card className="bg-[#111113] border-[#222]">
          <CardContent className="p-8 text-center text-[#888]">
            <Users className="h-12 w-12 mx-auto mb-4 text-[#333]" />
            <p>אין לקוחות להצגה</p>
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

export default ClientOverview;
