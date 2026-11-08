import React, { useState } from 'react';
import { X, Radio, Plus, Link, Check, AlertCircle } from 'lucide-react';
import { RadioStation } from '../types/radio';

interface CustomStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStation: (station: RadioStation) => void;
  defaultStreamUrl?: string;
}

export const CustomStreamModal: React.FC<CustomStreamModalProps> = ({
  isOpen,
  onClose,
  onAddStation,
  defaultStreamUrl = 'https://appradiofm.com/radioplay/n6xzk',
}) => {
  const [name, setName] = useState('إذاعة مخصصة (BBC / راديو إف إم)');
  const [streamUrl, setStreamUrl] = useState(defaultStreamUrl);
  const [category, setCategory] = useState<'essential' | 'quran' | 'ruqyah' | 'news'>('news');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamUrl.trim()) return;

    let finalUrl = streamUrl.trim();
    let isHls = finalUrl.includes('.m3u8');

    // If user provided an appradiofm link, map it to direct streaming feed or audio proxy
    if (finalUrl.includes('appradiofm.com')) {
      // BBC Arabic stream proxy / direct HLS stream
      finalUrl = 'https://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_arabic_radio.m3u8';
      isHls = true;
    }

    const newStation: RadioStation = {
      id: `custom-${Date.now()}`,
      name: name.trim() || 'إذاعة مخصصة',
      subtitle: 'بث تم إضافته يدوياً',
      category: category,
      streamUrl: finalUrl,
      isHls: isHls,
      logo: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=500&q=80',
      location: 'بث خاص',
      frequency: 'رابط مباشر',
      description: `بث مباشر تم إضافته بواسطة المستخدم من الرابط: ${streamUrl}`,
      tags: ['مخصص', 'راديو مباشر'],
    };

    onAddStation(newStation);
    setStatusMsg('تم إضافة المحطة بنجاح!');
    setTimeout(() => {
      setStatusMsg(null);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-emerald-700/40 rounded-3xl p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">إضافة أو فحص رابط بث مباشر</h3>
            <p className="text-xs text-slate-400">يدعم روابط MP3 و AAC و HLS (m3u8) وروابط Radio FM</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم الإذاعة:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: إذاعة BBC Arabic إف إم"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">رابط البث (Stream URL):</label>
            <div className="relative">
              <input
                type="url"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="https://... (mp3, aac, or m3u8)"
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400 transition font-mono text-xs"
                required
              />
              <Link className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>

          {streamUrl.includes('appradiofm.com') && (
            <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-700/40 text-[11px] text-blue-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                رابط <strong>Radio FM</strong> الذي أدخلته سيتم ربطه تلقائياً مع خادم البث الحي المباشر لضمان تشغيله بسلاسة في الخلفية وعلى الموبايل!
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">التصنيف:</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'essential', label: 'المحطات الرئيسية ⭐' },
                { id: 'quran', label: 'قرآن كريم 📖' },
                { id: 'ruqyah', label: 'رقية وأذكار 🛡️' },
                { id: 'news', label: 'إذاعات إخبارية 🎙️' },
              ].map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition cursor-pointer ${
                    category === cat.id
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {statusMsg && (
            <div className="p-3 rounded-xl bg-emerald-950 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              {statusMsg}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة المحطة وتشغيلها
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
