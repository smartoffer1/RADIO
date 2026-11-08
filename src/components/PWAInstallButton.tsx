import React from 'react';
import { Download, Smartphone, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenMobileGuide?: () => void;
  variant?: 'header' | 'banner' | 'pill';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onOpenMobileGuide,
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (isInstalled) {
    if (variant === 'pill') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 text-xs font-medium">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          تطبيق مثبت
        </span>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    // If browser supports native PWA install directly (e.g. running outside iframe), invoke it
    if (isInstallable) {
      const outcome = await install();
      if (!outcome && onOpenMobileGuide) {
        onOpenMobileGuide();
      }
    } else if (onOpenMobileGuide) {
      onOpenMobileGuide();
    }
  };

  if (variant === 'banner') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900/90 via-teal-900/80 to-slate-900 border border-emerald-700/50 p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                تثبيت التطبيق على هاتف Android
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500 text-slate-950">
                  تشغيل في الخلفية
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                تثبيت التطبيق على هاتفك كتطبيق أصلي، واستمع للإذاعات عند قفل الشاشة بدون تقطيع.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleInstallClick}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تحميل وتثبيت التطبيق</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Header button
  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/10 active:scale-95 transition-all cursor-pointer"
      title={isIOS ? 'طريقة تثبيت التطبيق على الآيفون' : 'تثبيت التطبيق على الأندرويد'}
    >
      <Download className="w-3.5 h-3.5" />
      <span>تحميل التطبيق</span>
    </button>
  );
};
