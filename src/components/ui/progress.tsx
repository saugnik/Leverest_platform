'use client';

import { cn, getStageColor, getStageLabel } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  color?: 'gold' | 'emerald' | 'blue' | 'red';
  size?: 'sm' | 'md' | 'lg';
}

const colorMap = {
  gold: 'from-amber-600 to-amber-400',
  emerald: 'from-emerald-600 to-emerald-400',
  blue: 'from-blue-600 to-blue-400',
  red: 'from-red-600 to-red-400',
};

const sizeMap = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2.5',
};

export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
  color = 'gold',
  size = 'md',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1.5">
          <span className="text-xs text-slate-500">Completion</span>
          <span className="text-xs font-semibold text-amber-400">{pct}%</span>
        </div>
      )}
      <div className={cn('progress-bar-track', sizeMap[size])}>
        <div
          className={cn('progress-bar-fill bg-gradient-to-r', colorMap[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface StageProgressProps {
  currentStage: string;
}

const STAGES = [
  'lead_received',
  'meeting_done',
  'documents_requested',
  'internal_processing',
  'bank_connect',
  'proposal_sent',
  'bank_document_stage',
  'approved',
];

export function StageProgress({ currentStage }: StageProgressProps) {
  const currentIdx = STAGES.indexOf(currentStage);

  return (
    <div className="flex items-center gap-0">
      {STAGES.map((stage, idx) => {
        const isComplete = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const colorClass = getStageColor(stage);

        return (
          <div key={stage} className="flex items-center flex-1">
            <div className="relative group flex-1">
              <div
                className={cn(
                  'h-1.5 rounded-full transition-all duration-500',
                  isComplete ? 'bg-amber-400' : isCurrent ? 'bg-amber-400/50' : 'bg-white/8'
                )}
              />
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <div className="bg-[#0F1E35] text-xs text-[#94A3C0] border border-white/10 rounded px-2 py-1 whitespace-nowrap">
                  {getStageLabel(stage)}
                </div>
              </div>
            </div>
            {idx < STAGES.length - 1 && (
              <div className="w-0.5 h-0.5 rounded-full bg-white/10 mx-0.5" />
            )}
          </div>
        );
      })}
    </div>
  );
}
