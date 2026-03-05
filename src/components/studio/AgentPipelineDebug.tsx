import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, XCircle, Clock, ChevronDown, ChevronUp, Brain, Palette, Shield, Sparkles, Database, Send, RefreshCw, Lightbulb, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type AgentStepStatus = 'pending' | 'running' | 'done' | 'error' | 'skipped' | 'rejected' | 'retrying';

export interface AgentStep {
  id: string;
  agent: string;
  label: string;
  icon: 'brain' | 'palette' | 'shield' | 'sparkles' | 'database' | 'send' | 'retry' | 'lesson';
  status: AgentStepStatus;
  startedAt?: number;
  completedAt?: number;
  details?: string;
  input?: string;
  output?: string;
  error?: string;
}

const AGENT_ICONS = {
  brain: Brain,
  palette: Palette,
  shield: Shield,
  sparkles: Sparkles,
  database: Database,
  send: Send,
  retry: RefreshCw,
  lesson: Lightbulb,
};

const STATUS_COLORS: Record<AgentStepStatus, string> = {
  pending: 'text-muted-foreground',
  running: 'text-primary',
  done: 'text-emerald-500',
  error: 'text-destructive',
  skipped: 'text-muted-foreground/50',
  rejected: 'text-amber-500',
  retrying: 'text-orange-500',
};

interface AgentPipelineDebugProps {
  steps: AgentStep[];
  isVisible: boolean;
}

export const AgentPipelineDebug = ({ steps, isVisible }: AgentPipelineDebugProps) => {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest running step
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps]);

  if (!isVisible || steps.length === 0) return null;

  const completedCount = steps.filter(s => s.status === 'done').length;
  const errorCount = steps.filter(s => s.status === 'error').length;
  const runningStep = steps.find(s => s.status === 'running');
  const totalElapsed = steps.reduce((acc, s) => {
    if (s.startedAt && s.completedAt) return acc + (s.completedAt - s.startedAt);
    return acc;
  }, 0);

  return (
    <Card className="border-2 border-primary/20 bg-card/95 backdrop-blur-sm overflow-hidden" dir="rtl">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold">צינור סוכנים — מאחורי הקלעים</h3>
            <p className="text-xs text-muted-foreground">
              {runningStep ? `⚡ ${runningStep.label}...` : 
               errorCount > 0 ? `❌ ${errorCount} שגיאות` :
               completedCount === steps.length ? `✅ הושלם ב-${(totalElapsed / 1000).toFixed(1)} שניות` :
               'ממתין...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {completedCount}/{steps.length}
          </Badge>
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>
      </div>

      {/* Pipeline Steps */}
      {!isCollapsed && (
        <div className="px-4 pb-4 space-y-1">
          {steps.map((step, index) => {
            const Icon = AGENT_ICONS[step.icon];
            const isExpanded = expandedStep === step.id;
            const elapsed = step.startedAt && step.completedAt 
              ? ((step.completedAt - step.startedAt) / 1000).toFixed(1) 
              : step.startedAt && step.status === 'running'
              ? null
              : null;

            return (
              <div key={step.id}>
                {/* Step Row */}
                <div 
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg transition-all cursor-pointer",
                    step.status === 'running' && "bg-primary/5 border border-primary/20",
                    step.status === 'retrying' && "bg-orange-500/5 border border-orange-500/20",
                    step.status === 'done' && "bg-emerald-500/5",
                    step.status === 'error' && "bg-destructive/5",
                    step.status === 'rejected' && "bg-amber-500/5 border border-amber-500/20",
                    step.status === 'pending' && "opacity-50",
                    (step.details || step.input || step.output || step.error) && "hover:bg-muted/50"
                  )}
                  onClick={() => {
                    if (step.details || step.input || step.output || step.error) {
                      setExpandedStep(isExpanded ? null : step.id);
                    }
                  }}
                >
                  {/* Status Icon */}
                  <div className={cn("flex-shrink-0", STATUS_COLORS[step.status])}>
                    {step.status === 'running' || step.status === 'retrying' ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : step.status === 'done' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : step.status === 'error' ? (
                      <XCircle className="h-5 w-5" />
                    ) : step.status === 'rejected' ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>

                  {/* Agent Icon */}
                  <div className={cn(
                    "w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0",
                    step.status === 'running' ? "bg-primary/20" : "bg-muted"
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      step.status === 'pending' && "text-muted-foreground"
                    )}>
                      {step.label}
                    </p>
                    {step.status === 'running' && step.details && (
                      <p className="text-xs text-muted-foreground animate-pulse truncate">{step.details}</p>
                    )}
                  </div>

                  {/* Timing */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {elapsed && (
                      <span className="text-xs text-muted-foreground">{elapsed}s</span>
                    )}
                    {step.status === 'running' && (
                      <RunningTimer startedAt={step.startedAt!} />
                    )}
                    {(step.details || step.input || step.output || step.error) && step.status !== 'pending' && (
                      <ChevronDown className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-180")} />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mr-12 mt-1 mb-2 p-3 rounded-lg bg-muted/50 border border-border text-xs space-y-2 max-h-48 overflow-y-auto">
                    {step.input && (
                      <div>
                        <span className="font-semibold text-primary">קלט:</span>
                        <pre className="mt-1 whitespace-pre-wrap text-muted-foreground font-mono text-[10px] leading-relaxed">{step.input}</pre>
                      </div>
                    )}
                    {step.output && (
                      <div>
                        <span className="font-semibold text-emerald-600">פלט:</span>
                        <pre className="mt-1 whitespace-pre-wrap text-muted-foreground font-mono text-[10px] leading-relaxed">{step.output}</pre>
                      </div>
                    )}
                    {step.details && !step.input && !step.output && (
                      <pre className="whitespace-pre-wrap text-muted-foreground font-mono text-[10px] leading-relaxed">{step.details}</pre>
                    )}
                    {step.error && (
                      <div>
                        <span className="font-semibold text-destructive">שגיאה:</span>
                        <pre className="mt-1 whitespace-pre-wrap text-destructive/80 font-mono text-[10px]">{step.error}</pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="mr-[18px] h-2 border-r-2 border-dashed border-border" />
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}
    </Card>
  );
};

// Live timer component
const RunningTimer = ({ startedAt }: { startedAt: number }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(((Date.now() - startedAt) / 1000));
    }, 100);
    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <span className="text-xs text-primary font-mono tabular-nums">{elapsed.toFixed(1)}s</span>
  );
};
