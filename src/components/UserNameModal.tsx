import React, { useState, useEffect } from 'react';
import { User, Volume2, Check, Sparkles, X, Heart, ShieldCheck, Sun, Flame, MessageSquare } from 'lucide-react';

interface UserNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSaveName: (name: string) => void;
  isInitialPrompt?: boolean;
}

export const UserNameModal: React.FC<UserNameModalProps> = ({
  isOpen,
  onClose,
  currentName,
  onSaveName,
  isInitialPrompt = false,
}) => {
  const [nameInput, setNameInput] = useState<string>(currentName || '');
  const [isPlayingTest, setIsPlayingTest] = useState<boolean>(false);

  useEffect(() => {
    setNameInput(currentName || '');
  }, [currentName]);

  if (!isOpen) return null;

  // Egyptian friendly suggestions
  const suggestions = ['يا بطل', 'محمد', 'خالد', 'يا هندسة', 'يا باشا', 'أبو حميد', 'يا كابتن', 'يا حج', 'أحمد'];

  const fallbackBrowserSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setIsPlayingTest(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-EG';
    utterance.pitch = 0.95;
    utterance.rate = 0.98;
    utterance.volume = 1.0;
    utterance.onend = () => setIsPlayingTest(false);
    utterance.onerror = () => setIsPlayingTest(false);
    window.speechSynthesis.speak(utterance);
  };

  const playVoiceTest = () => {
    setIsPlayingTest(true);
    const targetName = nameInput.trim() || 'يا بطل';
    const sampleText = `اصحى يا ${targetName}! قوم يا بطل، الفجر أذن والصلاة خير من النوم! يلا فز من السرير، اتوضا وصلي وخد بركة اليوم!`;

    try {
      const audio = new Audio(`/api/tts-audio?text=${encodeURIComponent(sampleText)}`);
      audio.onended = () => setIsPlayingTest(false);
      audio.onerror = () => fallbackBrowserSpeech(sampleText);
      audio.play().catch(() => fallbackBrowserSpeech(sampleText));
    } catch {
      fallbackBrowserSpeech(sampleText);
    }
  };

  const handleSave = () => {
    const finalName = nameInput.trim() || 'يا بطل';
    onSaveName(finalName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 text-right">
        {!isInitialPrompt && (
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 shrink-0">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
              <span>تخصيص نداء الفجر (بالمصري)</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
            <p className="text-xs text-emerald-400 font-bold">
              نداء حي وبشري دافئ يشجعك على القيام والنشاط لصلاة الفجر
            </p>
          </div>
        </div>

        {/* Notes & Encouragements on Name & Waking Up */}
        <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-950 to-emerald-950/30 border border-amber-500/40 text-xs text-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
            <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            <span>تنويه حول النداء والحث على الصلاة:</span>
          </div>
          <p className="leading-relaxed text-slate-300 text-[11px]">
            • المنبه مش مجرد صوت مزعج، ده هيناديك <strong className="text-amber-300">باللهجة المصرية وصوت بشري حقيقي</strong> كأنه أخوك أو صاحبك الجدع بيصحيك بحماس ومحبة عشان ميفوتكش الفجر.
          </p>
          <p className="leading-relaxed text-slate-300 text-[11px]">
            • <strong className="text-emerald-400">«الصلاة خير من النوم»:</strong> أول ما تسمع النداء، ارمي الغطا وفز للحوض، لأن خطوة الوضوء بتفك عقد الكسل وتملأ يومك كله رزق وبركة.
          </p>
          <p className="leading-relaxed text-slate-300 text-[11px]">
            • اكتب اسمك الشخصي، أو اللقب اللي بتحبه في البيت أو وسط صحابك (زي: يا هندسة، يا باشا، يا كابتن، أبو فلان).
          </p>
        </div>

        {/* Input */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-amber-300 mb-1.5">
            اكتب اسمك أو اللقب اللي تحب نناديك بيه:
          </label>
          <div className="relative">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="مثال: خالد، محمد، يا هندسة، يا باشا..."
              maxLength={25}
              className="w-full py-3 pr-10 pl-4 rounded-xl bg-slate-950 border border-emerald-500/50 text-white font-bold text-sm focus:outline-none focus:border-amber-400 transition"
              autoFocus={isInitialPrompt}
            />
            <User className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Egyptian Suggestions Chips */}
        <div className="mb-5">
          <p className="text-[11px] text-slate-400 mb-2 font-medium">ألقاب وأسماء مقترحة سريعة:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setNameInput(sug)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  nameInput === sug
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-amber-500/50'
                }`}
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Human Egyptian Voice Preview Button */}
        <div className="mb-5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
          <div className="text-right">
            <p className="text-xs font-bold text-white mb-0.5">الصوت البشري المصري:</p>
            <p className="text-[11px] text-slate-400">نبرة طبيعية دافئة باللهجة المصرية تصحيك بهمة</p>
          </div>
          <button
            type="button"
            onClick={playVoiceTest}
            disabled={isPlayingTest}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition shrink-0 cursor-pointer active:scale-95 shadow-md"
          >
            <Volume2 className={`w-4 h-4 ${isPlayingTest ? 'animate-bounce text-amber-400' : ''}`} />
            <span>{isPlayingTest ? 'بيصحيك دلوقتي...' : 'اسمع الصوت المصري'}</span>
          </button>
        </div>

        {/* Motivational Prophetic Note */}
        <div className="mb-5 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>قال رسول الله ﷺ: «من صلّى الصبح فهو في ذمّة الله» — يومك في رعاية الله وحفظه.</span>
        </div>

        {/* Save button */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span>حفظ والبدء بنداء الفجر المصري</span>
          </button>
          {!isInitialPrompt && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs text-slate-400 hover:text-white transition cursor-pointer"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
