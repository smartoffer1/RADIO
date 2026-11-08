import React from 'react';
import { Play, Pause, Heart, Radio, Volume2, Loader2, Sparkles } from 'lucide-react';
import { RadioStation, PlaybackStatus } from '../types/radio';
import { AudioVisualizer } from './AudioVisualizer';

interface StationCardProps {
  station: RadioStation;
  isCurrent: boolean;
  playbackStatus: PlaybackStatus;
  isFavorite: boolean;
  onSelect: (station: RadioStation) => void;
  onTogglePlay: () => void;
  onToggleFavorite: (stationId: string) => void;
}

export const StationCard: React.FC<StationCardProps> = ({
  station,
  isCurrent,
  playbackStatus,
  isFavorite,
  onSelect,
  onTogglePlay,
  onToggleFavorite,
}) => {
  const isPlayingThis = isCurrent && playbackStatus === 'playing';
  const isLoadingThis = isCurrent && playbackStatus === 'loading';

  const handleCardClick = () => {
    if (isCurrent) {
      onTogglePlay();
    } else {
      onSelect(station);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer select-none ${
        isCurrent
          ? 'bg-gradient-to-br from-emerald-950/90 via-slate-900 to-slate-900 border-amber-500/80 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/30'
          : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/80 hover:border-slate-700 hover:shadow-lg'
      }`}
    >
      {/* Top Banner Image with gradient overlay */}
      <div className="relative h-28 w-full overflow-hidden bg-slate-950">
        <img
          src={station.logo}
          alt={station.name}
          className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
            isPlayingThis ? 'scale-105 filter brightness-105' : 'opacity-85'
          }`}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

        {/* Essential / Featured Star */}
        {station.category === 'essential' && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/90 text-slate-950 text-[10px] font-black shadow-md backdrop-blur-sm">
            <Sparkles className="w-3 h-3 fill-slate-950" />
            <span>محطة أساسية</span>
          </div>
        )}

        {/* Favorite Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(station.id);
          }}
          className={`absolute top-2.5 left-2.5 p-2 rounded-full transition-all cursor-pointer backdrop-blur-md ${
            isFavorite
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Live Indicator on image */}
        <div className="absolute bottom-2 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950/80 text-[11px] font-bold text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{station.frequency || 'بث مباشر'}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm sm:text-base font-bold truncate transition-colors ${
                isCurrent ? 'text-amber-300' : 'text-white group-hover:text-amber-200'
              }`}
            >
              {station.name}
            </h3>
            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
              {station.subtitle}
            </p>
          </div>

          {/* Play / Pause Action Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isCurrent) {
                onTogglePlay();
              } else {
                onSelect(station);
              }
            }}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-all active:scale-90 cursor-pointer ${
              isPlayingThis
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-400/50'
                : isCurrent
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-slate-800 text-slate-200 group-hover:bg-amber-500 group-hover:text-slate-950'
            }`}
            title={isPlayingThis ? 'إيقاف مؤقت' : 'تشغيل البث'}
          >
            {isLoadingThis ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlayingThis ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-[-1px]" />
            )}
          </button>
        </div>

        {/* Location / Tags */}
        <p className="text-[11px] text-slate-400/90 mb-3 line-clamp-2 leading-relaxed">
          {station.description}
        </p>

        {/* Bottom bar inside card */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
          <span className="text-slate-400 flex items-center gap-1 truncate max-w-[65%]">
            <Radio className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">{station.location}</span>
          </span>

          {/* Visualizer when active */}
          {isPlayingThis ? (
            <AudioVisualizer isPlaying={true} barsCount={7} barColor="bg-amber-400" className="h-4" />
          ) : (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                station.category === 'essential'
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {station.category === 'essential'
                ? 'مميزة'
                : station.category === 'quran'
                ? 'قرآن'
                : station.category === 'ruqyah'
                ? 'رقية'
                : 'أخبار'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
