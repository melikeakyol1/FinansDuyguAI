import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";

const DUYGULAR = [
  { value: "Normal",  emoji: "😐", label: "Normal",  bg: "bg-slate-100",   ring: "ring-slate-400",   text: "text-slate-700",   activeBg: "bg-slate-800",   activeText: "text-white" },
  { value: "Mutlu",   emoji: "😊", label: "Mutlu",   bg: "bg-yellow-50",   ring: "ring-yellow-400",  text: "text-yellow-700",  activeBg: "bg-yellow-400",  activeText: "text-white" },
  { value: "Stresli", emoji: "😰", label: "Stresli", bg: "bg-rose-50",     ring: "ring-rose-400",    text: "text-rose-700",    activeBg: "bg-rose-500",    activeText: "text-white" },
  { value: "Üzgün",   emoji: "😢", label: "Üzgün",   bg: "bg-blue-50",     ring: "ring-blue-400",    text: "text-blue-700",    activeBg: "bg-blue-500",    activeText: "text-white" },
  { value: "Kaygılı", emoji: "😟", label: "Kaygılı", bg: "bg-orange-50",   ring: "ring-orange-400",  text: "text-orange-700",  activeBg: "bg-orange-500",  activeText: "text-white" },
  { value: "Yorgun",  emoji: "😴", label: "Yorgun",  bg: "bg-purple-50",   ring: "ring-purple-400",  text: "text-purple-700",  activeBg: "bg-purple-500",  activeText: "text-white" },
];

export default function Duygu() {
  const navigate = useNavigate();
  const rawUser = sessionStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;
  const token = sessionStorage.getItem("token");

  const [duygu, setDuygu] = useState("Normal");
  const [aciklama, setAciklama] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [sonuc, setSonuc] = useState(null);
  const [hata, setHata] = useState("");

  const kaydet = async () => {
    if (!user || !token) { navigate("/"); return; }
    setKaydediliyor(true);
    setHata("");
    setSonuc(null);
    try {
      const res = await fetch("https://localhost:7181/api/Duygu", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ kullaniciID: user.id, tarih: new Date().toISOString(), duygu, aciklama })
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Duygu kaydı oluşturulamadı.");
      setSonuc(data);
      setAciklama("");
    } catch (err) {
      setHata(err.message);
    } finally {
      setKaydediliyor(false);
    }
  };

  const secili = DUYGULAR.find(d => d.value === duygu);

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{
        background: "radial-gradient(ellipse at 20% 50%, #ede9fe 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #dbeafe 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, #fce7f3 0%, transparent 50%), #f8fafc"
      }}
    >
      {/* Dekoratif daireler */}
      <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-violet-200/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full bg-pink-200/30 blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] left-[10%] w-40 h-40 rounded-full bg-blue-200/20 blur-2xl pointer-events-none" />

      {/* Topbar */}
      <div className="relative z-10 p-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-slate-500 hover:text-violet-600 font-medium text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Dashboard'a dön
        </button>
      </div>

      {/* İçerik */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-lg">

          {/* Başlık */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white shadow-lg shadow-violet-100 border border-violet-100 mb-4">
              <Brain size={28} className="text-violet-600" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Bugün nasılsın?
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              Duygu durumunu kaydet, harcama alışkanlıklarınla ilişkilendirelim.
            </p>
          </div>

          {/* Ana kart */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-xl shadow-slate-200/60 p-7">

            {/* Duygu seçici */}
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
              Ruh halini seç
            </p>
            <div className="grid grid-cols-3 gap-3 mb-7">
              {DUYGULAR.map((d) => {
                const isActive = duygu === d.value;
                return (
                  <button
                    key={d.value}
                    onClick={() => setDuygu(d.value)}
                    className={`
                      flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl border-2 transition-all duration-200 font-semibold text-sm
                      ${isActive
                        ? `${d.activeBg} ${d.activeText} border-transparent shadow-lg scale-105`
                        : `bg-white ${d.text} border-slate-100 hover:border-slate-200 hover:scale-105`
                      }
                    `}
                  >
                    <span className="text-2xl">{d.emoji}</span>
                    <span>{d.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Seçili duygu göstergesi */}
            <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 mb-6 ${secili.bg} border border-white`}>
              <span className="text-2xl">{secili.emoji}</span>
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${secili.text}`}>Seçilen duygu</p>
                <p className={`font-black text-base ${secili.text}`}>{secili.label}</p>
              </div>
              <Sparkles size={16} className={`ml-auto ${secili.text} opacity-60`} />
            </div>

            {/* Açıklama */}
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
              Ne hissediyorsun? (isteğe bağlı)
            </p>
            <div className="relative">
              <textarea
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                placeholder="Örn: Bugün çok stresliydim ve gereksiz alışveriş yaptım..."
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 min-h-28 outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none text-sm text-slate-700 placeholder-slate-300 transition-all"
              />
              <span className="absolute bottom-3 right-4 text-[11px] text-slate-300">
                {aciklama.length} / 300
              </span>
            </div>

            {/* Hata */}
            {hata && (
              <div className="mt-4 bg-red-50 text-red-600 border border-red-100 px-4 py-3 rounded-2xl text-sm flex gap-2 items-start">
                <span>⚠️</span> {hata}
              </div>
            )}

            {/* Başarı */}
            {sonuc && (
              <div className="mt-4 bg-emerald-50 border border-emerald-100 px-4 py-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <p className="text-sm font-bold text-emerald-700">Duygu kaydedildi!</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 bg-white rounded-xl px-3 py-2 border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Metin Analizi</p>
                    <p className="text-sm font-black text-slate-800">{sonuc.metinDuygusu}</p>
                  </div>
                  <div className="flex-1 bg-white rounded-xl px-3 py-2 border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Güven Skoru</p>
                    <p className="text-sm font-black text-slate-800">{Number(sonuc.guvenSkoru).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Buton */}
            <button
              onClick={kaydet}
              disabled={kaydediliyor}
              className={`
                w-full mt-6 py-4 rounded-2xl font-black text-base transition-all duration-200 flex items-center justify-center gap-2
                ${kaydediliyor
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : `${secili.activeBg} ${secili.activeText} hover:opacity-90 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`
                }
              `}
            >
              {kaydediliyor ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Analiz ediliyor...
                </>
              ) : (
                <><Sparkles size={16} /> Duygumu Kaydet</>
              )}
            </button>
          </div>

          {/* Alt not */}
          <p className="text-center text-xs text-slate-400 mt-5">
            Duygu notların harcama alışkanlıklarınla ilişkilendirilerek analiz edilir.
          </p>
        </div>
      </div>
    </div>
  );
}
