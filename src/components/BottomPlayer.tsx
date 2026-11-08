import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Loader2,
  Moon,
  Sparkles,
} from 'lucide-react';
import { RadioStation, PlaybackStatus } from '../types/radio';
import { AudioVisualizer } from './AudioVisualizer';

interface BottomPlayerProps {
  currentStation: RadioStation;
  playbackStatus: PlaybackStatus;
  volume: number;
  isMuted: boolean;
  sleepTimerSecondsLeft: number | null;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleMute: () => void;
  onVolumeChange: (vol: number) => void;
  onOpenFullscreen: () => void;
  onOpenSleepTimer: () => void;
}

export const BottomPlayer: React.FC<BottomPlayerProps> = ({
  currentStation,
  playbackStatus,
  volume,
  isMuted,
  sleepTimerSecondsLeft,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleMute,
  onVolumeChange,
  onOpenFullscreen,
  onOpenSleepTimer,
}) => {
  const isPlaying = playbackStatus === 'playing';
  const isLoading = playbackStatus === 'loading';

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 p-2 sm:p-4 pointer-events-none pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]">
      <div className="max-w-4xl mx-auto rounded-2xl sm:rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 shadow-2xl shadow-black/80 p-2.5 sm:p-3 pointer-events-auto transition-all">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Station Info & Thumbnail (tap to expand) */}
          <div
            onClick={onOpenFullscreen}
            className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 cursor-pointer group"
          >
            <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950 shrink-0 border border-slate-700/60 shadow-md">
              <img
                src={currentStation.logo}
                alt={currentStation.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                  {currentStation.name}
                </h4>
                {currentStation.category === 'essential' && (
                  <Sparkles className="w-3 h-3 text-amber-400 shrink-0 hidden xs:inline" />
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-400 truncate mt-0.5">
                <span className="truncate">{currentStation.subtitle || currentStation.location}</span>
                <span className="w-1 h-1 rounded-full bg-slate-600 hidden sm:inline" />
                <span className="text-emerald-400 font-semibold shrink-0">بث حي</span>
              </div>
            </div>
          </div>

          {/* Audio Visualizer center (tablet & desktop) */}
          <div
            onClick={onOpenFullscreen}
            className="hidden md:flex items-center cursor-pointer px-2"
          >
            <AudioVisualizer isPlaying={isPlaying} isLoading={isLoading} barsCount={12} barColor="bg-amber-400" />
          </div>

          {/* Primary Playback Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Previous */}
            <button
              onClick={onPrevious}
              className="p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-90 cursor-pointer flex items-center justify-center shrink-0"
              title="المحطة السابقة"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Play / Pause Main */}
            <button
              onClick={onTogglePlay}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer shrink-0 ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-400/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 sm:w-6 sm:h-6 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 sm:w-6 sm:h-6 fill-current" />
              ) : (
                <Play className="w-4 h-4 sm:w-6 sm:h-6 fill-current translate-x-[-1px]" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={onNext}
              className="p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-90 cursor-pointer flex items-center justify-center shrink-0"
              title="المحطة التالية"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Volume controls (desktop/tablet) */}
            <div className="hidden lg:flex items-center gap-1.5 ml-2 border-r border-slate-800 pr-2">
              <button
                onClick={onToggleMute}
                className="p-1.5 text-slate-400 hover:text-white transition cursor-pointer"
                title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Sleep Timer Indicator on bottom bar */}
            {sleepTimerSecondsLeft !== null && (
              <button
                onClick={onOpenSleepTimer}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold font-mono transition"
                title="مؤقت النوم نشط"
              >
                <Moon className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>{formatTime(sleepTimerSecondsLeft)}</span>
              </button>
            )}

            {/* Fullscreen Expand Button */}
            <button
              onClick={onOpenFullscreen}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
              title="فتح مشغل الشاشة الكاملة"
            >
              <Maximize2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
