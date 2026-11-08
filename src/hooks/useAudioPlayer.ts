import { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { RadioStation, PlaybackStatus } from '../types/radio';

export function useAudioPlayer(stations: RadioStation[], initialStationId?: string) {
  const [currentStation, setCurrentStation] = useState<RadioStation>(() => {
    if (initialStationId) {
      const found = stations.find((s) => s.id === initialStationId);
      if (found) return found;
    }
    return stations[0];
  });

  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('idle');
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usingBackupIndex, setUsingBackupIndex] = useState<number>(-1);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerSecondsLeft, setSleepTimerSecondsLeft] = useState<number | null>(null);
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('athir_favorite_stations');
      return saved ? JSON.parse(saved) : ['makkah-haram', 'cairo-quran'];
    } catch {
      return ['makkah-haram', 'cairo-quran'];
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const wakeLockSentinelRef = useRef<WakeLockSentinel | null>(null);
  const sleepIntervalRef = useRef<number | null>(null);

  // Initialize Audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audio.autoplay = false;
    audio.volume = 0.85;

    // Background playback support attributes
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');

    audioRef.current = audio;

    const onPlay = () => setPlaybackStatus('playing');
    const onPause = () => {
      setPlaybackStatus((prev) => (prev === 'loading' ? 'loading' : 'paused'));
    };
    const onWaiting = () => setPlaybackStatus('loading');
    const onPlaying = () => {
      setPlaybackStatus('playing');
      setErrorMessage(null);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Save favorites
  useEffect(() => {
    try {
      localStorage.setItem('athir_favorite_stations', JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  const toggleFavorite = useCallback((stationId: string) => {
    setFavorites((prev) =>
      prev.includes(stationId) ? prev.filter((id) => id !== stationId) : [...prev, stationId]
    );
  }, []);

  // Sync Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // MediaSession API setup for background playback and notification controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentStation) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentStation.name,
        artist: currentStation.subtitle || currentStation.location,
        album: 'أثير الهدى - راديو مباشر',
        artwork: [
          { src: currentStation.logo, sizes: '96x96', type: 'image/jpeg' },
          { src: currentStation.logo, sizes: '128x128', type: 'image/jpeg' },
          { src: currentStation.logo, sizes: '192x192', type: 'image/jpeg' },
          { src: currentStation.logo, sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        resume();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        pause();
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        pause();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        playPrevious();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNext();
      });
    } catch (e) {
      console.warn('MediaSession setup error:', e);
    }
  }, [currentStation]);

  // Sleep Timer countdown logic with smooth fade out
  useEffect(() => {
    if (sleepIntervalRef.current) {
      clearInterval(sleepIntervalRef.current);
      sleepIntervalRef.current = null;
    }

    if (sleepTimerSecondsLeft === null || sleepTimerSecondsLeft <= 0) {
      return;
    }

    sleepIntervalRef.current = window.setInterval(() => {
      setSleepTimerSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          // Timer ended!
          if (audioRef.current) {
            audioRef.current.pause();
            setPlaybackStatus('paused');
          }
          setSleepTimerMinutes(null);
          return null;
        }

        // Smooth fade out in the last 20 seconds
        if (prev <= 20 && audioRef.current && !isMuted) {
          const fadeVolume = (prev / 20) * volume;
          audioRef.current.volume = Math.max(0, fadeVolume);
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (sleepIntervalRef.current) {
        clearInterval(sleepIntervalRef.current);
      }
    };
  }, [sleepTimerSecondsLeft, volume, isMuted]);

  // Start sleep timer
  const setSleepTimer = useCallback(
    (minutes: number | null) => {
      setSleepTimerMinutes(minutes);
      if (minutes === null) {
        setSleepTimerSecondsLeft(null);
        if (audioRef.current) {
          audioRef.current.volume = isMuted ? 0 : volume;
        }
      } else {
        setSleepTimerSecondsLeft(minutes * 60);
      }
    },
    [volume, isMuted]
  );

  // Toggle Screen Wake Lock
  const toggleWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      if (isWakeLockActive && wakeLockSentinelRef.current) {
        try {
          await wakeLockSentinelRef.current.release();
          wakeLockSentinelRef.current = null;
          setIsWakeLockActive(false);
        } catch {
          // ignore
        }
      } else {
        try {
          const sentinel = await navigator.wakeLock.request('screen');
          wakeLockSentinelRef.current = sentinel;
          setIsWakeLockActive(true);
          sentinel.addEventListener('release', () => {
            setIsWakeLockActive(false);
            wakeLockSentinelRef.current = null;
          });
        } catch (err) {
          console.warn('Wake Lock request failed:', err);
        }
      }
    }
  }, [isWakeLockActive]);

  // Determine current active URL (primary or backup)
  const getActiveStreamUrl = useCallback(
    (station: RadioStation, backupIdx: number) => {
      if (backupIdx >= 0 && station.backupStreamUrls && station.backupStreamUrls[backupIdx]) {
        return station.backupStreamUrls[backupIdx];
      }
      return station.streamUrl;
    },
    []
  );

  // Play a specific station
  const playStation = useCallback(
    async (station: RadioStation, backupIdx = -1) => {
      const audio = audioRef.current;
      if (!audio) return;

      setErrorMessage(null);
      setPlaybackStatus('loading');
      setCurrentStation(station);
      setUsingBackupIndex(backupIdx);

      const targetUrl = getActiveStreamUrl(station, backupIdx);
      const isHlsStream =
        station.isHls ||
        targetUrl.includes('.m3u8') ||
        targetUrl.includes('simulcast/hls');

      // Clean up previous HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const tryFallback = () => {
        const nextBackupIdx = backupIdx + 1;
        if (station.backupStreamUrls && nextBackupIdx < station.backupStreamUrls.length) {
          setErrorMessage(`البث الأساسي غير متاح، جاري الانتقال للبث البديل #${nextBackupIdx + 1}...`);
          setTimeout(() => {
            playStation(station, nextBackupIdx);
          }, 1200);
        } else {
          setPlaybackStatus('error');
          setErrorMessage('تعذر الاتصال بالبث المباشر. يرجى التحقق من الاتصال بالإنترنت.');
        }
      };

      if (isHlsStream && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
        });
        hlsRef.current = hls;

        hls.loadSource(targetUrl);
        hls.attachMedia(audio);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          audio.play().catch((err) => {
            console.warn('HLS play error:', err);
            setPlaybackStatus('paused');
          });
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            console.warn('Fatal HLS error:', data.type);
            hls.destroy();
            hlsRef.current = null;
            tryFallback();
          }
        });
      } else {
        // Native audio element playback (supports MP3, AAC, and native HLS on Safari)
        audio.src = targetUrl;
        audio.load();

        const onErrorHandler = () => {
          audio.removeEventListener('error', onErrorHandler);
          tryFallback();
        };

        audio.addEventListener('error', onErrorHandler, { once: true });

        try {
          await audio.play();
          setPlaybackStatus('playing');
        } catch (err: unknown) {
          const domError = err as { name?: string };
          if (domError?.name !== 'AbortError') {
            console.warn('Audio play exception:', err);
            tryFallback();
          }
        }
      }
    },
    [getActiveStreamUrl]
  );

  // Resume current station
  const resume = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.src && currentStation) {
      playStation(currentStation, usingBackupIndex);
      return;
    }

    try {
      await audio.play();
      setPlaybackStatus('playing');
    } catch {
      playStation(currentStation, usingBackupIndex);
    }
  }, [currentStation, usingBackupIndex, playStation]);

  // Pause
  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setPlaybackStatus('paused');
    }
  }, []);

  // Toggle play / pause
  const togglePlay = useCallback(() => {
    if (playbackStatus === 'playing') {
      pause();
    } else {
      resume();
    }
  }, [playbackStatus, pause, resume]);

  // Next / Previous
  const playNext = useCallback(() => {
    const currentIndex = stations.findIndex((s) => s.id === currentStation.id);
    const nextIndex = (currentIndex + 1) % stations.length;
    playStation(stations[nextIndex]);
  }, [stations, currentStation, playStation]);

  const playPrevious = useCallback(() => {
    const currentIndex = stations.findIndex((s) => s.id === currentStation.id);
    const prevIndex = (currentIndex - 1 + stations.length) % stations.length;
    playStation(stations[prevIndex]);
  }, [stations, currentStation, playStation]);

  return {
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
    resume,
    playNext,
    playPrevious,
  };
}
