import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  MapPin,
  Clock,
  Sparkles,
  Droplets,
  Sun,
  ShieldAlert,
  Play,
  RotateCw,
  Check,
  Smartphone,
} from 'lucide-react';
import {
  PrayerData,
  ARAB_COUNTRIES,
  fetchPrayerTimes,
  calculateTimeUntilFajr,
} from '../services/prayerTimes';

interface FajrAlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerTestAlarm: () => void;
}

export const FajrAlarmModal: React.FC<FajrAlarmModalProps> = ({
  isOpen,
  onClose,
  onTriggerTestAlarm,
}) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('athir_fajr_alarm_enabled') === 'true';
    } catch {
      return true;
    }
  });

  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    try {
      return localStorage.getItem('athir_fajr_country') || 'Egypt';
    } catch {
      return 'Egypt';
    }
  });

  const [cityInput, setCityInput] = useState<string>(() => {
    try {
      return localStorage.getItem('athir_fajr_city') || 'Cairo';
    } catch {
      return 'Cairo';
    }
  });

  const [alarmOffsetMinutes, setAlarmOffsetMinutes] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('athir_fajr_offset') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
  const [isLoadingTimes, setIsLoadingTimes] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Load prayer times when country or city changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingTimes(true);

    fetchPrayerTimes(selectedCountry, cityInput).then((data) => {
      if (isMounted) {
        setPrayerData(data);
        setIsLoadingTimes(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedCountry, cityInput]);

  // Live countdown to Fajr
  useEffect(() => {
    if (!prayerData?.timings?.Fajr) return;

    const interval = setInterval(() => {
      const res = calculateTimeUntilFajr(prayerData.timings.Fajr);
      setCountdown({
        hours: res.hours,
        minutes: res.minutes,
        seconds: res.seconds,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [prayerData]);

  // Save settings
  const handleToggleEnabled = () => {
    const nextState = !isEnabled;
    setIsEnabled(nextState);
    try {
      localStorage.setItem('athir_fajr_alarm_enabled', nextState.toString());
    } catch {
      // ignore
    }
  };

  const handleCountryChange = (cName: string) => {
    setSelectedCountry(cName);
    const countryObj = ARAB_COUNTRIES.find((c) => c.country === cName);
    const defaultCity = countryObj?.defaultCity || 'Cairo';
    setCityInput(defaultCity);
    try {
      localStorage.setItem('athir_fajr_country', cName);
      localStorage.setItem('athir_fajr_city', defaultCity);
    } catch {
      // ignore
    }
  };

  const handleOffsetChange = (offset: number) => {
    setAlarmOffsetMinutes(offset);
    try {
      localStorage.setItem('athir_fajr_offset', offset.toString());
    } catch {
      // ignore
    }
  };

  // Auto GPS Location detect
  const handleDetectGPS = () => {
    if (!('geolocation' in navigator)) {
      alert('المتصفح لا يدعم تحديد الموقع.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        const data = await fetchPrayerTimes(undefined, undefined, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setPrayerData(data);
        if (data.meta?.timezone) {
          setCityInput(data.meta.timezone.split('/')[1] || 'موقعك الحالي');
        }
      },
      () => {
        setIsLocating(false);
        alert('تعذر تحديد الموقع الجغرافي تلقائياً، يمكنك اختيار دولتك ومدينتك من القائمة.');
      },
      { timeout: 7000 }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none overflow-y-auto">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-slate-900 border border-emerald-600/50 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              منبه صلاة الفجر الذكي
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                تلقائي
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              ضبط توقيت الأذان تلقائياً حسب دولتك مع شروط الاستيقاظ الذكية
            </p>
          </div>
        </div>

        {/* Enable / Disable Switch */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-sm font-bold text-white">تفعيل منبه الفجر التلقائي</p>
            <p className="text-xs text-slate-400 mt-0.5">
              يعمل المنبه يومياً بصوت الأذان ولا ينطفئ إلا بعد شروط الاستيقاظ
            </p>
          </div>
          <button
            onClick={handleToggleEnabled}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              isEnabled ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                isEnabled ? 'bg-slate-950' : 'bg-slate-400'
              }`}
            />
          </button>
        </div>

        {/* Country & City Selector */}
        <div className="space-y-3 mb-5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>الدولة والمدينة (لحساب موعد الفجر تلقائياً):</span>
            </label>
            <button
              onClick={handleDetectGPS}
              disabled={isLocating}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
              <span>تحديد عبر GPS</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={selectedCountry}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-amber-400 transition"
            >
              {ARAB_COUNTRIES.map((c) => (
                <option key={c.country} value={c.country}>
                  {c.nameAr}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="المدينة (مثال: القاهرة، مكة، الرياض)"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Prayer Time Display Card */}
          {prayerData?.timings && (
            <div className="mt-3 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-300 font-semibold">موعد أذان الفجر اليوم:</span>
                <p className="text-xl font-black text-white font-mono">{prayerData.timings.Fajr} ص</p>
                <span className="text-[10px] text-slate-400">
                  الشروق: {prayerData.timings.Sunrise} ص
                </span>
              </div>

              {countdown && (
                <div className="text-left font-mono">
                  <span className="text-[10px] text-amber-300 font-sans block">متبقي على الفجر:</span>
                  <span className="text-base font-bold text-amber-400">
                    {countdown.hours} س : {countdown.minutes} د : {countdown.seconds} ث
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Alarm Time Offset */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-300 mb-2">توقيت رنين المنبه:</label>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {[
              { val: -15, label: 'قبل الأذان بـ 15 د' },
              { val: -10, label: 'قبل الأذان بـ 10 د' },
              { val: 0, label: 'في موعد الأذان تماماً' },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => handleOffsetChange(opt.val)}
                className={`py-2 px-1 rounded-xl border font-semibold transition cursor-pointer ${
                  alarmOffsetMinutes === opt.val
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Wake-up verification conditions explanation */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/40 text-right space-y-2.5">
          <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>شروط إيقاف منبه الفجر الذكي (لن يتوقف الصوت إلا بها):</span>
          </h4>

          <div className="space-y-2 text-xs text-slate-300 pr-1">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                1
              </span>
              <p>
                <strong>تصوير حوض المياه وصنبور المياه والمياه تنزل:</strong> للتأكد من قيامك من الفراش وبدء الوضوء لسريان البركة.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                2
              </span>
              <p>
                <strong>تصوير سجادة الصلاة:</strong> مفروشة في اتجاه القبلة جاهزة لأداء الركعتين والفريضة.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* TEST ALARM NOW BUTTON */}
          <button
            onClick={() => {
              onClose();
              onTriggerTestAlarm();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>تجربة واختبار المنبه وشروطه الآن</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            حفظ وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
