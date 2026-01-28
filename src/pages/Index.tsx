import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Rocket, ArrowLeft, Zap, Settings, Info, ChefHat, CalendarDays, X, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

const Index = () => {
  const steps = [
    {
      step: '1',
      icon: Zap,
      title: 'עושים סדר באסטרטגיה',
      description: 'אנחנו לוקחים את המידע שבידיכם, מחדדים את היתרונות שלכם, והופכים את הידע הגולמי שלכם לבריף פרסומי מנצח.',
    },
    {
      step: '2',
      icon: ChefHat,
      title: 'קריאייטיב שמרגיש \'משלנו\'',
      description: 'עיצוב וקופירייטינג שנוצרים במיוחד למגזר. המערכת דואגת שהשפה תהיה מדויקת, צנועה ומותאמת לקהל היעד.',
    },
    {
      step: '3',
      icon: CalendarDays,
      title: 'כל המדיה במקום אחד',
      description: 'במקום לרדוף אחרי נציגי מכירות בעיתונים ובאתרים – הכל מרוכז לכם מול העיניים. בוחרים איפה לפרסם, רואים מחירים, ומתקדמים בלחיצת כפתור.',
    },
    {
      step: '4',
      icon: Rocket,
      title: 'שיגור',
      description: 'סוגרים עסקה, והמודעה בדרך לפרסום. חסכנו לכם את הטלפונים, הבירוקרטיה וההמתנה. פשוט לעבור.',
    },
    {
      step: '5',
      icon: BarChart3,
      title: 'סטטוס קמפיין בכל רגע נתון',
      description: 'כמה מהתקציב נוצל, איפה כבר פורסם ואיפה עתיד להתפרסם – הכל שקוף מול העיניים.',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight">
              <span className="logo-black">AD</span>
              <span className="logo-red">KOP</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="default">
                  <Info className="w-4 h-4 ml-2" />
                  אודות
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-2xl text-right">?ADKOP מה זה</SheetTitle>
                </SheetHeader>
                
                <div className="space-y-6 text-right">
                  <div className="bg-primary/10 rounded-xl p-4">
                    <p className="text-lg font-medium text-foreground mb-2">
                      לפצח את המגזר החרדי – בלי ריטיינר, בלי התחייבות, ובלי כאבי ראש.
                    </p>
                    <p className="text-muted-foreground">
                      הכירו את ADKOP: הפלטפורמה שמרכזת לכם את כל תהליך הפרסום במקום אחד. 
                      מאסטרטגיה ועד מודעה בעיתון – הכל קורה כאן, בקצב שלכם.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold mb-4">איך זה עובד?</h3>
                    <div className="space-y-4">
                      {steps.map((item) => (
                        <div key={item.step} className="flex gap-4 items-start">
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm shrink-0">
                            {item.step}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4">
                    <h3 className="font-bold mb-2">למה דווקא ADKOP?</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>✓ הכל במקום אחד – מאסטרטגיה ועד פרסום</li>
                      <li>✓ שפה ועיצוב מותאמים למגזר</li>
                      <li>✓ שקיפות במחירים ובתהליך</li>
                      <li>✓ בלי לרוץ בין ספקים</li>
                    </ul>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Link to="/auth">
              <Button variant="default" size="default">
                כניסה למערכת
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Clean and centered */}
      <section className="flex-1 flex items-center justify-center container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            שלום עליכם!
            <span className="text-gradient block mt-2">זה הולך להיות גישמאק</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            לפרסם לקהל החרדי כבר לא מסובך כמו להכין קוגל ירושלמי,
            הכל פה זז מהר כמו גאלע
          </p>
          
          <div className="flex justify-center">
            <Link to="/onboarding">
              <Button variant="gradient" size="xl">
                מתחילים בסיעתא דשמיא
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
          </div>
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
