export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface PrayerData {
  timings: PrayerTimings;
  date?: {
    readable: string;
    hijri?: {
      date: string;
      month: { ar: string };
      year: string;
      weekday: { ar: string };
    };
  };
  meta?: {
    timezone: string;
    method?: { name: string };
  };
}

export const ARAB_COUNTRIES = [
  { country: 'Egypt', nameAr: 'جمهورية مصر العربية', defaultCity: 'Cairo' },
  { country: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية', defaultCity: 'Makkah' },
  { country: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة', defaultCity: 'Dubai' },
  { country: 'Kuwait', nameAr: 'الكويت', defaultCity: 'Kuwait City' },
  { country: 'Qatar', nameAr: 'قطر', defaultCity: 'Doha' },
  { country: 'Jordan', nameAr: 'الأردن', defaultCity: 'Amman' },
  { country: 'Morocco', nameAr: 'المملكة المغربية', defaultCity: 'Casablanca' },
  { country: 'Algeria', nameAr: 'الجزائر', defaultCity: 'Algiers' },
  { country: 'Tunisia', nameAr: 'تونس', defaultCity: 'Tunis' },
  { country: 'Iraq', nameAr: 'العراق', defaultCity: 'Baghdad' },
  { country: 'Oman', nameAr: 'سلطنة عمان', defaultCity: 'Muscat' },
  { country: 'Bahrain', nameAr: 'مملكة البحرين', defaultCity: 'Manama' },
  { country: 'Palestine', nameAr: 'فلسطين (القدس الشريف)', defaultCity: 'Jerusalem' },
  { country: 'Lebanon', nameAr: 'لبنان', defaultCity: 'Beirut' },
  { country: 'Yemen', nameAr: 'اليمن', defaultCity: 'Sanaa' },
  { country: 'Sudan', nameAr: 'السودان', defaultCity: 'Khartoum' },
  { country: 'Libya', nameAr: 'ليبيا', defaultCity: 'Tripoli' },
  { country: 'United Kingdom', nameAr: 'بريطانيا / لندن', defaultCity: 'London' },
  { country: 'United States', nameAr: 'الولايات المتحدة', defaultCity: 'New York' },
];

export async function fetchPrayerTimes(
  country = 'Egypt',
  city = 'Cairo',
  coords?: { lat: number; lng: number }
): Promise<PrayerData> {
  try {
    let query = '';
    if (coords && coords.lat && coords.lng) {
      query = `lat=${coords.lat}&lng=${coords.lng}`;
    } else {
      query = `country=${encodeURIComponent(country)}&city=${encodeURIComponent(city)}`;
    }

    const res = await fetch(`/api/prayer-times?${query}`);
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
  } catch (e) {
    console.warn('Failed to fetch from API, using fallback:', e);
  }

  // Local fallback
  return {
    timings: {
      Fajr: '04:55',
      Sunrise: '06:22',
      Dhuhr: '11:46',
      Asr: '14:48',
      Maghrib: '17:10',
      Isha: '18:28',
    },
    meta: {
      timezone: 'Auto/Local',
      method: { name: 'الهيئة المصرية العامة للمساحة' },
    },
  };
}

export function calculateTimeUntilFajr(fajrTimeStr: string): {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isPastToday: boolean;
} {
  const [fHours, fMinutes] = fajrTimeStr.split(':').map(Number);
  const now = new Date();

  const fajrDate = new Date(now);
  fajrDate.setHours(fHours, fMinutes, 0, 0);

  let isPastToday = false;
  if (now.getTime() > fajrDate.getTime()) {
    // Fajr has passed today, next is tomorrow
    fajrDate.setDate(fajrDate.getDate() + 1);
    isPastToday = true;
  }

  const diffMs = fajrDate.getTime() - now.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds, totalSeconds, isPastToday };
}
