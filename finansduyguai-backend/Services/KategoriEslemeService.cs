using FinansalAnaliz.Data;
using FinansalAnaliz.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace FinansalAnaliz.Services
{
    public class KategoriEslemeService : IKategoriEslemeService
    {
        private readonly FinansalAnalizDbContext _context;
        private readonly KategoriTahminService _mlService;
        private readonly IMemoryCache _cache;
        private const string CacheKey = "kategori_anahtar_kelimeler";
        public KategoriEslemeService(FinansalAnalizDbContext context, KategoriTahminService mlService, IMemoryCache cache)
        {
            _context = context;
            _mlService = mlService;
            _cache = cache;
        }

        private string NormalizeText(string text)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;

            text = text.ToLowerInvariant();

            text = text.Replace("ı", "i")
                       .Replace("ğ", "g")
                       .Replace("ü", "u")
                       .Replace("ş", "s")
                       .Replace("ö", "o")
                       .Replace("ç", "c");

            return text.Trim();
        }

        public async Task<KategoriEslesmeDto?> KategoriBulAsync(string aciklama)
        {
            if (string.IsNullOrWhiteSpace(aciklama))
                return null;

            string normalizedAciklama = NormalizeText(aciklama);
            var anahtarKelimeler = await _cache.GetOrCreateAsync(CacheKey, async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30);
                return await _context.KategoriAnahtarKelimeler.ToListAsync();
            });

            //var anahtarKelimeler = await _context.KategoriAnahtarKelimeler.ToListAsync();
            KategoriEslesmeDto? enIyiEslesme = null;

            foreach (var item in anahtarKelimeler)
            {
                var keyword = NormalizeText(item.AnahtarKelime);

                if (normalizedAciklama.Contains(keyword))
                {
                    if (enIyiEslesme == null || item.ConfidenceScore > enIyiEslesme.ConfidenceScore)
                    {
                        enIyiEslesme = new KategoriEslesmeDto
                        {
                            KategoriID = item.KategoriID,
                            ConfidenceScore = item.ConfidenceScore
                        };
                    }
                }
            }
            if (enIyiEslesme != null)
                return enIyiEslesme;

            var (tahminEdilenKategoriAdi, confidence) = _mlService.TahminEt(aciklama);

            if (!string.IsNullOrEmpty(tahminEdilenKategoriAdi) && confidence > 0.6f)
            {
                var kategori = await _context.Kategoriler
                    .FirstOrDefaultAsync(k => k.MlKategori == tahminEdilenKategoriAdi);

                if (kategori != null)
                {
                    return new KategoriEslesmeDto
                    {
                        KategoriID = kategori.Id,
                        ConfidenceScore = confidence
                    };
                }
            }
            return new KategoriEslesmeDto
            {
                KategoriID = 15,
                ConfidenceScore = 0.1f
            };
        }
        public void OnbellekTemizle() => _cache.Remove(CacheKey);
    }
}