import React from 'react';
import { X, Shield, Lock, Bell, BatteryCharging, Radio, Check } from 'lucide-react';

interface BackgroundGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackgroundGuideModal: React.FC<BackgroundGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-emerald-700/40 rounded-3xl p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">دليل التشغيل في الخلفية</h3>
            <p className="text-xs text-slate-400">استمتع بالبث أثناء تصفح التطبيقات أو عند قفل الشاشة</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">التحكم من شاشة القفل (Lock Screen):</h4>
              <p className="leading-relaxed">
                بفضل تقنية <strong className="text-amber-400">Media Session API</strong>، تظهر لوحة التحكم بالإذاعة (اسم المحطة، صورة الغلاف، أزرار الإيقاف والتشغيل والتنقل) مباشرة على شاشة قفل هاتفك دون الحاجة لفتح القفل!
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">شريط الإشعارات العلوي:</h4>
              <p className="leading-relaxed">
                ستجد إشعار البث الصوتي دائماً في شريط الإشعارات بهاتفك الأندرويد، للتحكم في الصوت فوراً في أي لحظة.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <BatteryCharging className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">نصيحة لمنع إيقاف النظام للصوت (تحسين البطارية):</h4>
              <p className="leading-relaxed mb-2">
                تقوم بعض أجهزة أندرويد (مثل سامسونج، شاومي، هواوي) بإيقاف التطبيقات التي تعمل في الخلفية لتوفير البطارية. لضمان تشغيل متواصل 24 ساعة:
              </p>
              <ul className="space-y-1.5 list-disc list-inside text-slate-300 pr-2">
                <li>اذهب إلى إعدادات الهاتف &gt; التطبيقات &gt; Chrome (أو أثير الهدى).</li>
                <li>اختر <strong>البطارية (Battery)</strong> &gt; اضبطه على <strong>غير مقيّد (Unrestricted)</strong>.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition cursor-pointer"
          >
            تم، شكراً لكم
          </button>
        </div>
      </div>
    </div>
  );
};
