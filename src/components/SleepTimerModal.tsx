import React from 'react';
import { Moon, X, Clock, Check } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMinutes: number | null;
  secondsLeft: number | null;
  onSetTimer: (minutes: number | null) => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  activeMinutes,
  secondsLeft,
  onSetTimer,
}) => {
  if (!isOpen) return null;

  const timerOptions = [15, 30, 45, 60, 90];

  const formatTimeLeft = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm bg-slate-900 border border-emerald-700/40 rounded-3xl p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Moon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">مؤقت النوم الذكي</h3>
            <p className="text-xs text-slate-400">إيقاف تشغيل الإذاعة تلقائياً قبل النوم</p>
          </div>
        </div>

        {secondsLeft !== null && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-950/70 border border-emerald-600/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-emerald-400 animate-pulse" />
              <div>
                <span className="text-xs text-slate-300">الوقت المتبقي للإيقاف:</span>
                <p className="text-lg font-bold text-white font-mono">{formatTimeLeft(secondsLeft)}</p>
              </div>
            </div>
            <button
              onClick={() => onSetTimer(null)}
              className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-semibold border border-red-500/40 transition cursor-pointer"
            >
              إلغاء المؤقت
            </button>
          </div>
        )}

        <div className="space-y-2 mb-6">
          <p className="text-xs font-medium text-slate-400 mb-2">اختر مدة الاستماع:</p>
          {timerOptions.map((minutes) => {
            const isSelected = activeMinutes === minutes;
            return (
              <button
                key={minutes}
                onClick={() => {
                  onSetTimer(minutes);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-sm font-semibold transition cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-200 border-slate-700/60'
                }`}
              >
                <span>{minutes} دقيقة</span>
                {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          * يتم خفض الصوت تدريجياً في آخر 20 ثانية لنوم هادئ ومريح دون إزعاج.
        </p>
      </div>
    </div>
  );
};
