export type StationCategory = 'all' | 'essential' | 'quran' | 'ruqyah' | 'news' | 'favorites';

export interface RadioStation {
  id: string;
  name: string;
  subtitle: string;
  category: 'essential' | 'quran' | 'ruqyah' | 'news';
  streamUrl: string;
  backupStreamUrls?: string[];
  isHls?: boolean;
  logo: string;
  location: string;
  frequency?: string;
  description: string;
  tags: string[];
  isFeatured?: boolean;
}

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';
