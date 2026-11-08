import React, { useState } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Share2,
  Heart,
  Radio,
  Sparkles,
  Loader2,
  ShieldCheck,
  Check,
  RotateCw,
} from 'lucide-react';
import { RadioStation, PlaybackStatus } from '../types/radio';
import { AudioVisualizer } from './AudioVisualizer';

interface FullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  currentStation: RadioStation;
  playbackStatus: PlaybackStatus;
  volume: number;
  isMuted: boolean;
  isFavorite: boolean;
  sleepTimerSecondsLeft: number | null;
  isWakeLockActive: boolean;
  usingBackupIndex: number;
  errorMessage: string | null;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleMute: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleFavorite: (id: string) => void;
  onOpenSleepTimer: () => void;
  onToggleWakeLock: () => void;
  onSwitchStream: (backupIdx: number) => void;
  onOpenBackgroundGuide: () => void;
}

export const FullscreenPlayer: React.FC<FullscreenPlayerProps> = ({
  isOpen,
  onClose,
  currentStation,
  playbackStatus,
  volume,
  isMuted,
  isFavorite,
  sleepTimerSecondsLeft,
  isWakeLockActive,
  usingBackupIndex,
  errorMessage,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleMute,
  onVolumeChange,
  onToggleFavorite,
  onOpenSleepTimer,
  onToggleWakeLock,
  onSwitchStream,
  onOpenBackgroundGuide,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);

  if (!isOpen) return null;

  const isPlaying = playbackStatus === 'playing';
  const isLoading = playbackStatus === 'loading';

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleShare = async () => {
    const shareData = {
      title: currentStation.name,
      text: `استمع الآن إلى ${currentStation.name} على تطبيق أثير الهدى:`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // ignore
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const backupCount = currentStation.backupStreamUrls?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950/95 backdrop-blur-2xl text-slate-100 overflow-y-auto animate-fadeIn select-none p-4 sm:p-6 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]">
      {/* Ambient background glow matching album */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 blur-3xl"
        style={{
          backgroundImage: `url(${currentStation.logo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Top Navigation Bar */}
      <div className="relative z-10 max-w-lg mx-auto w-full flex items-center justify-between mb-4">
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
          title="تصغير المشغل"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center">
          <span className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            مشغل البث الحي المباشر
          </span>
          <p className="text-[11px] text-slate-400">خاصية التشغيل بالخلفية نشطة</p>
        </div>

        <button
          onClick={handleShare}
          className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
          title="مشاركة الإذاعة"
        >
          {copiedShare ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Body */}
      <div className="relative z-10 max-w-md mx-auto w-full my-auto flex flex-col items-center text-center">
        {/* Album Artwork with gold ring */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden p-1.5 bg-gradient-to-tr from-amber-500/40 via-emerald-500/30 to-amber-400/50 shadow-2xl shadow-emerald-950/80 mb-6">
          <div className="w-full h-full rounded-[22px] overflow-hidden bg-slate-900 relative">
            <img
              src={currentStation.logo}
              alt={currentStation.name}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-105' : 'scale-100 opacity-90'
              }`}
            />
            {/* Live badge overlay */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-xs font-bold text-emerald-300 border border-emerald-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{currentStation.frequency || 'بث مباشر'}</span>
            </div>

            {/* Favorite toggle overlay */}
            <button
              onClick={() => onToggleFavorite(currentStation.id)}
              className="absolute top-3 left-3 p-2.5 rounded-full bg-slate-950/70 backdrop-blur-md text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Station Title & Location */}
        <div className="mb-4 w-full">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide mb-1">
            {currentStation.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">{currentStation.subtitle}</p>
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mt-1">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>{currentStation.location}</span>
          </p>
        </div>

        {/* Error / Fallback message banner */}
        {errorMessage && (
          <div className="mb-4 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs text-center animate-pulse">
            {errorMessage}
          </div>
        )}

        {/* Visualizer */}
        <div className="my-2 w-full">
          <AudioVisualizer isPlaying={isPlaying} isLoading={isLoading} barsCount={24} barColor="bg-amber-400" />
        </div>

        {/* Stream Server Selector if backups exist */}
        {backupCount > 0 && (
          <div className="my-3 flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">خادم البث:</span>
            <button
              onClick={() => onSwitchStream(-1)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                usingBackupIndex === -1
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              الرئيسي
            </button>
            {currentStation.backupStreamUrls?.map((_, idx) => (
              <button
                key={idx}
                onClick={() => onSwitchStream(idx)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                  usingBackupIndex === idx
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                بديل #{idx + 1}
              </button>
            ))}
          </div>
        )}

        {/* Big Player Controls */}
        <div className="flex items-center justify-center gap-6 my-4 w-full">
          <button
            onClick={onPrevious}
            className="p-3 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/60 active:scale-90 transition cursor-pointer"
            title="المحطة السابقة"
          >
            <SkipForward className="w-7 h-7" />
          </button>

          <button
            onClick={onTogglePlay}
            className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl transition-all active:scale-95 cursor-pointer ${
              isPlaying
                ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-amber-500/40 ring-4 ring-amber-400/30'
                : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-900/50 ring-4 ring-emerald-500/20'
            }`}
            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            {isLoading ? (
              <Loader2 className="w-9 h-9 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-9 h-9 fill-current" />
            ) : (
              <Play className="w-9 h-9 fill-current translate-x-[-2px]" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-3 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/60 active:scale-90 transition cursor-pointer"
            title="المحطة التالية"
          >
            <SkipBack className="w-7 h-7" />
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-3 w-full max-w-xs my-2">
          <button
            onClick={onToggleMute}
            className="p-2 text-slate-400 hover:text-white transition cursor-pointer"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-red-400" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <span className="text-[11px] font-mono text-slate-400 w-8 text-left">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>

        {/* Quick Utility Actions (Sleep Timer & Wake Lock) */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={onOpenSleepTimer}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
              sleepTimerSecondsLeft !== null
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {sleepTimerSecondsLeft !== null
                ? `مؤقت: ${formatTime(sleepTimerSecondsLeft)}`
                : 'مؤقت النوم'}
            </span>
          </button>

          <button
            onClick={onToggleWakeLock}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
              isWakeLockActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
            title="منع انطفاء الشاشة"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>{isWakeLockActive ? 'الشاشة مضاءة' : 'إبقاء الشاشة'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Guarantee Banner */}
      <div className="relative z-10 max-w-lg mx-auto w-full mt-4">
        <button
          onClick={onOpenBackgroundGuide}
          className="w-full p-2.5 rounded-2xl bg-slate-900/90 border border-emerald-800/50 hover:border-emerald-700 flex items-center justify-between gap-2 text-xs text-emerald-200 transition cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">الإذاعة تعمل في الخلفية عند قفل الشاشة أو الخروج</span>
          </div>
          <span className="text-[10px] text-amber-400 font-bold underline shrink-0">معرفة المزيد</span>
        </button>
      </div>
    </div>
  );
};
