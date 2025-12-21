import { Button } from '@/components/ui/button';
import { Rocket, ArrowLeft, CheckCircle, Zap, Shield, Dna, Sparkles, Target, Settings, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-bold text-foreground">AdPilot</span>
              <span className="text-sm text-muted-foreground mr-2">| מגזר חרדי</span>
            </div>
          </div>
          <Link to="/onboarding">
            <Button variant="default" size="default">
              יוצאים לדרך!
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            בס״ד | פרסום חכם למגזר שלנו
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            שלום עליכם!
            <span className="text-gradient block mt-2">זה הולך להיות גישמאק</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            מתכנן מדיה + ארט-דירקטור בפלטפורמה אחת, בסייעתא דשמיא. 
            בחר קהל, סגנון וערוצי מדיה – ואנחנו נבנה לך קמפיין מהמם.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/onboarding">
              <Button variant="gradient" size="xl">
                מתחילים בסייעתא דשמיא
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="xl">
                לוח בקרה
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            תהליך מבוסס AI
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            אתם תביאו את החלום, המערכת תבנה את המציאות
          </h2>
        </div>
        
        <div className="relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-24 right-[12%] left-[12%] h-0.5 bg-gradient-to-l from-primary/20 via-primary to-primary/20" />
          
          <div className="grid md:grid-cols-4 gap-8 md:gap-6">
            {[
              {
                step: '1',
                icon: Dna,
                title: 'לומדים אתכם לעומק',
                description: 'המערכת סורקת את האתר, מנתחת את המתחרים ומזקקת את הבידול המדויק שלכם.',
                hasPulse: false,
              },
              {
                step: '2',
                icon: Sparkles,
                title: 'הסטודיו האוטונומי נכנס לפעולה',
                description: 'בחירת מסלול (סדרה/בודד) וייצור מודעות מושלמות עם טקסט חי בעברית.',
                hasPulse: true,
              },
              {
                step: '3',
                icon: Target,
                title: 'שידוך מדיה חכם',
                description: 'האלגוריתם מסנן את העיתונים והאתרים לפי המגזר המדויק והתקציב שלכם.',
                hasPulse: false,
              },
              {
                step: '4',
                icon: Rocket,
                title: 'משגרים ורואים תוצאות',
                description: 'הקמפיין באוויר. אתם מקבלים \'לוח הוכחות\' עם גזרי עיתונים וצילומי מסך בזמן אמת.',
                hasPulse: false,
              },
            ].map((item, index) => (
              <div 
                key={item.step}
                className="relative group"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Card */}
                <div className="relative bg-card rounded-2xl border border-border p-6 text-center shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 animate-fade-in">
                  {/* Step number badge */}
                  <div className="absolute -top-4 right-4 w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm shadow-lg">
                    {item.step}
                  </div>
                  
                  {/* Icon container with pulse */}
                  <div className={`relative w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 mt-2 ${item.hasPulse ? 'animate-pulse' : ''}`}>
                    {item.hasPulse && (
                      <>
                        <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                        <div className="absolute -inset-1 rounded-2xl bg-primary/10 animate-pulse" />
                      </>
                    )}
                    <item.icon className="w-8 h-8 text-primary relative z-10" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
                
                {/* Arrow connector for mobile */}
                {index < 3 && (
                  <div className="md:hidden flex justify-center my-4">
                    <ChevronLeft className="w-6 h-6 text-primary rotate-[-90deg]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: CheckCircle,
              title: 'קטלוג מדיה חכם',
              description: 'כל העיתונים והאתרים של הציבור שלנו, מסודר יפה.',
            },
            {
              icon: Zap,
              title: 'סגנונות מוכנים',
              description: 'בחר VIBE ונעצב לך קריאייטיב גישמאק.',
            },
            {
              icon: Shield,
              title: 'ליווי מלא',
              description: 'מהבריף ועד לפרסום – אנחנו מטפלים בהכל, בעזה״י.',
            },
          ].map((feature, index) => (
            <div 
              key={feature.title}
              className="bg-card rounded-xl border border-border p-6 text-center hover:shadow-lg transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">מוכנים להתחיל?</h2>
          <p className="text-lg opacity-90 mb-6">4 שלבים פשוטים – ואנחנו נעשה את השאר בעזה״י</p>
          <Link to="/onboarding">
            <Button 
              variant="secondary" 
              size="xl"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              יוצאים לדרך!
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-foreground text-background">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© תשפ״ה AdPilot - מגזר חרדי. כל הזכויות שמורות.</p>
          <Link to="/admin-auth" className="flex items-center gap-2 text-muted hover:text-background transition-colors text-sm">
            <Settings className="w-4 h-4" />
            Back Office
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Index;
