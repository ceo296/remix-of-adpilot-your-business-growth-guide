import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Rocket, Mail, Lock, User, ArrowRight, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'שם מלא חייב להכיל לפחות 2 תווים'),
});

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');

  const redirectPath = searchParams.get('redirect') || '/dashboard';

  // Redirect if already logged in OR if admin (wait for auth to finish loading)
  useEffect(() => {
    if (authLoading || adminLoading) return;
    
    // Admins go straight through
    if (isAdmin) {
      navigate(redirectPath, { replace: true });
      return;
    }
    
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, adminLoading, user, isAdmin, navigate, redirectPath]);

  // Show loading while checking auth/admin status
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('אימייל או סיסמה שגויים');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('התחברת בהצלחה!');
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signupSchema.safeParse({ 
      email: signupEmail, 
      password: signupPassword, 
      fullName: signupName 
    });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    
    if (error) {
      if (error.message.includes('User already registered')) {
        toast.error('משתמש עם אימייל זה כבר קיים');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('נרשמת בהצלחה! מעביר אותך לתהליך ההרשמה...');
      navigate('/onboarding');
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailValidation = z.string().email('כתובת אימייל לא תקינה').safeParse(forgotEmail);
    if (!emailValidation.success) {
      toast.error(emailValidation.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });
    
    if (error) {
      toast.error('שגיאה בשליחת המייל. נסה שוב.');
    } else {
      toast.success('מייל לאיפוס סיסמה נשלח! בדוק את תיבת הדואר שלך.');
      setShowForgotPassword(false);
      setForgotEmail('');
    }
    setIsLoading(false);
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Rocket className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <span className="text-2xl font-bold text-foreground">AdPilot</span>
                <span className="text-sm text-muted-foreground mr-2">| בס״ד</span>
              </div>
            </div>
          </div>

          <Card className="border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">שכחת סיסמה?</CardTitle>
              <CardDescription>נשלח לך מייל לאיפוס הסיסמה</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">אימייל</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="pr-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" variant="gradient" className="w-full" disabled={isLoading}>
                  {isLoading ? 'שולח...' : 'שלח מייל איפוס'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => setShowForgotPassword(false)}
                >
                  <ArrowRight className="w-4 h-4 ml-2" />
                  חזרה להתחברות
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Rocket className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-2xl font-bold text-foreground">AdPilot</span>
              <span className="text-sm text-muted-foreground mr-2">| בס״ד</span>
            </div>
          </div>
          <p className="text-muted-foreground">פרסום חכם למגזר שלנו</p>
        </div>

        <Card className="border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">ברוכים הבאים!</CardTitle>
            <CardDescription>התחבר או הירשם כדי להתחיל</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">התחברות</TabsTrigger>
                <TabsTrigger value="signup">הרשמה</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">אימייל</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">סיסמה</Label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        שכחתי סיסמה
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" variant="gradient" className="w-full" disabled={isLoading}>
                    {isLoading ? 'מתחבר...' : 'התחבר'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">שם מלא</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="ישראל ישראלי"
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">אימייל</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">סיסמה</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="לפחות 6 תווים"
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" variant="gradient" className="w-full" disabled={isLoading}>
                    {isLoading ? 'נרשם...' : 'הירשם'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            {/* Dev-only: Quick Admin Login */}
            {import.meta.env.DEV && (
              <div className="mt-6 pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 text-muted-foreground hover:text-foreground"
                  onClick={async () => {
                    setIsLoading(true);
                    const { error } = await signIn('admin@adpilot.dev', 'admin123');
                    if (error) {
                      toast.error('שגיאה בכניסת אדמין: ' + error.message);
                    } else {
                      toast.success('מחובר כאדמין!');
                      navigate('/admin-dashboard');
                    }
                    setIsLoading(false);
                  }}
                  disabled={isLoading}
                >
                  <Shield className="w-4 h-4" />
                  כניסת אדמין מהירה (פיתוח)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
