import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Camera,
  CheckCircle2,
  Droplets,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  Loader2,
  Volume2,
  VolumeX,
  HelpCircle,
  Sun,
  Flame,
  Clock,
  ArrowRight,
  Heart,
  Radio,
} from 'lucide-react';

interface FajrWakeUpMissionProps {
  isOpen: boolean;
  onMissionCompleted: () => void;
  onEmergencyStop: () => void;
}

type MissionStep = 'sink_water' | 'wudu_timer' | 'prayer_mat' | 'completed';

interface ClientImageMetrics {
  isCarpet: boolean;
  isSink: boolean;
  avgBrightness: number;
  avgSaturation: number;
  redRatio: number;
  ceramicRatio: number;
  darkRatio: number;
}

// Helper to compress camera image & extract computer vision features in real-time
async function compressAndAnalyzeImage(file: File): Promise<{ base64: string; metrics: ClientImageMetrics }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 800;
          let width = img.width;
          let height = img.height;
          if (width > height && width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const base64 = canvas.toDataURL('image/jpeg', 0.75);

            // Compute pixel statistics
            const imgData = ctx.getImageData(0, 0, width, height);
            const data = imgData.data;
            const totalPixels = width * height;
            const step = Math.max(1, Math.floor(totalPixels / 25000));
            let sampled = 0;
            let brightSum = 0;
            let satSum = 0;
            let redCount = 0;
            let darkCount = 0;
            let ceramicCount = 0;

            for (let p = 0; p < totalPixels; p += step) {
              const idx = p * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const br = 0.299 * r + 0.587 * g + 0.114 * b;
              brightSum += br;
              const maxC = Math.max(r, g, b);
              const minC = Math.min(r, g, b);
              const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;
              satSum += sat;

              if ((r > 100 && r > g * 1.3 && r > b * 1.3) || (r > 120 && b > 80 && g < 100)) {
                redCount++;
              }
              if (br < 65) {
                darkCount++;
              }
              if (br > 135 && (maxC - minC) < 35) {
                ceramicCount++;
              }
              sampled++;
            }

            const avgBrightness = brightSum / (sampled || 1);
            const avgSaturation = satSum / (sampled || 1);
            const redRatio = redCount / (sampled || 1);
            const ceramicRatio = ceramicCount / (sampled || 1);
            const darkRatio = darkCount / (sampled || 1);

            const isCarpet = (redRatio > 0.025 || (avgSaturation > 0.28 && ceramicRatio < 0.15) || (darkRatio > 0.40 && redRatio > 0.012)) && ceramicRatio < 0.22;
            const isSink = (ceramicRatio > 0.15 || (avgBrightness > 125 && avgSaturation < 0.25)) && redRatio < 0.025;

            resolve({
              base64,
              metrics: {
                isCarpet,
                isSink,
                avgBrightness,
                avgSaturation,
                redRatio,
                ceramicRatio,
                darkRatio,
              },
            });
            return;
          }
        } catch (err) {
          console.warn('Canvas analysis error:', err);
        }
        resolve({
          base64: e.target?.result as string,
          metrics: {
            isCarpet: false,
            isSink: false,
            avgBrightness: 100,
            avgSaturation: 0.2,
            redRatio: 0,
            ceramicRatio: 0,
            darkRatio: 0,
          },
        });
      };
      img.onerror = () => resolve({
        base64: e.target?.result as string,
        metrics: { isCarpet: false, isSink: false, avgBrightness: 100, avgSaturation: 0.2, redRatio: 0, ceramicRatio: 0, darkRatio: 0 },
      });
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve({
      base64: '',
      metrics: { isCarpet: false, isSink: false, avgBrightness: 100, avgSaturation: 0.2, redRatio: 0, ceramicRatio: 0, darkRatio: 0 },
    });
    reader.readAsDataURL(file);
  });
}

export const FajrWakeUpMission: React.FC<FajrWakeUpMissionProps> = ({
  isOpen,
  onMissionCompleted,
  onEmergencyStop,
}) => {
  const [currentStep, setCurrentStep] = useState<MissionStep>('sink_water');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStatusText, setAnalyzingStatusText] = useState('جارِ فحص الصورة...');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 3-Minute (180 seconds) Wudu Gap Timer between Sink & Prayer Mat
  const [wuduSecondsLeft, setWuduSecondsLeft] = useState<number>(180);

  const [showEmergencyMath, setShowEmergencyMath] = useState(false);
  const [mathAnswer, setMathAnswer] = useState('');
  const [mathProblem] = useState(() => {
    const a = Math.floor(Math.random() * 20) + 15;
    const b = Math.floor(Math.random() * 20) + 12;
    return { a, b, answer: a + b };
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const voiceTimerRef = useRef<any>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const alarmBuzzerRef = useRef<any>(null);

  // Stop all active audio, voiceover, and buzzers
  const stopWakeUpAudio = () => {
    if (voiceTimerRef.current) {
      clearTimeout(voiceTimerRef.current);
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current.src = '';
      voiceAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (alarmBuzzerRef.current) {
      try {
        alarmBuzzerRef.current.close();
      } catch {}
      alarmBuzzerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  };

  // Start Stage 1: Strong, deep rough voiceover + alarm chime (No Athan/Dua before bathroom)
  const startStage1VoiceoverAlarm = () => {
    stopWakeUpAudio();

    // 1. Web Audio API alarm pulse synthesizer
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        alarmBuzzerRef.current = ctx;

        const beep = () => {
          if (!ctx || ctx.state === 'closed') return;
          if (ctx.state === 'suspended') ctx.resume();
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(650, now);
          osc.frequency.exponentialRampToValueAtTime(1050, now + 0.15);
          osc.frequency.exponentialRampToValueAtTime(650, now + 0.35);
          gain.gain.setValueAtTime(0.35, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.38);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.38);
        };
        beep();
        const buzzerInterval = setInterval(beep, 1400);
        (ctx as any)._interval = buzzerInterval;
      }
    } catch (e) {
      console.warn('AudioContext alarm error:', e);
    }

    // 2. High-fidelity Human Egyptian voice calling user by name (MP3 stream with fallback)
    const userName = localStorage.getItem('athir_user_name')?.trim() || 'يا بطل';
    const phrases = [
      `اصحى يا ${userName}! قوم يا بطل، الفجر أذن والصلاة خير من النوم! يلا فز من السرير، اتوضا وصلي وخد بركة اليوم!`,
      `يا ${userName}! صحصح كدة وفوق، قوم فز من على السرير، اتوضا واغسل وشك، الصلاة خير من النوم!`,
      `قوم يا ${userName} يا غالي! الفجر أذن خلاص، متكسلش والشيطان يغلبك، قوم للحوض وافتح المية واتوضا!`,
      `يا ${userName}! ربك بيناديك، الصلاة خير من النوم! ارمي الغطا وقوم اتوضا وصلي وربنا هيفتحها في وشك!`,
      `اصحى يا ${userName}! من صلى الفجر فهو في ذمة الله، قوم اتوضا وابدأ يومك بنور ورضا!`,
    ];
    let pIdx = 0;

    const fallbackSpeech = (phrase: string) => {
      if (!isOpen || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.lang = 'ar-EG';
      utterance.pitch = 0.95;
      utterance.rate = 0.98;
      utterance.volume = 1.0;
      utterance.onend = () => {
        if (!isOpen) return;
        voiceTimerRef.current = setTimeout(playNextPhrase, 1200);
      };
      window.speechSynthesis.speak(utterance);
    };

    const playNextPhrase = () => {
      if (!isOpen) return;
      const phrase = phrases[pIdx % phrases.length];
      pIdx++;

      try {
        const audio = new Audio(`/api/tts-audio?text=${encodeURIComponent(phrase)}`);
        voiceAudioRef.current = audio;
        audio.onended = () => {
          if (!isOpen) return;
          voiceTimerRef.current = setTimeout(playNextPhrase, 1200);
        };
        audio.onerror = () => {
          fallbackSpeech(phrase);
        };
        audio.play().catch(() => {
          fallbackSpeech(phrase);
        });
      } catch {
        fallbackSpeech(phrase);
      }
    };

    // Begin real human voice calling loop
    playNextPhrase();

    // Vibrations for physical waking
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([1000, 500, 1000, 500, 1000]);
      } catch {}
    }
  };

  // Start Stage 3: Live recitation from Makkah Haram Radio (صوت جميل من إذاعة الحرم المكي)
  const startMakkahRadioAlarm = () => {
    stopWakeUpAudio();

    const audio = new Audio();
    // Primary Makkah stream (mixlr live) with fallback
    audio.src = 'https://edge.mixlr.com/channel/rwumx';
    audio.volume = 1.0;
    audio.loop = true;
    audioRef.current = audio;

    audio.play().catch((err) => {
      console.warn('Makkah stream primary error, trying fallback:', err);
      audio.src = 'https://radio.mp3islam.com/listen/sudais/radio.mp3';
      audio.play().catch((e2) => console.warn('Makkah fallback audio error:', e2));
    });

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([500, 300, 500]);
      } catch {}
    }
  };

  // Manage Audio state changes according to the Islamic etiquette flow
  useEffect(() => {
    if (!isOpen) {
      stopWakeUpAudio();
      setCurrentStep('sink_water');
      setWuduSecondsLeft(180);
      setPreviewImage(null);
      setErrorMessage(null);
      setFeedbackMsg(null);
      return;
    }

    if (currentStep === 'sink_water') {
      // Stage 1: Strong rough voice-over + alarm (No religious Athan inside bathroom)
      startStage1VoiceoverAlarm();
    } else if (currentStep === 'wudu_timer') {
      // Stage 2: COMPLETE SILENCE while making Wudu inside the bathroom!
      stopWakeUpAudio();
    } else if (currentStep === 'prayer_mat') {
      // Stage 3: Beautiful Live Makkah Haram Radio sound until prayer mat is captured!
      startMakkahRadioAlarm();
    } else if (currentStep === 'completed') {
      // Stage 4: Mission accomplished - STOP ALL SOUNDS!
      stopWakeUpAudio();
    }

    return () => {
      stopWakeUpAudio();
    };
  }, [isOpen, currentStep]);

  // 3-Minute Wudu Countdown Interval (Silent)
  useEffect(() => {
    if (currentStep !== 'wudu_timer') return;

    const timer = setInterval(() => {
      setWuduSecondsLeft((prev) => {
        if (prev <= 1) {
          // 3 minutes finished! User exited bathroom -> Start Makkah Haram Radio & Prayer Mat step
          setCurrentStep('prayer_mat');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStep]);

  if (!isOpen) return null;

  // Handle Photo selection from camera
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAnalyzingStatusText('جارِ ضغط وتجهيز الصورة وفحص الملامح...');
    setErrorMessage(null);
    setFeedbackMsg(null);

    try {
      // Compress and analyze image features
      const { base64, metrics } = await compressAndAnalyzeImage(file);
      setPreviewImage(base64);

      // Reset file input so next capture always triggers
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      await verifyMissionWithAI(base64, metrics);
    } catch (err: any) {
      setIsAnalyzing(false);
      setErrorMessage('حدث خطأ أثناء معالجة الصورة، يرجى المحاولة ثانية.');
    }
  };

  // Verify photo with Server-Side Gemini Vision & Computer Vision Classifier
  const verifyMissionWithAI = async (base64Image: string, metrics: ClientImageMetrics) => {
    setIsAnalyzing(true);
    const missionType = currentStep === 'sink_water' ? 'sink_running_water' : 'prayer_mat';
    setAnalyzingStatusText(
      missionType === 'sink_running_water'
        ? 'جارِ التحقق بدقة من ماء وحوض الوضوء بالذكاء الاصطناعي...'
        : 'جارِ فحص وتدقيق سجادة الصلاة بالذكاء الاصطناعي...'
    );

    // Setup an abort controller with 8 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch('/api/verify-fajr-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          missionType: missionType,
          clientMetrics: metrics,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();
      setIsAnalyzing(false);

      if (data.verified) {
        setFeedbackMsg(data.feedback_ar || 'تم التحقق بنجاح!');
        setErrorMessage(null);

        setTimeout(() => {
          setPreviewImage(null);
          setFeedbackMsg(null);
          if (currentStep === 'sink_water') {
            // Move to 3-minute Wudu timer!
            setCurrentStep('wudu_timer');
            setWuduSecondsLeft(180);
          } else if (currentStep === 'prayer_mat') {
            // Completed!
            setCurrentStep('completed');
          }
        }, 1600);
      } else {
        setFeedbackMsg(null);
        setErrorMessage(data.feedback_ar || 'لم يتم رصد المطلوب بدقة. يرجى إعادة التصوير بإنارة جيدة.');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      setIsAnalyzing(false);
      console.warn('Mission verification network or timeout:', err?.message);

      // Intelligent Client Fallback - Never mistake carpet for sink
      if (currentStep === 'sink_water') {
        if (metrics.isCarpet) {
          setFeedbackMsg(null);
          setErrorMessage('الصورة الملتقطة هي سجادة صلاة وليست حوض مياه! يرجى التوجه إلى المغسلة وفتح صنبور المياه وتصوير تدفق الماء للوضوء.');
          return;
        }
        if (metrics.isSink) {
          setFeedbackMsg('تم التحقق من حوض ومياه الوضوء بنجاح! هنيئاً لك، وضوء مبارك.');
          setErrorMessage(null);
          setTimeout(() => {
            setPreviewImage(null);
            setFeedbackMsg(null);
            setCurrentStep('wudu_timer');
            setWuduSecondsLeft(180);
          }, 1600);
          return;
        }
        setFeedbackMsg(null);
        setErrorMessage('لم يتم رصد حوض وصنبور المياه بوضوح. يرجى توجيه الكاميرا إلى الصنبور والمياه تتدفق بإنارة واضحة.');
      } else if (currentStep === 'prayer_mat') {
        if (metrics.isSink) {
          setFeedbackMsg(null);
          setErrorMessage('هذا صنبور مياه وليس سجادة صلاة! يرجى توجيه الكاميرا إلى سجادة الصلاة المفروشة باتجاه القبلة.');
          return;
        }
        // Accepts prayer mat
        setFeedbackMsg('تم التحقق من سجادة الصلاة بنجاح! تقبل الله صلاتكم وطاعتكم.');
        setErrorMessage(null);
        setTimeout(() => {
          setPreviewImage(null);
          setFeedbackMsg(null);
          setCurrentStep('completed');
        }, 1600);
      }
    }
  };

  // Format seconds to mm:ss
  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Handle Emergency Math answer
  const handleMathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(mathAnswer.trim(), 10) === mathProblem.answer) {
      if (audioRef.current) audioRef.current.pause();
      onEmergencyStop();
    } else {
      setErrorMessage('إجابة غير صحيحة، ركز واستيقظ!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl text-slate-100 overflow-y-auto select-none animate-fadeIn">
      {/* Hidden file input configured for native mobile camera capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoCapture}
        className="hidden"
      />

      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/20 text-center">
        {/* Pulsing Alarm Icon Header */}
        <div className="relative w-18 h-18 sm:w-20 sm:h-20 mx-auto mb-3 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-emerald-600 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/30">
          <Bell className="w-9 h-9 sm:w-10 sm:h-10 animate-bounce" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500" />
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white mb-1">
          {currentStep === 'completed'
            ? 'تقبل الله طاعتكم وصالح أعمالكم!'
            : currentStep === 'wudu_timer'
            ? 'مرحلة الوضوء (وضع الصمت التام 🔇)'
            : currentStep === 'prayer_mat'
            ? 'إذاعة الحرم المكي الشريف 🕋'
            : 'حان موعد الاستيقاظ لصلاة الفجر!'}
        </h2>
        <p className="text-xs sm:text-sm text-amber-300 font-semibold mb-5">
          {currentStep === 'sink_water'
            ? '«تنبيه حازم وفويس أوفر قوي للنهوض • مراعاة لعدم تشغيل أي ذكر عند التوجه للحمام»'
            : currentStep === 'wudu_timer'
            ? '«المنبه صامت تماماً أثناء الوضوء احتراماً لآداب الخلاء»'
            : currentStep === 'prayer_mat'
            ? '«تلاوة عطرة ندية من الحرم المكي • وجّه الكاميرا للسجادة لإيقاف المنبه»'
            : '«الصلاة خير من النوم • الصلاة خير من النوم»'}
        </p>

        {/* Step Progression Indicators */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 text-[11px] sm:text-xs">
          <div
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full font-bold transition-all ${
              currentStep === 'sink_water'
                ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-300 animate-pulse'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {currentStep !== 'sink_water' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Droplets className="w-3.5 h-3.5" />}
            <span>1. ماء الوضوء</span>
          </div>

          <span className="text-slate-600">←</span>

          <div
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full font-bold transition-all ${
              currentStep === 'wudu_timer'
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 animate-pulse'
                : currentStep === 'prayer_mat' || currentStep === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>2. فارق الوضوء (صامت 3 د)</span>
          </div>

          <span className="text-slate-600">←</span>

          <div
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full font-bold transition-all ${
              currentStep === 'prayer_mat'
                ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 animate-pulse'
                : currentStep === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            {currentStep === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Radio className="w-3.5 h-3.5" />}
            <span>3. سجادة الصلاة والحرم</span>
          </div>
        </div>

        {/* STEP 1: SINK & RUNNING WATER (STRONG VOICEOVER + BUZZER) */}
        {currentStep === 'sink_water' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 text-right text-xs">
              <p className="font-bold text-white text-sm mb-1.5 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-cyan-400" />
                المهمة الأولى: تصوير صنبور المغسلة والمياه تنزل
              </p>
              <p className="text-slate-300 leading-relaxed mb-3">
                قم من الفراش إلى المغسلة، وافتح صنبور المياه ثم التقط صورة لـ
                <strong className="text-cyan-400"> تدفق الماء في الحوض</strong> لتأكيد النهوض وبدء الوضوء.
              </p>
              <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-[11px] text-cyan-200 flex items-start gap-2.5">
                <Volume2 className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
                <div>
                  <span className="font-bold text-cyan-300 block mb-0.5">مراعاة آداب التوجه للخلاء:</span>
                  <span>يعمل التنبيه الحالي بفويس أوفر بشري محفز بالمصري (دون أذان أو ذكر) احتراماً لدخول الحمام. وسيتوقف الصوت فور التقاط صورة صنبور المياه.</span>
                </div>
              </div>
            </div>

            {/* Egyptian Encouragement Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-emerald-950/40 border border-amber-500/40 text-right text-xs">
              <p className="font-bold text-amber-300 text-xs mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>يا بطل! الصلاة خير من النوم وبركة يومك بتبدأ من هنا</span>
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                ارمي كسل النوم وقوم فز على المغسلة، افتح الحنفية وابدأ طهارتك، والمنبه هيقف أول ما تصور تدفق المية في الحوض!
              </p>
            </div>

            {/* Photo Preview if taken */}
            {previewImage && (
              <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-700 bg-black">
                <img src={previewImage} alt="صورة حوض وصنبور المياه" className="w-full h-full object-cover" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white p-4">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                    <span className="text-xs font-bold text-amber-300">{analyzingStatusText}</span>
                  </div>
                )}
              </div>
            )}

            {feedbackMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4" />
                {feedbackMsg}
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500 text-red-300 text-xs flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMessage}
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-600 hover:from-cyan-400 hover:to-emerald-500 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2.5"
            >
              <Camera className="w-6 h-6" />
              <span>{isAnalyzing ? 'جارِ التحقق...' : 'التقاط صورة الصنبور والمياه تتدفق'}</span>
            </button>
          </div>
        )}

        {/* STEP 2: 3-MINUTE WUDU GAP TIMER (TOTAL SILENCE IN BATHROOM) */}
        {currentStep === 'wudu_timer' && (
          <div className="space-y-4 animate-scaleUp">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-slate-950 to-teal-950 border border-emerald-500/40 text-center">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold inline-block mb-3">
                ✓ تم التحقق من ماء الوضوء بنجاح
              </span>

              <div className="flex items-center justify-center gap-2 text-white font-bold text-sm mb-1.5">
                <VolumeX className="w-5 h-5 text-amber-400 animate-pulse" />
                <span>المنبه صامت تماماً الآن لمراعاة آداب الخلاء</span>
              </div>
              <p className="text-xs text-slate-300 mb-4 max-w-sm mx-auto leading-relaxed">
                لا يصدر الهاتف أي صوت أو أذكار أثناء وجودك في الحمام. توضأ بتمهل وسكينة وطهارة مباركة.
              </p>

              {/* Big 3-Minute Silent Countdown */}
              <div className="w-32 h-32 mx-auto rounded-3xl bg-slate-900 border-2 border-emerald-400/60 shadow-xl flex flex-col items-center justify-center">
                <Clock className="w-6 h-6 text-emerald-400 mb-1" />
                <span className="text-3xl font-black font-mono text-white tracking-widest">
                  {formatTimer(wuduSecondsLeft)}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">دقيقة : ثانية</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-right text-xs leading-relaxed text-slate-300 space-y-1.5">
              <p className="font-bold text-amber-400 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-amber-400" />
                <span>الخطوة القادمة تلقائياً بعد خروجك:</span>
              </p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                فور انتهاء العداد (٣ دقائق) وخروجك إلى غرفة الصلاة، سيبدأ المنبه تلقائياً بصوت ندي وجميل من <strong className="text-white">إذاعة الحرم المكي الشريف</strong> ليصحبك في طريقك لسجادة الصلاة حتى التقاط صورتها.
              </p>
            </div>

            {/* Button to proceed if user finished early */}
            <button
              onClick={() => setCurrentStep('prayer_mat')}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>أتممت الوضوء وخرجت من الحمام الآن (بدء بث الحرم)</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}

        {/* STEP 3: PRAYER MAT WITH LIVE MAKKAH HARAM RADIO */}
        {currentStep === 'prayer_mat' && (
          <div className="space-y-4 animate-scaleUp">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-950 to-emerald-950/70 border border-amber-500/50 text-right text-xs">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-amber-300 text-sm flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                  إذاعة الحرم المكي الشريف تعمل الآن 🕋
                </p>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">بث مباشر حي</span>
              </div>
              <p className="text-slate-200 leading-relaxed">
                طهارة مباركة ووضوء مقبول! يستمر هذا البث العذب من رحاب الكعبة المشرفة في العمل حتى تقوم بتصوير <strong className="text-amber-300">سجادة الصلاة</strong> مفروشة باتجاه القبلة لإيقاف المنبه تماماً.
              </p>
            </div>

            {previewImage && (
              <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-700 bg-black">
                <img src={previewImage} alt="صورة سجادة الصلاة" className="w-full h-full object-cover" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white p-4">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                    <span className="text-xs font-bold text-amber-300">{analyzingStatusText}</span>
                  </div>
                )}
              </div>
            )}

            {feedbackMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4" />
                {feedbackMsg}
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500 text-red-300 text-xs flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMessage}
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2.5"
            >
              <Camera className="w-6 h-6" />
              <span>{isAnalyzing ? 'جارِ التحقق...' : 'التقاط صورة سجادة الصلاة (إيقاف المنبه)'}</span>
            </button>
          </div>
        )}

        {/* STEP 4: MISSION ACCOMPLISHED */}
        {currentStep === 'completed' && (
          <div className="space-y-4 py-4 animate-scaleUp">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/30">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-white">
              هنيئاً لك الاستيقاظ لصلاة الفجر!
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
              «ركعتا الفجر خيرٌ من الدنيا وما فيها». تم التحقق من الوضوء وسجادة الصلاة، وتوقف المنبه بنجاح.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={onMissionCompleted}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 transition active:scale-95 cursor-pointer"
              >
                إغلاق المنبه والبدء بالصلاة
              </button>
              <button
                onClick={() => {
                  startMakkahRadioAlarm();
                  onMissionCompleted();
                }}
                className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition active:scale-95 cursor-pointer border border-slate-700"
              >
                متابعة الاستماع لإذاعة الحرم 🕋
              </button>
            </div>
          </div>
        )}

        {/* Emergency Stop / Math Backup Option */}
        {currentStep !== 'completed' && (
          <div className="mt-5 pt-3 border-t border-slate-800 text-center">
            {!showEmergencyMath ? (
              <button
                onClick={() => setShowEmergencyMath(true)}
                className="text-[11px] text-slate-400 hover:text-amber-400 underline transition cursor-pointer"
              >
                هل الكاميرا معطلة أو الإضاءة مظلمة؟ اضغط للإيقاف الاضطراري
              </button>
            ) : (
              <form onSubmit={handleMathSubmit} className="space-y-2 mt-2">
                <p className="text-xs text-amber-300 font-semibold">
                  حل المسألة التالية لإثبات استيقاظك: {mathProblem.a} + {mathProblem.b} = ؟
                </p>
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="number"
                    value={mathAnswer}
                    onChange={(e) => setMathAnswer(e.target.value)}
                    placeholder="الناتج..."
                    className="w-28 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-center font-bold text-sm focus:outline-none focus:border-amber-400"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-600 transition cursor-pointer"
                  >
                    إيقاف
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
