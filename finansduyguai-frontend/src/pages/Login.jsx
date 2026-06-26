import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, BrainCircuit, TrendingUp, ArrowRight, Play, CheckCircle2, Activity, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ email: "", sifre: "", adSoyad: "", telefon: "" });
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [yorumlar, setYorumlar] = useState([]);
  const [yeniYorum, setYeniYorum] = useState({ baslik: "", icerik: "" });
  const [yorumYukleniyor, setYorumYukleniyor] = useState(false);
  const [yorumHata, setYorumHata] = useState("");

  // Misafir (Guest) Modu Aktifleştirme Fonksiyonu
  const handleGuestMode = () => {
    sessionStorage.setItem("token", "guest-token-12345");
    sessionStorage.setItem("user", JSON.stringify({ id: 0, adSoyad: "Misafir Kullanıcı", email: "guest@finansduyguai.com" }));
    sessionStorage.setItem("isGuest", "true");
    navigate("/upload");
  };
  // State'lerin yanına ekle
  const [token, setToken] = useState(sessionStorage.getItem("token"));
  const [mevcutKullanici, setMevcutKullanici] = useState(
    sessionStorage.getItem("isGuest") !== "true" && 
    sessionStorage.getItem("token") !== null
);
  const handleYorumGonder = async (e) => {
  e.preventDefault();
  if (!yeniYorum.icerik.trim()) return;

  setYorumYukleniyor(true);
  setYorumHata("");

  // Session veya LocalStorage'dan JWT token'ı alıyoruz
  const token = sessionStorage.getItem("token"); 

   if (!token || token === "guest-token-12345") {
    setYorumHata("Yorum yapabilmek için lütfen önce giriş yapın.");
    return;
  }

  try {
    const res = await fetch("https://localhost:7181/api/Yorum", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // Backend'deki [Authorize] koruması için şart
      },
      body: JSON.stringify(yeniYorum)
    });

    if (res.ok) {
      setYeniYorum({ baslik: "", icerik: "" }); // Formu temizle
      
      // Listeyi yenilemek için API'ye tekrar GET isteği atıyoruz
      const yeniListeRes = await fetch("https://localhost:7181/api/Yorum");
      const yeniVeri = await yeniListeRes.json();
      setYorumlar(yeniVeri);
    } else if (res.status === 401) {
      setYorumHata("Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapın.");
    } else {
      setYorumHata("Yorum kaydedilirken bir hata oluştu.");
    }
  } catch (error) {
    setYorumHata("Sunucuyla bağlantı kurulamadı.");
  } finally {
    setYorumYukleniyor(false);
  }
};
  useEffect(() => {

    fetch("https://localhost:7181/api/Yorum")
        .then(res => res.json())
        .then(data => setYorumlar(data))
        .catch(err => console.log(err));

}, []);

  const handleAuth = async () => {
    setYukleniyor(true);
    setHata("");
    const url = isRegister
      ? "https://localhost:7181/api/Kullanici"
      : "https://localhost:7181/api/Kullanici/login";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const text = await res.text();
      let data = text ? JSON.parse(text) : null;

      if (res.ok && data) {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("user", JSON.stringify({ id: data.id, adSoyad: data.adSoyad, email: data.email }));
        sessionStorage.setItem("isGuest", "false");
        setToken(data.token);
        setMevcutKullanici(true);
        navigate(isRegister ? "/upload" : "/dashboard");
      } else {
        setHata(typeof data === "string" ? data : "Giriş başarısız.");
      }
    } catch (error) {
      setHata("Sunucuya bağlanılamadı.");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-950 selection:bg-blue-600 selection:text-white">
      
      {/* FIXED/STICKY NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-6 md:px-12 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <BrainCircuit size={28} className="text-blue-600" />
          <span className="text-lg font-bold tracking-tight text-slate-900">
            FinansDuygu<span className="text-blue-600">AI</span>
          </span>
        </div>
        
        {/* Orta Navigasyon Linkleri */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
          <a href="#ozellikler" className="hover:text-slate-900 transition">Özellikler</a>
          <a href="#ozellikler" className="hover:text-slate-900 transition">Teknoloji</a>
          <a href="#tanitim" className="hover:text-slate-900 transition">Önizleme</a>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setIsRegister(false); window.scrollTo({top: 0, behavior: 'smooth'}); }}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
          >
          </button>
          <button
            onClick={handleGuestMode}
            className="group flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 shadow-lg shadow-blue-600/10"
          >
            Hemen Dene <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative pt-32 pb-20 md:py-40 px-6 md:px-12 max-w-7xl mx-auto min-h-[90vh] flex flex-col justify-center">
        
        {/* Arka Plandaki Yumuşak Işık Oyunları (Açık tema için optimize edildi) */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-600/5 rounded-full blur-[150px] pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Sol Taraf: Metinler ve Güven Veren Maddeler */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              Harcama ve Duygu Analizi
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15]"
            >
              Paranızın Sadece Miktarını Değil, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Duygusunu</span> Da Yönetin.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl"
            >
              Sadece harcamalarınızı değil, harcama yaparken ne hissettiğinizi de analiz edin. Yapay zeka desteğiyle anomali tespiti yapın ve bütçenizi koruyun.
            </motion.p>

            {/* Hızlı Güven Maddeleri */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-sm text-slate-700 font-medium"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-600" /> %100 Gizlilik ve Güvenli Veri Tabanı
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-600" /> ML.NET ve Python NLP Altyapısı
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-600" /> Anlık Duygu-Harcama Korelasyonu
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-600" /> Kolay CSV / Banka Ekstresi Aktarımı
              </div>
            </motion.div>

            {/* Aksiyon Butonları */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={handleGuestMode}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-base shadow-lg shadow-blue-600/10 transition-all duration-300"
              >
                Hemen Misafir Olarak Dene
              </button>
              <a
                href="#tanitim"
                className="border-2 border-blue-600 bg-transparent text-blue-600 px-8 py-4 rounded-xl font-bold text-base hover:bg-blue-600 hover:text-white transition-all duration-300 text-center flex items-center justify-center"
              >
                Tanıtım Videosu
              </a>
            </div>
          </div>

          {/* Sağ Taraf: Görsel Üzerine Binen Form Alanı */}
          <div className="lg:col-span-5 relative w-full flex justify-center">
            
            {/* Arka Plandaki Bulanık Uygulama Önizlemesi */}
            <div className="absolute -inset-4 rounded-[2.5rem] overflow-hidden opacity-30 blur-sm pointer-events-none border border-slate-200">
              <img 
                src="/hero-image.png" 
                alt="Background App Preview" 
                className="w-full h-full object-cover scale-110"
              />
            </div>

            {/* Ön Plandaki Cam Efektli (Glassmorphism) Giriş Formu */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-200/60 relative z-10"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {isRegister ? "Hemen Hesap Oluştur" : "Hesabınıza Giriş Yapın"}
                </h2>
                <p className="text-xs text-slate-500 mt-1">Akıllı bütçeleme dünyasına ilk adımı atın.</p>
              </div>

              {hata && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl mb-4 text-center font-medium">
                  {hata}
                </div>
              )}

              <div className="space-y-4">
                {isRegister && (
                  <div className="space-y-1">
                    <input
                      type="text" 
                      placeholder="Ad Soyad"
                      className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition text-sm"
                      onChange={(e) => setFormData({ ...formData, adSoyad: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <input
                    type="email" 
                    placeholder="E-posta Adresi"
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition text-sm"
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <input
                    type="password" 
                    placeholder="Şifre"
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition text-sm"
                    onChange={(e) => setFormData({ ...formData, sifre: e.target.value })}
                  />
                </div>

                <button
                  onClick={handleAuth}
                  disabled={yukleniyor}
                  className="w-full bg-slate-900 hover:bg-blue-600 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-50 shadow-lg text-sm mt-2 flex items-center justify-center gap-2"
                >
                  {yukleniyor ? "Doğrulanıyor..." : isRegister ? "Ücretsiz Kaydı Tamamla" : " Giriş Yap"}
                </button>

                <div className="relative flex py-2 items-center text-xs text-slate-400">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3">VEYA</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <p
                  className="text-center text-xs text-blue-600 cursor-pointer hover:text-blue-700 transition font-medium"
                  onClick={() => { setIsRegister(!isRegister); setHata(""); }}
                >
                  {isRegister ? "Zaten bir hesabınız var mı? Giriş yapın" : "FinansDuyguAI'da yeni misiniz? Hesap açın"}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* BÜYÜK VİDEO/DASHBOARD ÖNİZLEME ALANI */}
<section id="tanitim" className="max-w-6xl mx-auto px-6 pb-24">
  <div className="text-center mb-10 space-y-2">
    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
      Sistemin Çalışma Mantığını İzleyin
    </h2>
    <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
      Yapay zekanın harcama ve duygu durum entegrasyonunu 2 dakikada keşfedin.
    </p>
  </div>
  
  <motion.div 
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="relative bg-white border border-slate-200 p-4 rounded-[2rem] shadow-2xl overflow-hidden group"
  >
    {/* Gerçek Tanıtım Videosu Butonu ve Karartma Katmanı */}
    <div className="absolute inset-0 bg-slate-900/20 opacity-100 transition duration-300 flex items-center justify-center z-20">
      <button className="h-20 w-20 bg-white hover:scale-110 text-orange-500 rounded-full flex items-center justify-center shadow-2xl transition duration-300 pl-1 group-hover:bg-orange-500 group-hover:text-white">
        <Play size={28} fill="currentColor" />
      </button>
    </div>
    <img 
      src="/hero-image.png" 
      alt="Dashboard Rapor Önizleme" 
      className="w-full h-auto object-cover rounded-[1.7rem] filter brightness-[0.9] group-hover:scale-[1.01] transition duration-700"
    />
  </motion.div>
</section>
      {/* ÖZELLİK / TEKNOLOJİ VİTRİNİ */}
<section id="ozellikler" className="bg-slate-50/50 py-24 px-6 md:px-12">
  <div className="max-w-7xl mx-auto">
    <div className="text-center mb-16">
      <span className="text-blue-600 text-xs font-bold uppercase tracking-[0.25em]">
        FinansDuyguAI
      </span>
      <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4 tracking-tight text-slate-900">
        Finansal Davranışlarınızı Daha İyi Anlayın
      </h2>
      <p className="text-slate-500 max-w-2xl mx-auto text-sm">
        Sayısal tabloları psikolojik analizlerle birleştiren tek entegre bütçe yönetimi çözümü.
      </p>
    </div>

    <div className="space-y-28">
      <ShowcaseRow
        eyebrow="DUYGU ANALİZİ"
        title="Her harcamanın arkasındaki duyguyu görün"
        desc="Kullanıcı harcama satırına kısa bir not ekler. Sistem bu nottan duygu durumunu çıkarır, metnin pozitif veya negatif tonunu analiz eder ve harcamayı bu bağlamla birlikte raporlar."
        imageSide="right"
        visual={<EmotionMock />}
      />

      <ShowcaseRow
        eyebrow="ANOMALİ TESPİTİ"
        title="Olağan dışı harcamaları hızlıca yakalayın"
        desc="ML.NET destekli anomali tespiti, harcama alışkanlıklarınızın dışına çıkan işlemleri belirler. Böylece bütçenizi zorlayan davranışları daha erken fark edebilirsiniz."
        imageSide="left"
        visual={<AnomalyMock />}
      />

      <ShowcaseRow
        eyebrow="AKILLI ÖNERİLER"
        title="Teknik ve davranışsal önerileri birlikte alın"
        desc="Groq destekli öneri motoru; kategori dağılımı, anomali kayıtları ve duygu notlarını birlikte değerlendirerek anlaşılır, uygulanabilir ve kişiselleştirilmiş aksiyon planları üretir."
        imageSide="right"
        visual={<AdviceMock />}
      />
    </div>
  </div>
</section>
{/* GERÇEK KULLANICI YORUMLARI (VERİTABANINDAN DİNAMİK) */}
      <section className="bg-[#fff3ea] py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* SOL TARAF: FORUM */}
          <div className="lg:col-span-4 bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border border-white sticky top-24">
            <span className="text-orange-500 text-xs font-black uppercase tracking-[0.25em]">Deneyiminizi Paylaşın</span>
            <h3 className="text-xl font-bold text-slate-900 mt-2 mb-4">Topluluğa Katılın</h3>
            
            {yorumHata && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl mb-3 font-medium border border-red-100">
                {yorumHata}
              </div>
            )}

            <form onSubmit={handleYorumGonder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Konu Başlığı</label>
                <input
                  type="text"
                  placeholder="Örn: Bütçe Planlaması"
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm outline-none focus:border-blue-600"
                  value={yeniYorum.baslik}
                  onChange={(e) => setYeniYorum({ ...yeniYorum, baslik: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Yorumunuz *</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Deneyiminizi buraya yazın..."
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm outline-none focus:border-blue-600 resize-none"
                  value={yeniYorum.icerik}
                  onChange={(e) => setYeniYorum({ ...yeniYorum, icerik: e.target.value })}
                ></textarea>
              </div>
              <button type="submit" disabled={yorumYukleniyor} className="w-full bg-slate-900 hover:bg-orange-500 text-white py-3 rounded-xl font-bold text-sm transition shadow-md disabled:opacity-50">
                {yorumYukleniyor ? "Gönderiliyor..." : "Yorumu Yayınla"}
              </button>
            </form>
          </div>

          {/* SAĞ TARAF: LİSTE */}
          <div className="lg:col-span-8 space-y-6">
            <div>
              <span className="text-orange-500 text-xs font-black uppercase tracking-[0.25em]">Kullanıcı Yorumları</span>
              <h2 className="text-3xl font-bold text-slate-900 mt-1">Finansal davranışlarını fark edenler</h2>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2" style={{ scrollbarWidth: "thin" }}>
              {yorumlar.length === 0 ? (
                <div className="bg-white/50 backdrop-blur-sm p-8 rounded-[2.5rem] text-center border border-white">
                  <p className="text-slate-500 font-medium text-sm">Henüz bir yorum paylaşılmamış. İlk yorumu siz yapın!</p>
                </div>
              ) : (
                yorumlar.map((item) => (
                  <TestimonialCard 
                    key={item.id} 
                    name={item.kullanici || "Anonim Kullanıcı"} 
                    source="Üye" 
                    quote={item.icerik} 
                    baslik={item.baslik}
                    begeni={item.begeniSayisi || 0}
                    tarih={item.tarih}
                  />
                ))
              )}
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}

// TESTIMONIAL CARD BİLEŞENİ (Login dışına, en alta alındı)
function TestimonialCard({ name, source, quote, baslik, begeni, tarih }) {
  const palettes = [{ bg: "#ede0ff" }, { bg: "#dbeafe" }, { bg: "#fce7f3" }, { bg: "#d1fae5" }, { bg: "#fef3c7" }];
  const { bg } = palettes[name.charCodeAt(0) % palettes.length];
  const formatliTarih = new Date(tarih).toLocaleDateString('tr-TR');

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="w-full flex items-stretch rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 bg-white">
      <div className="w-32 flex-shrink-0 overflow-hidden hidden sm:block" style={{ background: bg }}>
        <HalftoneAvatar name={name} />
      </div>
      <div className="flex-1 flex flex-col justify-between p-6">
        <div>
          <div className="flex justify-between items-start mb-1">
            <svg className="w-5 h-5 text-slate-200" fill="currentColor" viewBox="0 0 32 24">
              <path d="M0 24V14.4C0 6.48 4.32 1.68 12.96 0l1.44 2.88C10.08 4.08 7.68 6.96 7.2 10.8H12V24H0zm18 0V14.4C18 6.48 22.32 1.68 30.96 0l1.44 2.88c-4.32 1.2-6.72 4.08-7.2 7.92H30V24H18z" />
            </svg>
            <span className="text-[10px] text-slate-400 font-medium">{formatliTarih}</span>
          </div>
          {baslik && <h4 className="text-sm font-bold text-slate-900 mb-1">{baslik}</h4>}
          <p className="text-sm leading-relaxed text-slate-700 font-medium">"{quote}"</p>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{name}</p>
            <span className="text-[10px] text-blue-600 font-bold">{source}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <span className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-100">
              👍 {begeni} Beğeni
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
function HalftoneAvatar({ name }) {
  const palettes = [
    { bg: "#ede0ff", dots: "#7c3aed" },
    { bg: "#dbeafe", dots: "#2563eb" },
    { bg: "#fce7f3", dots: "#db2777" },
    { bg: "#d1fae5", dots: "#059669" },
    { bg: "#fef3c7", dots: "#d97706" },
  ];
  const { bg, dots } = palettes[name.charCodeAt(0) % palettes.length];
  const cols = 10, rows = 14, cx = cols / 2, cy = rows / 2;
  const circles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dx = (c - cx) / cx, dy = (r - cy) / cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const size = Math.max(1, (1 - Math.min(dist, 1)) * 6);
      if (dist < 1.1) circles.push(
        <circle key={`${r}-${c}`} cx={c * 11 + 6} cy={r * 11 + 6} r={size * 0.7} fill={dots} opacity={Math.max(0.15, 1 - dist * 0.85)} />
      );
    }
  }
  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden" style={{ background: bg }}>
      <svg viewBox="0 0 116 160" width="116" height="160" className="absolute inset-0 m-auto">{circles}</svg>
    </div>
  );
}

function ShowcaseRow({ eyebrow, title, desc, visual, imageSide = "right" }) {
  const text = (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="flex flex-col justify-center">
      <span className="text-orange-500 text-xs font-bold uppercase tracking-[0.22em] mb-4">{eyebrow}</span>
      <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight mb-5">{title}</h3>
      <p className="text-slate-600 text-base leading-7 max-w-xl">{desc}</p>
    </motion.div>
  );
  const visualBlock = (
    <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }} className="relative min-h-[360px] flex items-center justify-center">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />
      <div className="relative z-10 w-full">{visual}</div>
    </motion.div>
  );
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
      {imageSide === "left" ? <>{visualBlock}{text}</> : <>{text}{visualBlock}</>}
    </div>
  );
}

function EmotionMock() {
  return (
    <div className="relative mx-auto max-w-md">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div><p className="text-xs text-slate-400 font-bold uppercase">Duygu Notu</p><h4 className="text-slate-900 font-bold">Trendyol Alışverişi</h4></div>
          <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-xs font-bold">Stresli</span>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 leading-6 mb-4">"Çok stresliydim, düşünmeden alışveriş yaptım."</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-2xl p-4"><p className="text-xs text-blue-500 font-bold">Metin Tonu</p><p className="text-lg font-bold text-blue-700">Negatif</p></div>
          <div className="bg-rose-50 rounded-2xl p-4"><p className="text-xs text-rose-500 font-bold">Tutar</p><p className="text-lg font-bold text-rose-700">-850 ₺</p></div>
        </div>
      </div>
      <div className="absolute -top-8 -right-8 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 hidden sm:block">
        <p className="text-xs text-slate-400 font-bold">AI Güven Skoru</p>
        <p className="text-2xl font-bold text-emerald-600">%96</p>
      </div>
    </div>
  );
}

function AnomalyMock() {
  return (
    <div className="relative mx-auto max-w-md">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div><p className="text-xs text-slate-400 font-bold uppercase">Son İşlemler</p><h4 className="text-slate-900 font-bold">Anomali Kontrolü</h4></div>
          <Activity className="text-blue-600" />
        </div>
        {[["Market","Normal","-420 ₺","text-slate-400"],["Elektronik","ANOMALİ","-4.800 ₺","text-orange-500"],["Kahve","Normal","-95 ₺","text-slate-400"],["Restoran","ANOMALİ","-1.250 ₺","text-orange-500"]].map(([n,s,a,c],i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-slate-50 last:border-0">
            <div><p className="font-bold text-slate-800 text-sm">{n}</p><p className={`text-xs font-bold ${c}`}>{s}</p></div>
            <p className="font-bold text-rose-600">{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdviceMock() {
  return (
    <div className="relative mx-auto max-w-md">
      <div className="bg-slate-900 rounded-3xl shadow-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-blue-500/20 text-blue-300 p-3 rounded-2xl"><Sparkles size={22} /></div>
          <div><p className="text-xs text-slate-400 font-bold uppercase">Akıllı Öneri</p><h4 className="font-bold">Davranışsal Finans Raporu</h4></div>
        </div>
        <div className="space-y-3">
          <div className="bg-white/10 border border-white/10 rounded-2xl p-4 text-sm text-slate-200 leading-6">Stresli olduğunuz işlemlerde harcama tutarı yükseliyor. Alışveriş öncesi 10 dakika bekleme kuralı uygulayın.</div>
          <div className="bg-white/10 border border-white/10 rounded-2xl p-4 text-sm text-slate-200 leading-6">Market ve yemek kategorisinde haftalık limit belirlemek bütçe kontrolünü güçlendirebilir.</div>
        </div>
      </div>
      <div className="absolute -bottom-8 -left-8 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 hidden sm:block">
        <p className="text-xs text-slate-400 font-bold">Aksiyon Planı</p>
        <p className="text-lg font-bold text-blue-600">4 adım hazır</p>
      </div>
    </div>
  );
}
