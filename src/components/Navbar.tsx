import React from 'react';
import { Radio, Moon, Smartphone, Plus, Info, Sparkles, Clock, Bell, User } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onOpenInstallModal: () => void;
  onOpenSleepTimer: () => void;
  onOpenCustomStream: () => void;
  onOpenBackgroundGuide: () => void;
  onOpenFajrAlarm: () => void;
  userName?: string;
  onOpenUserNameModal?: () => void;
  sleepTimerMinutes: number | null;
  sleepTimerSecondsLeft: number | null;
  isFajrAlarmEnabled: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenInstallModal,
  onOpenSleepTimer,
  onOpenCustomStream,
  onOpenBackgroundGuide,
  onOpenFajrAlarm,
  userName = 'يا عبد الله',
  onOpenUserNameModal,
  sleepTimerMinutes,
  sleepTimerSecondsLeft,
  isFajrAlarmEnabled,
}) => {
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-emerald-950/80 transition-all">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-900 border border-emerald-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-emerald-950/60 shrink-0">
            <Radio className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold text-white tracking-wide">
                أثير الهدى
              </h1>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                مباشر
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              إذاعات إسلامية وإخبارية متواصلة 24/7
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* User Name Badge (Click to customize Fajr Wake-up Name) */}
          {onOpenUserNameModal && (
            <button
              onClick={onOpenUserNameModal}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/40 text-xs font-bold transition shrink-0 cursor-pointer shadow-sm"
              title="تخصيص اسم المنادى في منبه الفجر"
            >
              <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="max-w-[65px] sm:max-w-[110px] truncate">{userName}</span>
            </button>
          )}

          {/* Fajr Alarm Button */}
          <button
            onClick={onOpenFajrAlarm}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer shrink-0 ${
              isFajrAlarmEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-md shadow-amber-500/10'
                : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="منبه صلاة الفجر الذكي مع شروط الاستيقاظ"
          >
            <Bell className={`w-3.5 h-3.5 shrink-0 ${isFajrAlarmEnabled ? 'text-amber-400 animate-pulse' : ''}`} />
            <span className="hidden sm:inline">منبه الفجر</span>
          </button>

          {/* Sleep timer status */}
          <button
            onClick={onOpenSleepTimer}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
              sleepTimerSecondsLeft !== null
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
            title="مؤقت النوم"
          >
            {sleepTimerSecondsLeft !== null ? (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="font-mono text-[11px] font-bold">
                  {formatTime(sleepTimerSecondsLeft)}
                </span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">مؤقت النوم</span>
              </>
            )}
          </button>

          {/* Background audio guide */}
          <button
            onClick={onOpenBackgroundGuide}
            className="p-2 rounded-full bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-800 transition cursor-pointer"
            title="دليل التشغيل في الخلفية وقفل الشاشة"
          >
            <Info className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Add custom radio link */}
          <button
            onClick={onOpenCustomStream}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-medium transition cursor-pointer"
            title="إضافة رابط إذاعة مخصصة"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>رابط مخصص</span>
          </button>

          {/* Test on Phone / Download PWA */}
          <button
            onClick={onOpenInstallModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
            title="تحميل وتجربة التطبيق على الموبايل"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline">تجربة على الموبايل</span>
          </button>

          {/* Direct Install PWA button */}
          <PWAInstallButton onOpenMobileGuide={onOpenInstallModal} variant="header" />
        </div>
      </div>
    </header>
  );
};
