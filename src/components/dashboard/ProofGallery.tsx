import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Images, Newspaper, Monitor, X, ZoomIn } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProofItem {
  id: string;
  type: 'newspaper' | 'digital';
  title: string;
  date: string;
  image: string;
}

const mockProofs: ProofItem[] = [
  { id: '1', type: 'newspaper', title: 'יתד נאמן - עמוד 7', date: '18/12', image: '/placeholder.svg' },
  { id: '2', type: 'digital', title: 'כיכר השבת - באנר', date: '17/12', image: '/placeholder.svg' },
  { id: '3', type: 'newspaper', title: 'המודיע - עמוד שלם', date: '16/12', image: '/placeholder.svg' },
  { id: '4', type: 'newspaper', title: 'משפחה - רבע עמוד', date: '15/12', image: '/placeholder.svg' },
  { id: '5', type: 'digital', title: 'בחדרי חרדים - פופאפ', date: '14/12', image: '/placeholder.svg' },
  { id: '6', type: 'newspaper', title: 'המבשר - חצי עמוד', date: '13/12', image: '/placeholder.svg' },
];

const ProofGallery = () => {
  const [selectedProof, setSelectedProof] = useState<ProofItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'newspaper' | 'digital'>('all');

  const filteredProofs = mockProofs.filter(
    p => filter === 'all' || p.type === filter
  );

  const newspaperCount = mockProofs.filter(p => p.type === 'newspaper').length;
  const digitalCount = mockProofs.filter(p => p.type === 'digital').length;

  return (
    <>
      <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Images className="w-5 h-5 text-primary" />
              גזירי עיתונים וצילומי מסך
            </h3>
            <div className="flex gap-2">
              <Badge 
                variant={filter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('all')}
              >
                הכל ({mockProofs.length})
              </Badge>
              <Badge 
                variant={filter === 'newspaper' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('newspaper')}
              >
                📰 עיתונים ({newspaperCount})
              </Badge>
              <Badge 
                variant={filter === 'digital' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('digital')}
              >
                💻 דיגיטל ({digitalCount})
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {filteredProofs.map((proof) => (
              <div
                key={proof.id}
                className="group relative aspect-square rounded-lg overflow-hidden border border-border cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedProof(proof)}
              >
                <img
                  src={proof.image}
                  alt={proof.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                  <div className="flex items-center gap-1 text-white text-xs">
                    {proof.type === 'newspaper' ? (
                      <Newspaper className="w-3 h-3" />
                    ) : (
                      <Monitor className="w-3 h-3" />
                    )}
                    <span className="truncate">{proof.title}</span>
                  </div>
                </div>
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-4 h-4 text-white drop-shadow" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              צפה בכל ההוכחות
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedProof} onOpenChange={() => setSelectedProof(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedProof?.type === 'newspaper' ? (
                <Newspaper className="w-5 h-5" />
              ) : (
                <Monitor className="w-5 h-5" />
              )}
              {selectedProof?.title}
              <span className="text-sm text-muted-foreground font-normal">
                | {selectedProof?.date}
              </span>
            </DialogTitle>
          </DialogHeader>
          {selectedProof && (
            <div className="mt-4">
              <img
                src={selectedProof.image}
                alt={selectedProof.title}
                className="w-full rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProofGallery;
