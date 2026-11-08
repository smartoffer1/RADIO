/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Radio,
  Search,
  Sparkles,
  Heart,
  Volume2,
  Plus,
  Smartphone,
  ShieldCheck,
  Compass,
  SlidersHorizontal,
  Flame,
  Check,
  X,
  Bell,
  Clock,
  Play,
  Droplets,
  Sun,
  Globe,
} from 'lucide-react';
import { RadioStation, StationCategory } from './types/radio';
import { INITIAL_STATIONS } from './data/stations';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { Navbar } from './components/Navbar';
import { StationCard } from './components/StationCard';
import { BottomPlayer } from './components/BottomPlayer';
import { FullscreenPlayer } from './components/FullscreenPlayer';
import { InstallModal } from './components/InstallModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { CustomStreamModal } from './components/CustomStreamModal';
import { BackgroundGuideModal } from './components/BackgroundGuideModal';
import { FajrAlarmModal } from './components/FajrAlarmModal';
import { FajrWakeUpMission } from './components/FajrWakeUpMission';
import { PWAInstallButton } from './components/PWAInstallButton';
import { AudioVisualizer } from './components/AudioVisualizer';
import { UserNameModal } from './components/UserNameModal';
import { fetchPrayerTimes, calculateTimeUntilFajr } from './services/prayerTimes';

export default function App() {
  // Load stations from memory + localStorage for custom user additions
  const [stations, setStations] = useState<RadioStation[]>(() => {
    try {
      const saved = localStorage.getItem('athir_custom_stations');
      if (saved) {
        const customStations: RadioStation[] = JSON.parse(saved);
        return [...INITIAL_STATIONS, ...customStations];
      }
    } catch {
      // ignore
    }
    return INITIAL_STATIONS;
  });

  const [activeCategory, setActiveCategory] = useState<StationCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isFullscreenPlayerOpen, setIsFullscreenPlayerOpen] = useState<boolean>(false);
  const [isSleepTimerModalOpen, setIsSleepTimerModalOpen] = useState<boolean>(false);
  const [isCustomStreamModalOpen, setIsCustomStreamModalOpen] = useState<boolean>(false);
  const [isBackgroundGuideOpen, setIsBackgroundGuideOpen] = useState<boolean>(false);

  // User name personalization for Fajr alarm
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('athir_user_name') || '';
  });
  const [isUserNameModalOpen, setIsUserNameModalOpen] = useState<boolean>(false);
  const [isInitialNamePrompt, setIsInitialNamePrompt] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem('athir_user_name');
    if (!saved) {
      const timer = setTimeout(() => {
        setIsInitialNamePrompt(true);
        setIsUserNameModalOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSaveUserName = (name: string) => {
    setUserName(name);
    localStorage.setItem('athir_user_name', name);
  };

  // Fajr Alarm States
  const [isFajrAlarmModalOpen, setIsFajrAlarmModalOpen] = useState<boolean>(false);
  const [isWakeUpMissionActive, setIsWakeUpMissionActive] = useState<boolean>(false);
  const [isFajrAlarmEnabled, setIsFajrAlarmEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('athir_fajr_alarm_enabled');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [fajrTime, setFajrTime] = useState<string>('04:55');
  const [fajrCountdown, setFajrCountdown] = useState<string>('');

  // Audio Player Hook
  const {
    currentStation,
    playbackStatus,
    volume,
    isMuted,
    errorMessage,
    usingBackupIndex,
    sleepTimerMinutes,
    sleepTimerSecondsLeft,
    isWakeLockActive,
    favorites,
    setVolume,
    setIsMuted,
    setSleepTimer,
    toggleWakeLock,
    toggleFavorite,
    playStation,
    togglePlay,
    pause,
    playNext,
    playPrevious,
  } = useAudioPlayer(stations, 'makkah-haram');

  // Load Fajr Prayer Time
  useEffect(() => {
    const country = localStorage.getItem('athir_fajr_country') || 'Egypt';
    const city = localStorage.getItem('athir_fajr_city') || 'Cairo';

    fetchPrayerTimes(country, city).then((data) => {
      if (data?.timings?.Fajr) {
        setFajrTime(data.timings.Fajr);
      }
    });
  }, []);

  // Update Countdown to Fajr & Check Alarm Trigger
  useEffect(() => {
    if (!fajrTime) return;

    const timer = setInterval(() => {
      const res = calculateTimeUntilFajr(fajrTime);
      setFajrCountdown(`${res.hours} س : ${res.minutes} د : ${res.seconds} ث`);

      // Check if alarm should trigger (exact match on 0 seconds left)
      if (isFajrAlarmEnabled && !isWakeUpMissionActive && res.totalSeconds === 0) {
        pause(); // Stop background radio
        setIsWakeUpMissionActive(true); // Sound the Fajr alarm!
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [fajrTime, isFajrAlarmEnabled, isWakeUpMissionActive, pause]);

  // Handle adding custom stations
  const handleAddCustomStation = (newStation: RadioStation) => {
    setStations((prev) => {
      const updated = [newStation, ...prev];
      try {
        const customOnly = updated.filter((s) => s.id.startsWith('custom-'));
        localStorage.setItem('athir_custom_stations', JSON.stringify(customOnly));
      } catch {
        // ignore
      }
      return updated;
    });
    playStation(newStation);
  };

  // Switch to specific backup stream
  const handleSwitchStream = (backupIdx: number) => {
    playStation(currentStation, backupIdx);
  };

  // Filter stations
  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      // Category filter
      if (activeCategory === 'favorites') {
        if (!favorites.includes(station.id)) return false;
      } else if (activeCategory === 'essential') {
        if (station.category !== 'essential') return false;
      } else if (activeCategory === 'quran') {
        if (station.category !== 'quran' && station.category !== 'essential') return false;
      } else if (activeCategory === 'ruqyah') {
        if (station.category !== 'ruqyah') return false;
      } else if (activeCategory === 'news') {
        if (station.category !== 'news' && !station.tags.includes('أخبار') && !station.tags.includes('News')) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = station.name.toLowerCase().includes(query);
        const matchesSub = station.subtitle.toLowerCase().includes(query);
        const matchesDesc = station.description.toLowerCase().includes(query);
        const matchesLocation = station.location.toLowerCase().includes(query);
        const matchesTags = station.tags.some((t) => t.toLowerCase().includes(query));
        return matchesName || matchesSub || matchesDesc || matchesLocation || matchesTags;
      }

      return true;
    });
  }, [stations, activeCategory, searchQuery, favorites]);

  // The Core Requested Stations (Quran Cairo, Makkah, Ruqyah, BBC Arabic, Al Jazeera, BBC English, Reuters, Sputnik)
  const essentialStations = useMemo(() => {
    return stations.filter((s) =>
      [
        'makkah-haram',
        'cairo-quran',
        'roqyah-shariah',
        'bbc-arabic',
        'aljazeera-news',
        'bbc-english',
        'reuters-news',
        'sputnik-arabic',
      ].includes(s.id)
    );
  }, [stations]);

  const isCurrentPlaying = playbackStatus === 'playing';

  // Manual Trigger for Fajr Test
  const triggerTestAlarm = () => {
    pause(); // pause radio
    setIsWakeUpMissionActive(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans bg-islamic-pattern pb-28">
      {/* Top Header */}
      <Navbar
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenSleepTimer={() => setIsSleepTimerModalOpen(true)}
        onOpenCustomStream={() => setIsCustomStreamModalOpen(true)}
        onOpenBackgroundGuide={() => setIsBackgroundGuideOpen(true)}
        onOpenFajrAlarm={() => setIsFajrAlarmModalOpen(true)}
        userName={userName || 'الاسم'}
        onOpenUserNameModal={() => {
          setIsInitialNamePrompt(false);
          setIsUserNameModalOpen(true);
        }}
        sleepTimerMinutes={sleepTimerMinutes}
        sleepTimerSecondsLeft={sleepTimerSecondsLeft}
        isFajrAlarmEnabled={isFajrAlarmEnabled}
      />

      {/* Fajr Alarm Spotlight Bar */}
      <div className="bg-gradient-to-r from-amber-950/80 via-emerald-950/80 to-slate-950 border-b border-amber-500/30 px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
              <Bell className="w-4 h-4 animate-pulse" />
            </span>
            <div>
              <p className="font-bold text-white flex items-center gap-2">
                <span>منبه صلاة الفجر الذكي مع شروط الاستيقاظ (الوضوء وسجادة الصلاة)</span>
                <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                  مفعّل تلقائياً
                </span>
              </p>
              <p className="text-[11px] text-slate-300">
                أذان الفجر: <strong className="text-amber-400 font-mono">{fajrTime} ص</strong>
                {fajrCountdown && (
                  <span className="mr-2 text-slate-400 font-mono">
                    (متبقي: {fajrCountdown})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={triggerTestAlarm}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>تجربة المنبه والشروط الآن</span>
            </button>
            <button
              onClick={() => setIsFajrAlarmModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold transition cursor-pointer"
            >
              الإعدادات والدولة
            </button>
          </div>
        </div>
      </div>

      {/* Hero Live Spotlight Banner */}
      <section className="relative overflow-hidden pt-6 pb-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-600/30 shadow-2xl p-5 sm:p-7">
            {/* Ambient Background Glow */}
            <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* Left Details */}
              <div className="flex-1 text-center lg:text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>الإذاعة النشطة حالياً • خاصية الخلفية مفعلة</span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-wide mb-2 leading-tight">
                  {currentStation.name}
                </h2>
                <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed mb-4">
                  {currentStation.subtitle} — {currentStation.description}
                </p>

                {/* Quick Stations Tabs */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
                  <span className="text-xs text-amber-400 font-bold ml-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    المحطات المطلوبة:
                  </span>
                  {essentialStations.map((st) => {
                    const isSelected = st.id === currentStation.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => playStation(st)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105'
                            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                        }`}
                      >
                        <Radio className="w-3 h-3 text-emerald-400" />
                        <span>{st.name.replace('إذاعة ', '').split('|')[0].trim()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Big Play Card */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  onClick={() => setIsFullscreenPlayerOpen(true)}
                  className="relative group cursor-pointer"
                >
                  <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl overflow-hidden p-1 bg-gradient-to-tr from-amber-500 to-emerald-500 shadow-xl shadow-emerald-950/80 group-hover:scale-105 transition-transform duration-300">
                    <img
                      src={currentStation.logo}
                      alt={currentStation.name}
                      className="w-full h-full object-cover rounded-[20px]"
                    />
                    <div className="absolute inset-0 rounded-3xl bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlay();
                        }}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all cursor-pointer ${
                          isCurrentPlaying
                            ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/50'
                            : 'bg-white text-slate-950 hover:bg-amber-400'
                        }`}
                      >
                        {isCurrentPlaying ? (
                          <span className="font-bold text-sm">إيقاف</span>
                        ) : (
                          <span className="font-bold text-sm">تشغيل</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Soundwave under card */}
                <div className="mt-3">
                  <AudioVisualizer isPlaying={isCurrentPlaying} barsCount={14} barColor="bg-amber-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 w-full flex-1">
        {/* Android PWA Install Banner */}
        <div className="my-4">
          <PWAInstallButton
            onOpenMobileGuide={() => setIsInstallModalOpen(true)}
            variant="banner"
          />
        </div>

        {/* Search & Category Filter Navigation */}
        <div className="my-6 space-y-4">
          {/* Search bar and custom link button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن إذاعة، قارئ، بي بي سي، رويترز، سبوتنيك..."
                className="w-full pr-10 pl-10 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3.5 top-3.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setIsCustomStreamModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 text-xs font-semibold transition cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>إضافة رابط مخصص</span>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'all', label: 'جميع الإذاعات', icon: Compass },
              { id: 'essential', label: 'المحطات المطلوبة ⭐', icon: Sparkles },
              { id: 'quran', label: 'قرآن كريم 📖', icon: Radio },
              { id: 'ruqyah', label: 'الرقية والأذكار 🛡️', icon: ShieldCheck },
              { id: 'news', label: 'إذاعات إخبارية 🎙️', icon: Volume2 },
              { id: 'favorites', label: `المفضلة (${favorites.length}) ❤️`, icon: Heart },
            ].map((tab) => {
              const isSelected = activeCategory === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id as StationCategory)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/80 border border-emerald-500/50'
                      : 'bg-slate-900/70 hover:bg-slate-800 text-slate-300 border border-slate-800/80 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stations Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-400" />
              <span>قائمة الإذاعات المباشرة</span>
              <span className="text-xs font-medium text-slate-400">
                ({filteredStations.length} إذاعة)
              </span>
            </h3>
          </div>

          {filteredStations.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80">
              <Radio className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">لم يتم العثور على إذاعات تطابق بحثك</p>
              <p className="text-xs text-slate-500 mt-1">جرب البحث بكلمات أخرى أو أضف رابط الإذاعة يدوياً</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition cursor-pointer"
              >
                عرض جميع الإذاعات
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStations.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  isCurrent={station.id === currentStation.id}
                  playbackStatus={playbackStatus}
                  isFavorite={favorites.includes(station.id)}
                  onSelect={(st) => playStation(st)}
                  onTogglePlay={togglePlay}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>

        {/* Android Experience & Background playback features info */}
        <section className="my-8 rounded-3xl bg-slate-900/60 border border-emerald-950 p-6 sm:p-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              تطبيق أندرويد متكامل مع ميزة التشغيل في الخلفية ومنبه الفجر
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto mb-6">
              يعمل التطبيق في الخلفية عند قفل الشاشة، ويدعم مفاتيح التحكم في شريط الإشعارات وسماعات البلوتوث بفضل بروتوكول Media Session API.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <p className="text-xs font-bold text-emerald-300 mb-1">🎧 تشغيل في الخلفية</p>
                <p className="text-[11px] text-slate-400">استمع أثناء استخدام تطبيقات أخرى أو مع شاشة مقفلة.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <p className="text-xs font-bold text-amber-300 mb-1">🌅 منبه الفجر الذكي</p>
                <p className="text-[11px] text-slate-400">شروط إيقاف ذكية بالذكاء الاصطناعي (ماء الوضوء وسجادة الصلاة).</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <p className="text-xs font-bold text-blue-300 mb-1">🔄 خوادم بث بديلة</p>
                <p className="text-[11px] text-slate-400">انتقال فوري وتلقائي للسيرفر البديل عند ضعف الاتصال.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Persistent Bottom Audio Player Bar */}
      <BottomPlayer
        currentStation={currentStation}
        playbackStatus={playbackStatus}
        volume={volume}
        isMuted={isMuted}
        sleepTimerSecondsLeft={sleepTimerSecondsLeft}
        onTogglePlay={togglePlay}
        onNext={playNext}
        onPrevious={playPrevious}
        onToggleMute={() => setIsMuted(!isMuted)}
        onVolumeChange={setVolume}
        onOpenFullscreen={() => setIsFullscreenPlayerOpen(true)}
        onOpenSleepTimer={() => setIsSleepTimerModalOpen(true)}
      />

      {/* Fullscreen Player Drawer */}
      <FullscreenPlayer
        isOpen={isFullscreenPlayerOpen}
        onClose={() => setIsFullscreenPlayerOpen(false)}
        currentStation={currentStation}
        playbackStatus={playbackStatus}
        volume={volume}
        isMuted={isMuted}
        isFavorite={favorites.includes(currentStation.id)}
        sleepTimerSecondsLeft={sleepTimerSecondsLeft}
        isWakeLockActive={isWakeLockActive}
        usingBackupIndex={usingBackupIndex}
        errorMessage={errorMessage}
        onTogglePlay={togglePlay}
        onNext={playNext}
        onPrevious={playPrevious}
        onToggleMute={() => setIsMuted(!isMuted)}
        onVolumeChange={setVolume}
        onToggleFavorite={toggleFavorite}
        onOpenSleepTimer={() => setIsSleepTimerModalOpen(true)}
        onToggleWakeLock={toggleWakeLock}
        onSwitchStream={handleSwitchStream}
        onOpenBackgroundGuide={() => setIsBackgroundGuideOpen(true)}
      />

      {/* Mobile Download & QR Code Testing Modal */}
      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Sleep Timer Selector Modal */}
      <SleepTimerModal
        isOpen={isSleepTimerModalOpen}
        onClose={() => setIsSleepTimerModalOpen(false)}
        activeMinutes={sleepTimerMinutes}
        secondsLeft={sleepTimerSecondsLeft}
        onSetTimer={setSleepTimer}
      />

      {/* Custom Stream Input Modal */}
      <CustomStreamModal
        isOpen={isCustomStreamModalOpen}
        onClose={() => setIsCustomStreamModalOpen(false)}
        onAddStation={handleAddCustomStation}
      />

      {/* Background Playback Guide Modal */}
      <BackgroundGuideModal
        isOpen={isBackgroundGuideOpen}
        onClose={() => setIsBackgroundGuideOpen(false)}
      />

      {/* Fajr Prayer Alarm Settings Modal */}
      <FajrAlarmModal
        isOpen={isFajrAlarmModalOpen}
        onClose={() => setIsFajrAlarmModalOpen(false)}
        onTriggerTestAlarm={triggerTestAlarm}
      />

      {/* Active Fajr Wake-Up Mission Modal (Rings Athan and checks water + prayer mat) */}
      <FajrWakeUpMission
        isOpen={isWakeUpMissionActive}
        onMissionCompleted={() => {
          setIsWakeUpMissionActive(false);
        }}
        onEmergencyStop={() => {
          setIsWakeUpMissionActive(false);
        }}
      />

      {/* User Name Personalization Modal */}
      <UserNameModal
        isOpen={isUserNameModalOpen}
        onClose={() => setIsUserNameModalOpen(false)}
        currentName={userName}
        onSaveName={handleSaveUserName}
        isInitialPrompt={isInitialNamePrompt}
      />
    </div>
  );
}
