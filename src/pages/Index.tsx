import { Button } from '@/components/ui/button';
import { Rocket, ArrowLeft, CheckCircle, Zap, Shield } from 'lucide-react';
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
            <span className="text-xl font-bold text-foreground">AdPilot</span>
          </div>
          <Link to="/onboarding">
            <Button variant="default" size="default">
              התחל עכשיו
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            פרסום אוטומטי לעסקים
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            הגדל את העסק שלך
            <span className="text-gradient block mt-2">בלי לגעת בדבר</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AdPilot מנהלת את הפרסום שלך באופן אוטומטי לחלוטין. 
            פשוט ספר לנו על העסק שלך, ואנחנו נדאג לכל השאר.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/onboarding">
              <Button variant="gradient" size="xl">
                התחל בחינם
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="xl">
                צפה בדמו
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: CheckCircle,
              title: 'פשוט להפליא',
              description: 'ללא מונחים מסובכים. רק תוצאות שאתה מבין.',
            },
            {
              icon: Zap,
              title: 'אופטימיזציה אוטומטית',
              description: 'המערכת משפרת את הקמפיינים שלך 24/7.',
            },
            {
              icon: Shield,
              title: 'שליטה מלאה',
              description: 'אתה תמיד יודע מה קורה עם הכסף שלך.',
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
          <h2 className="text-2xl md:text-3xl font-bold mb-4">מוכן להגדיל את העסק?</h2>
          <p className="text-lg opacity-90 mb-6">התחל עכשיו וקבל לידים ראשונים תוך 48 שעות</p>
          <Link to="/onboarding">
            <Button 
              variant="secondary" 
              size="xl"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              התחל בחינם
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 AdPilot. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
