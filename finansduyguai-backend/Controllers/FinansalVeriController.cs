using Microsoft.AspNetCore.Mvc;
using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;
using FinansalAnaliz.Data;
using FinansalAnaliz.DTOs;
using FinansalAnaliz.Models;
using System.Text;
using FinansalAnaliz.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
namespace FinansalAnaliz.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FinansalVeriController : Controller
    {
        private readonly FinansalAnalizDbContext _context;
        private readonly IKategoriEslemeService _kategoriEslemeService;
        private readonly AnomaliService _anomaliService;
        private readonly PythonDuyguAnalizService _pythonDuyguAnalizService;
        private readonly AiOneriService _aiOneriService;
        public FinansalVeriController(FinansalAnalizDbContext context, IKategoriEslemeService kategoriEslemeService, AnomaliService anomaliService, PythonDuyguAnalizService pythonDuyguAnalizService, AiOneriService aiOneriService)
        {
            _context = context;
            _kategoriEslemeService = kategoriEslemeService;
            _anomaliService = anomaliService;
            _pythonDuyguAnalizService = pythonDuyguAnalizService;
            _aiOneriService = aiOneriService;
        }
        private bool TokenIdEslesiyor(int kullaniciId)
        {
            var tokenId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return tokenId != null && int.Parse(tokenId) == kullaniciId;
        }
        [HttpPost("csv-yukle")]
        [Authorize]
        public async Task<IActionResult> CsvYukle(IFormFile csvFile, int kullaniciId)
        {
            if (!TokenIdEslesiyor(kullaniciId)) return Forbid();

            if (csvFile == null || csvFile.Length == 0)
                return BadRequest("CSV dosyası boş.");

            var finansalVeriler = new List<FinansalVeri>();

            using var reader = new StreamReader(csvFile.OpenReadStream(), Encoding.GetEncoding(1254));
            

            var config = new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = true,
                Delimiter = ";"
            };


            using var csv = new CsvReader(reader, config);
            csv.Context.RegisterClassMap<FinansalVeriClassMap>();
            var records = csv.GetRecords<FinansalVeriCsvDto>().ToList();

            var mevcutListe = await _context.FinansalVeriler
                .Where(v => v.KullaniciID == kullaniciId)
                .Select(v => v.Tarih.ToString("yyyyMMdd") + v.IslemTutari.ToString())
                .ToListAsync();

            var mevcutHashler = new HashSet<string>(mevcutListe);

            foreach (var r in records)
            {
                var tutar = ParseDecimal(r.IslemTutari);
                string tip = r.IslemTipi?.ToLower() ?? "";
                if ((tip.Contains("gider") || tip.Contains("harcama") || tip.Contains("çekilen") || tip.Contains("ödeme")) && tutar > 0)
                {
                    tutar *= -1;
                }
                var tarih = DateTime.Parse(r.Tarih);
                var hash = tarih.ToString("yyyyMMdd") + tutar.ToString();

                if (mevcutHashler.Contains(hash)) continue;

                var eslesme = await _kategoriEslemeService.KategoriBulAsync(r.Aciklama);

                finansalVeriler.Add(new FinansalVeri
                {
                    KullaniciID = kullaniciId,
                    Tarih = tarih,
                    Saat = TimeSpan.Parse(r.Saat),
                    IslemTipi = r.IslemTipi,
                    Kanal = r.Kanal,
                    Aciklama = r.Aciklama,
                    IslemTutari = tutar,
                    Bakiye = ParseNullableDecimal(r.Bakiye),
                    KategoriID = eslesme?.KategoriID
                });               
            }
            if (!finansalVeriler.Any())
                return Ok(new { Mesaj = "Tüm kayıtlar zaten mevcut, yeni veri eklenmedi." });

            _context.FinansalVeriler.AddRange(finansalVeriler);
            await _context.SaveChangesAsync();

            var harcamalar = finansalVeriler
                .Where(x => x.IslemTutari < 0)
                .ToList();
            if (harcamalar.Any())
            {
                var tutarListesi = harcamalar.Select(x => (float)Math.Abs(x.IslemTutari)).ToList();
                var anomaliSonuclari = _anomaliService.AnomalileriTespitEt(tutarListesi);

                foreach (var sonuc in anomaliSonuclari)
                {
                    var ilgiliHarcama = harcamalar[sonuc.Index];

                    var yeniAnomali = new Anomali
                    {
                        KullaniciID = kullaniciId,
                        FinansalVeriID = ilgiliHarcama.Id,
                        KategoriID = ilgiliHarcama.KategoriID,
                        IslemTutari = ilgiliHarcama.IslemTutari,
                        GuvenSkoru = sonuc.PValue,
                        Aciklama = ilgiliHarcama.Aciklama,
                        TespitTarihi = DateTime.Now
                    };
                    _context.Anomaliler.Add(yeniAnomali);
                }
                await _context.SaveChangesAsync();
            }

            return Ok(new { Mesaj = "Veriler yüklendi ve anomali analizi tamamlandı." });
        }
        private decimal ParseDecimal(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return 0;

            try
            {
                string cleanValue = value.Trim();

                // Eğer değerde hem nokta hem virgül varsa (Örn: -1.250,50)
                if (cleanValue.Contains(".") && cleanValue.Contains(","))
                {
                    cleanValue = cleanValue.Replace(".", "").Replace(",", ".");
                }
                // Eğer sadece virgül varsa ondalık ayırıcıdır (Örn: -1250,50)
                else if (cleanValue.Contains(","))
                {
                    cleanValue = cleanValue.Replace(",", ".");
                }

                return decimal.Parse(cleanValue, CultureInfo.InvariantCulture);
            }
            catch
            {
                return 0;
            }
        }
        private decimal? ParseNullableDecimal(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            try
            {
                string cleanValue = value.Trim();
                if (cleanValue.Contains(".") && cleanValue.Contains(","))
                {
                    cleanValue = cleanValue.Replace(".", "").Replace(",", ".");
                }
                else if (cleanValue.Contains(","))
                {
                    cleanValue = cleanValue.Replace(",", ".");
                }
                return decimal.Parse(cleanValue, CultureInfo.InvariantCulture);
            }
            catch { return null; }
        }    

        [HttpPost("deneme-analiz")]
        public async Task<IActionResult> DenemeAnaliz(IFormFile csvFile)
        {
            // 1. Dosya kontrolü
            if (csvFile == null || csvFile.Length == 0)
                return BadRequest("CSV dosyası bulunamadı.");

            var analizSonuclari = new List<object>();

            try
            {
                using var reader = new StreamReader(csvFile.OpenReadStream(), Encoding.GetEncoding(1254));
                var config = new CsvConfiguration(CultureInfo.InvariantCulture)
                {
                    HasHeaderRecord = true,
                    Delimiter = ";"
                };

                using var csv = new CsvReader(reader, config);
                csv.Context.RegisterClassMap<FinansalVeriClassMap>();
                var records = csv.GetRecords<FinansalVeriCsvDto>().ToList();

                foreach (var r in records)
                {
                    // Hibrit kategori servisini kullanıyoruz (SQL ve ML.NET devrede)
                    var eslesme = await _kategoriEslemeService.KategoriBulAsync(r.Aciklama);

                    // Veritabanına kaydetmek yerine geçici bir nesne oluşturuyoruz
                    analizSonuclari.Add(new
                    {
                        tarih = r.Tarih,
                        saat = r.Saat,
                        aciklama = r.Aciklama,
                        islemTutari = ParseDecimal(r.IslemTutari),
                        kategori = eslesme?.KategoriID != null ?
                            (await _context.Kategoriler.FindAsync(eslesme.KategoriID))?.KategoriAdi : "Bilinmiyor"
                    });
                }

                // 2. Anomali tespiti (İsteğe bağlı: Misafir modunda da anomali gösterilsin mi?)
                var harcamalar = analizSonuclari.Cast<dynamic>()
                    .Where(x => x.islemTutari < 0).ToList();

                // Sadece analiz edilen listeyi dönüyoruz, veritabanına HİÇBİR ŞEY yazmıyoruz.
                return Ok(new
                {
                    mesaj = "Deneme analizi başarılı.",
                    veriler = analizSonuclari,
                    isGuest = true
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Analiz hatası: {ex.Message}");
            }
        }

        [HttpGet("liste/{kullaniciId}")]
        [Authorize]
        public async Task<IActionResult> GetTabloListesi(int kullaniciId)
        {
            if (!TokenIdEslesiyor(kullaniciId)) return Forbid();

            var veriler = await _context.FinansalVeriler
                .Include(f => f.Kategori)
                .Where(f => f.KullaniciID == kullaniciId)
                .OrderByDescending(f => f.Tarih)
                .ThenByDescending(f => f.Saat)
                .Select(f => new {
                    id = f.Id,
                    tarih = f.Tarih.ToString("dd.MM.yyyy"),
                    saat = f.Saat.ToString(@"hh\:mm\:ss"),
                    islemTipi = f.IslemTipi, 
                    kanal = f.Kanal,
                    aciklama = f.Aciklama,
                    kategori = f.Kategori != null ? f.Kategori.KategoriAdi : "Bilinmiyor",
                    islemTutari = f.IslemTutari, 
                    bakiye = f.Bakiye,
                    duyguNotu = f.DuyguNotu,
                    duygu = f.Duygu,
                    metinDuygusu = f.MetinDuygusu,
                    guvenSkoru = f.GuvenSkoru,
                    isAnomali = _context.Anomaliler.Any(a => a.FinansalVeriID == f.Id)
                })
                .ToListAsync();

            return Ok(veriler);
        }
        [HttpGet("ozet/{kullaniciId}")]
        public async Task<IActionResult> GetKullaniciOzeti(int kullaniciId)
        {
            // Sadece giriş yapan kullanıcıya ait verileri getiriyoruz
            var veriler = await _context.FinansalVeriler
                .Where(v => v.KullaniciID == kullaniciId)
                .ToListAsync();

            return Ok(veriler);
        }
        [HttpDelete("kullanici/{kullaniciId}")]
        public async Task<IActionResult> KullaniciVerileriniSil(int kullaniciId)
        {
            var veriler = await _context.FinansalVeriler
                .Where(f => f.KullaniciID == kullaniciId)
                .ToListAsync();

            if (!veriler.Any())
                return NotFound("Silinecek veri bulunamadı.");

            _context.FinansalVeriler.RemoveRange(veriler);
            await _context.SaveChangesAsync();

            return Ok("Kullanıcıya ait tüm finansal veriler silindi.");
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> VeriSil(int id)
        {
            var veri = await _context.FinansalVeriler.FindAsync(id);

            if (veri == null)
                return NotFound("Veri bulunamadı.");

            _context.FinansalVeriler.Remove(veri);
            await _context.SaveChangesAsync();

            return Ok("Finansal veri silindi.");
        }
        [HttpPut("{id}/duygu")]
        [Authorize]
        public async Task<IActionResult> DuyguNotuEkle(int id, [FromBody] FinansalVeriDuyguDto dto)
        {
            var tokenId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (tokenId == null)
                return Unauthorized();

            var kullaniciId = int.Parse(tokenId);

            var veri = await _context.FinansalVeriler.FindAsync(id);

            if (veri == null)
                return NotFound("Finansal veri bulunamadı.");

            if (veri.KullaniciID != kullaniciId)
                return Forbid();

            if (string.IsNullOrWhiteSpace(dto.DuyguNotu))
                return BadRequest("Duygu notu boş olamaz.");

            var notMetni = dto.DuyguNotu.Trim();

            var metinAnalizi = await _pythonDuyguAnalizService.AnalizEtAsync(notMetni);
            var duygu = await _aiOneriService.DuyguSiniflandirAsync(notMetni);

            veri.DuyguNotu = notMetni;
            veri.Duygu = duygu;
            veri.MetinDuygusu = metinAnalizi?.MetinDuygusu ?? "neutral";
            veri.GuvenSkoru = metinAnalizi?.GuvenSkoru ?? 0;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                veri.Id,
                veri.DuyguNotu,
                veri.Duygu,
                veri.MetinDuygusu,
                veri.GuvenSkoru
            });
    }
    }
}
