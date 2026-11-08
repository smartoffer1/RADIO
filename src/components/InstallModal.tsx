import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Smartphone, Download, Copy, Check, ExternalLink, ShieldCheck, Radio, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const { isInstallable, install } = usePWAInstall();

  const PUBLIC_APP_URL = 'https://ais-pre-g6n355p6xsx4qgq5kfro7f-468606382805.europe-west2.run.app';
  const currentUrl = typeof window !== 'undefined' && window.location.hostname.includes('europe-west2.run.app')
    ? window.location.href
    : PUBLIC_APP_URL;

  useEffect(() => {
    if (isOpen && currentUrl) {
      QRCode.toDataURL(currentUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#022c22',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.warn('QR Code generation error:', err));
    }
  }, [isOpen, currentUrl]);

  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [showQR, setShowQR] = useState<boolean>(false);

  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDirectInstall = async () => {
    await install();
  };

  const triggerFileDownload = () => {
    setIsDownloading(true);
    try {
      const link = document.createElement('a');
      link.href = '/api/download-app-file';
      link.download = 'athir-al-huda-radio.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadSuccess(true);
      }, 800);
    } catch (e) {
      setIsDownloading(false);
    }
  };

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent('إذاعة أثير الهدى وراديو الحرم المكي مع منبه الفجر الذكي: ' + currentUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 text-right">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40 shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              تثبيت وتحميل التطبيق للأندرويد
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-400">
              يعمل في الخلفية مع قفل الشاشة ومنبه الفجر الذكي
            </p>
          </div>
        </div>

        {/* 1. BEST & FASTEST OPTION: Open in Chrome to install native WebAPK */}
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-emerald-950/40 border-2 border-amber-500/60 shadow-xl text-right">
          <div className="flex items-center gap-2 mb-1.5 text-amber-300 font-bold text-sm">
            <ExternalLink className="w-4 h-4 text-amber-400 shrink-0" />
            <span>الطريقة الأولى (الموصى بها): تثبيت فوري كـ تطبيق أصلي</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            لأن متصفح المعاينة الحالي يمنع التثبيت المباشر، اضغط أدناه لفتح التطبيق في متصفح هاتفك (Chrome أو Brave)، وسيظهر لك خيار <strong className="text-emerald-400">«تثبيت التطبيق» (Install app)</strong> ليتم وضعه كأيقونة في شاشة هاتفك مع تشغيل في الخلفية!
          </p>
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>📱 فتح في Chrome وتثبيت التطبيق على الموبايل</span>
          </a>
        </div>

        {/* 2. OPTION 2: Generate APK via PWABuilder to send to friends */}
        <div className="mb-4 p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/40 text-right">
          <div className="flex items-center gap-2 mb-1 text-emerald-300 font-bold text-sm">
            <Download className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>الطريقة الثانية: توليد ملف APK للإرسال للأصدقاء</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            إذا كنت تريد ملفاً بصيغة <strong className="text-amber-400">.APK</strong> لإرساله عبر البلوتوث أو الواتساب، اضغط أدناه لتوليد ملف APK موقّع عبر أداة مايكروسوفت الرسمية (PWABuilder) بضغطة زر واحدة:
          </p>
          <a
            href={`https://www.pwabuilder.com?url=${encodeURIComponent(currentUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>🤖 توليد وتنزيل ملف APK عبر PWABuilder</span>
          </a>
        </div>

        {/* 3. OPTION 3: Share link directly to WhatsApp */}
        <div className="mb-4 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-right">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-200">
              💬 إرسال رابط التطبيق إلى الواتساب:
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
            </button>
          </div>
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>إرسال الرابط لنفسك أو لأصدقائك عبر WhatsApp للتثبيت في 5 ثوانٍ</span>
          </a>
        </div>

        {/* 4. OPTION 4: DOWNLOAD SOURCE ZIP FOR APK CONVERTER WEBSITES */}
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/40 text-right">
          <div className="flex items-center gap-2 mb-1.5 text-indigo-300 font-bold text-sm">
            <Download className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>الطريقة الثالثة: تحميل ملفات التطبيق (ZIP) لرفعها إلى مواقع تحويل الـ APK</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            إذا كنت تريد رفع ملفات التطبيق كاملة إلى أحد برامج أو مواقع تحويل الويب إلى APK (مثل <strong className="text-amber-400">Website 2 APK Builder</strong> أو <strong className="text-amber-400">AppsGeyser</strong> أو <strong className="text-amber-400">Web2App</strong>):
          </p>
          <a
            href="/api/download-apk-source-zip"
            download="AthirAlHuda-APK-Source.zip"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer mb-3"
          >
            <Download className="w-4 h-4" />
            <span>📥 تحميل ملفات التطبيق كاملة (AthirAlHuda-APK-Source.zip)</span>
          </a>

          {/* Guide Steps */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-indigo-900/40 text-[11px] text-slate-300 space-y-1.5">
            <p className="font-bold text-indigo-300 mb-1">📋 خطوات تحويل هذا الملف إلى APK في دقيقة:</p>
            <p className="leading-relaxed">1. قم بتنزيل ملف الـ <strong className="text-amber-400">ZIP</strong> بالضغط على الزر أعلاه.</p>
            <p className="leading-relaxed">2. افتح موقع <a href="https://appsgeyser.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline font-semibold">AppsGeyser</a> أو برنامج <span className="text-amber-400 font-semibold">Website 2 APK Builder</span>.</p>
            <p className="leading-relaxed">3. اختر خيار <strong className="text-white">«Upload ZIP / Website Archive»</strong> وقم باختيار الملف المحمل.</p>
            <p className="leading-relaxed">4. اضغط <strong className="text-emerald-400">«Generate APK»</strong> وسيتم تنزيل ملف الـ APK لجهازك فوراً لمشاركته مع أي شخص!</p>
          </div>
        </div>

        {/* Toggle QR code only for desktop users needing to scan from phone */}
        <div className="text-center mb-3">
          <button
            onClick={() => setShowQR(!showQR)}
            className="text-[11px] text-slate-400 hover:text-amber-300 transition cursor-pointer underline"
          >
            {showQR ? 'إخفاء رمز QR' : 'هل تتصفح من كمبيوتر؟ اضغط لعرض رمز QR لمسحه بالموبايل'}
          </button>
        </div>

        {showQR && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center mb-4 animate-fadeIn">
            <div className="inline-block p-2.5 rounded-xl bg-white shadow-xl mx-auto mb-2">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-36 h-36 rounded mx-auto"
                />
              )}
            </div>
            <p className="text-[11px] text-slate-400">امسح الكاميرا من هاتف الأندرويد لفتح التطبيق وتثبيته</p>
          </div>
        )}

        {/* Background Playback Notice */}
        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-200 mb-4">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-[12px] mb-0.5">ميزة التشغيل عند قفل الشاشة:</p>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                عند تثبيت التطبيق، يعمل البث في الخلفية دون أي انقطاع، مع إمكانية التحكم والإيقاف المؤقت من شاشة القفل وإشعارات أندرويد.
              </p>
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
