using System.Text;
using System.Text.Json;
using FinansalAnaliz.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace FinansalAnaliz.Services
{
    public class OneriSonuc
    {
        public string Mesaj { get; set; } = "";
        public string Kategori { get; set; } = "";
        public string Kaynak { get; set; } = "";
    }

    public class OneriGirdisi
    {
        public decimal ToplamGelir { get; set; }
        public decimal ToplamHarcama { get; set; }
        public decimal Net => ToplamGelir - ToplamHarcama;
        public decimal HarcamaOrani => ToplamGelir > 0 ? (ToplamHarcama / ToplamGelir) * 100 : 0;
        public string EnCokHarcananKategori { get; set; } = "";
        public int AnomaliSayisi { get; set; }
    }

    public class AiOneriService
    {
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IMemoryCache _cache;
        private readonly FinansalAnalizDbContext _context;

        public AiOneriService(IConfiguration config, IHttpClientFactory httpClientFactory, IMemoryCache cache, FinansalAnalizDbContext context)
        {
            _config = config;
            _httpClientFactory = httpClientFactory;
            _cache = cache;
            _context = context;
        }

        public async Task<List<OneriSonuc>> OneriUretAsync(OneriGirdisi girdi, int kullaniciId)
        {
            // Önbellekte varsa direkt döndür (10 dk)
            var cacheKey = $"ai_oneri_{kullaniciId}";
            if (_cache.TryGetValue(cacheKey, out List<OneriSonuc> cached))
                return cached;

            List<OneriSonuc> sonuclar;
            try
            {
                var apiKey = _config["Groq:ApiKey"];
                if (!string.IsNullOrEmpty(apiKey))
                {
                    sonuclar = await GroqOneriAsync(girdi, apiKey);
                    if (sonuclar != null && sonuclar.Count > 0)
                    {
                        _cache.Set(cacheKey, sonuclar, TimeSpan.FromMinutes(10));
                        return sonuclar;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GroqOneri] Hata: {ex.Message}");
            }

            // Groq başarısız olursa kural motoruna düş
            sonuclar = KuralTabanliOneri(girdi);
            _cache.Set(cacheKey, sonuclar, TimeSpan.FromMinutes(2));
            return sonuclar;
        }

        private async Task<List<OneriSonuc>> GroqOneriAsync(OneriGirdisi girdi, string apiKey)
        {
            var url = "https://api.groq.com/openai/v1/chat/completions";

            var prompt = $"Sen bir kisisel finans danismanisin. Asagidaki finansal ozete bakarak Turkce, kisa ve uygulanabilir 3 oneri uret.\n\n" +
                         $"Finansal Ozet:\n" +
                         $"- Toplam Gelir: {girdi.ToplamGelir:F0} TL\n" +
                         $"- Toplam Harcama: {girdi.ToplamHarcama:F0} TL\n" +
                         $"- Net Durum: {girdi.Net:F0} TL\n" +
                         $"- Harcama/Gelir Orani: %{girdi.HarcamaOrani:F0}\n" +
                         $"- En Cok Harcanan Kategori: {girdi.EnCokHarcananKategori}\n" +
                         $"- Anomali Sayisi: {girdi.AnomaliSayisi}\n\n" +
                         $"SADECE asagidaki formatta gecerli JSON dizisi don, baska hicbir sey yazma:\n" +
                         $"[{{\"mesaj\": \"oneri metni\", \"kategori\": \"Tasarruf\"}}, {{\"mesaj\": \"oneri metni\", \"kategori\": \"Uyari\"}}, {{\"mesaj\": \"oneri metni\", \"kategori\": \"Bilgi\"}}]\n" +
                         $"Kategori sadece su degerlerden biri olabilir: Tasarruf, Uyari, Bilgi";

            var requestBody = new
            {
                model = "llama-3.1-8b-instant",
                messages = new[]
                {
                    new { role = "system", content = "Sen bir finans danismanisin. Sadece JSON formatinda yanit verirsin, baska hicbir sey yazmazsin." },
                    new { role = "user", content = prompt }
                },
                max_tokens = 512,
                temperature = 0.7
            };

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Clear();
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync(url, content);
            var responseStr = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception($"Groq API hatasi: {response.StatusCode} - {responseStr}");

            // Groq yanit yapisi: choices[0].message.content
            using var doc = JsonDocument.Parse(responseStr);
            var text = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "[]";

            // Markdown fence temizle
            text = text.Trim();
            if (text.Contains("```"))
            {
                var start = text.IndexOf('[');
                var end = text.LastIndexOf(']');
                if (start >= 0 && end > start)
                    text = text[start..(end + 1)];
            }

            // JSON dizisi bul
            if (!text.StartsWith("["))
            {
                var start = text.IndexOf('[');
                var end = text.LastIndexOf(']');
                if (start >= 0 && end > start)
                    text = text[start..(end + 1)];
                else
                    return new List<OneriSonuc>();
            }

            var items = JsonSerializer.Deserialize<List<GroqOneriItem>>(text,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                ?? new List<GroqOneriItem>();

            return items.Select(o => new OneriSonuc
            {
                Mesaj = o.Mesaj,
                Kategori = o.Kategori,
                Kaynak = "Groq"
            }).ToList();
        }

        private class GroqOneriItem
        {
            public string Mesaj { get; set; } = "";
            public string Kategori { get; set; } = "";
        }
        public async Task<string> DetayliFinansalVeDuygusalOneriUretAsync(int kullaniciId)
        {
            var apiKey = _config["Groq:ApiKey"];

            if (string.IsNullOrWhiteSpace(apiKey))
                return "AI öneri servisi için Groq API anahtarı bulunamadı.";

            var url = "https://api.groq.com/openai/v1/chat/completions";

            var duygusalHarcamalar = await _context.FinansalVeriler
                .Where(f => f.KullaniciID == kullaniciId && f.Duygu != null && f.IslemTutari < 0)
                .OrderByDescending(f => f.Tarih)
                .ThenByDescending(f => f.Saat)
                .Take(10)
                .Select(f => new
                {
                    f.Aciklama,
                    f.IslemTutari,
                    f.Duygu,
                    f.MetinDuygusu,
                    f.DuyguNotu
                })
                .ToListAsync();

            var kategoriOzeti = await _context.FinansalVeriler
                .Include(f => f.Kategori)
                .Where(f => f.KullaniciID == kullaniciId && f.IslemTutari < 0)
                .GroupBy(f => f.Kategori != null ? f.Kategori.KategoriAdi : "Bilinmiyor")
                .Select(g => new
                {
                    Kategori = g.Key,
                    Toplam = Math.Abs(g.Sum(x => x.IslemTutari))
                })
                .OrderByDescending(x => x.Toplam)
                .Take(8)
                .ToListAsync();

            var anomaliOzeti = await _context.Anomaliler
                .Where(a => a.KullaniciID == kullaniciId)
                .OrderByDescending(a => a.TespitTarihi)
                .Take(5)
                .Select(a => new
                {
                    a.Aciklama,
                    a.IslemTutari,
                    a.GuvenSkoru
                })
                .ToListAsync();

            string harcamaGecmisiMetni = duygusalHarcamalar.Any()
                ? string.Join("\n", duygusalHarcamalar.Select(h =>
                    $"- {h.Aciklama}: {Math.Abs(h.IslemTutari):F0} TL | Duygu: {h.Duygu} | Metin tonu: {h.MetinDuygusu} | Not: \"{h.DuyguNotu}\""))
                : "Kullanıcı henüz harcamalara duygu notu eklememiş.";

            string kategoriMetni = kategoriOzeti.Any()
                ? string.Join("\n", kategoriOzeti.Select(k => $"- {k.Kategori}: {k.Toplam:F0} TL"))
                : "Kategori bazlı harcama verisi bulunamadı.";

            string anomaliMetni = anomaliOzeti.Any()
                ? string.Join("\n", anomaliOzeti.Select(a =>
                    $"- {a.Aciklama}: {Math.Abs(a.IslemTutari):F0} TL | Güven skoru: {a.GuvenSkoru:F2}"))
                : "Anomali kaydı bulunamadı.";

            var sistemTalimati =
                "Sen davranışsal finans uzmanısın. Kullanıcının harcama verilerini analiz et. " +
                "KESIN YASAK 1: Hiçbir yüzde (%) işareti kullanma. Sadece TL tutarları yaz. " +
                "KESIN YASAK 2: TL tutarlarının önüne veya arkasına % koyma. Örnek doğru: '280 TL'. Yanlış: '%280 TL'. " +
                "KESIN YASAK 3: Soru sorma, talimat tekrarlama, JSON yazma, ``` kullanma. " +
                "Anomali her zaman şüpheli/yetkisiz işlem demektir, kullanıcıya IYZICO müşteri hizmetlerini aramasını söyle. " +
                "Sadece düz Türkçe Markdown yaz. Her madde en fazla 2 cümle. " +
                "Tam olarak bu 4 başlığı kullan:\n" +
                "### 1. Teknik Finansal Analiz\n" +
                "### 2. Duygu ve Harcama Tespitleri\n" +
                "### 3. Günlük Hayatta Uygulanabilir Tavsiyeler\n" +
                "### 4. Önümüzdeki Ay İçin Aksiyon Planı";

            var userPrompt =
                $"Kullanıcının bu ayki harcama verileri:\n\n" +
                $"KATEGORİLER:\n{kategoriMetni}\n\n" +
                $"DUYGU NOTLU HARCAMALAR:\n{harcamaGecmisiMetni}\n\n" +
                $"ANOMALİLER:\n{anomaliMetni}\n\n" +
                "### 1. Teknik Finansal Analiz\n" +
                "- En yüksek harcama kategorisini TL tutarıyla yaz\n" +
                "- İkinci ve üçüncü en yüksek kategorileri TL tutarıyla yaz\n" +
                "- Dikkat çeken bir harcama kalıbı varsa belirt\n\n" +
                "### 2. Duygu ve Harcama Tespitleri\n" +
                "- Stresli duygulu harcamalarda hangi mağaza kaç TL: sadece gerçek verideki isimleri yaz\n" +
                "- Mutlu duygulu harcamalarda hangi mağaza kaç TL: sadece gerçek verideki isimleri yaz\n" +
                "- Stres ve mutluluk harcamaları arasındaki TL farkını belirt\n\n" +
                "### 3. Günlük Hayatta Uygulanabilir Tavsiyeler\n" +
                "- Stresli günlerdeki en yüksek harcama için somut alternatif öner\n" +
                "- En yüksek kategori için somut azaltma öner\n" +
                "- Mutlu günlerdeki harcamanın olumlu bir yönünü belirt\n\n" +
                "### 4. Önümüzdeki Ay İçin Aksiyon Planı\n" +
                "- IYZICO anomalisi için: IYZICO müşteri hizmetleri 0850 xxx xx xx numarasını ara, işlemi sorgula\n" +
                "- Stresli günler için: stres anında harcama yapmadan önce 10 dakika bekle kuralı uygula\n" +
                "- En yüksek kategori için somut TL hedefi belirt\n" +
                "- Genel bütçe için somut bir adım öner";
            var requestBody = new
            {
                model = "llama-3.1-8b-instant",
                messages = new[]
                {
            new { role = "system", content = sistemTalimati },
            new { role = "user", content = userPrompt }
        },
                max_tokens = 1400,
                temperature = 0.7
            };

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

                var response = await client.PostAsJsonAsync(url, requestBody);
                var responseStr = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                    return $"Öneri motoru şu an yanıt veremedi. Detay: {response.StatusCode}";

                using var doc = JsonDocument.Parse(responseStr);

                return doc.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString() ?? "Öneri üretilemedi.";
            }
            catch (Exception ex)
            {
                return $"Detaylı öneri oluşturulurken hata oluştu: {ex.Message}";
            }
        }
        public async Task<string> DuyguSiniflandirAsync(string duyguNotu)
        {
            if (string.IsNullOrWhiteSpace(duyguNotu))
                return "Normal";

            var apiKey = _config["Groq:ApiKey"];

            if (string.IsNullOrWhiteSpace(apiKey))
                return "Normal";

            var url = "https://api.groq.com/openai/v1/chat/completions";

            var prompt =
                "Aşağıdaki harcama duygu notunu analiz et. " +
                "Sadece şu beş değerden birini döndür: Normal, Mutlu, Stresli, Üzgün, Kaygılı. " +
                "Başka hiçbir açıklama, noktalama veya cümle yazma.\n\n" +
                $"Not: \"{duyguNotu}\"";

            var requestBody = new
            {
                model = "llama-3.1-8b-instant",
                messages = new[]
                {
            new
            {
                role = "system",
                content = "Sen Türkçe harcama notlarından duygu sınıfı çıkaran bir sınıflandırma servisissin. Sadece tek kelime yanıt verirsin."
            },
            new
            {
                role = "user",
                content = prompt
            }
        },
                max_tokens = 20,
                temperature = 0.1
            };

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await client.PostAsync(url, content);
                var responseStr = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                    return "Normal";

                using var doc = JsonDocument.Parse(responseStr);

                var duygu = doc.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString()
                    ?.Trim()
                    .Replace(".", "")
                    .Replace("\"", "")
                    ?? "Normal";

                return NormalizeGroqDuygu(duygu);
            }
            catch
            {
                return "Normal";
            }
        }
        private string NormalizeGroqDuygu(string duygu)
        {
            var normalized = duygu.Trim().ToLowerInvariant()
                .Replace("ı", "i")
                .Replace("ğ", "g")
                .Replace("ü", "u")
                .Replace("ş", "s")
                .Replace("ö", "o")
                .Replace("ç", "c");

            return normalized switch
            {
                "normal" => "Normal",
                "mutlu" => "Mutlu",
                "stresli" => "Stresli",
                "uzgun" => "Üzgün",
                "kaygili" => "Kaygılı",
                _ => "Normal"
            };
        }

        private List<OneriSonuc> KuralTabanliOneri(OneriGirdisi girdi)
        {
            var oneriler = new List<OneriSonuc>();

            if (girdi.HarcamaOrani > 90)
                oneriler.Add(new OneriSonuc { Mesaj = $"Gelirinizin %{girdi.HarcamaOrani:F0}'ini harcıyorsunuz! Acil tasarruf planı oluturun.", Kategori = "Uyari", Kaynak = "Kural" });
            else if (girdi.HarcamaOrani > 70)
                oneriler.Add(new OneriSonuc { Mesaj = $"Harcamalarınız gelirinizin %{girdi.HarcamaOrani:F0}'i. 50/30/20 kuralini deneyin.", Kategori = "Bilgi", Kaynak = "Kural" });
            else
                oneriler.Add(new OneriSonuc { Mesaj = $"Bütcenizi iyi yönetiyorsunuz! {girdi.Net:F0} TL birikimle yatırım düşünebilirsiniz.", Kategori = "Tasarruf", Kaynak = "Kural" });

            if (girdi.AnomaliSayisi > 0)
                oneriler.Add(new OneriSonuc { Mesaj = $"{girdi.AnomaliSayisi} adet anormal harcama tespit edildi. Anomali sayfasından inceleyin.", Kategori = "Uyari", Kaynak = "Kural" });

            if (!string.IsNullOrEmpty(girdi.EnCokHarcananKategori))
                oneriler.Add(new OneriSonuc { Mesaj = $"En fazla harcama '{girdi.EnCokHarcananKategori}' kategorisinde. %10 azaltmak {girdi.ToplamHarcama * 0.1m:F0} TL tasarruf sağlar.", Kategori = "Tasarruf", Kaynak = "Kural" });

            if (girdi.Net < 0)
                oneriler.Add(new OneriSonuc { Mesaj = $"Bu dönem {Math.Abs(girdi.Net):F0} TL açık verdiniz. Zorunlu olmayan harcamalari gözden geçirin.", Kategori = "Uyari", Kaynak = "Kural" });

            return oneriler;
        }
       
    }
}