using System;
using Microsoft.AspNetCore.Mvc;
using FinansalAnaliz.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using FinansalAnaliz.Services;
using Microsoft.Extensions.Caching.Memory;

namespace FinansalAnaliz.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AnalitikController : Controller
    {
        private readonly FinansalAnalizDbContext _context;
        private readonly AiOneriService _aiOneriService;
        private readonly IMemoryCache _cache;
        public AnalitikController(FinansalAnalizDbContext context, AiOneriService aiOneriService, IMemoryCache cache)
        {
            _context = context;
            _aiOneriService = aiOneriService;
            _cache = cache;
        }
        private bool TokenIdEslesiyor(int kullaniciId)
        {
            var tokenId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return tokenId != null && int.Parse(tokenId) == kullaniciId;
        }
        [HttpGet("aylik-gelir-gider/{kullaniciId}")]
        public async Task<IActionResult> AylikGelirGider(int kullaniciId)
        {
            if (!TokenIdEslesiyor(kullaniciId)) return Forbid();

            var sonuc = await _context.FinansalVeriler
                .Where(x => x.KullaniciID == kullaniciId)
                .GroupBy(x => new { x.Tarih.Year, x.Tarih.Month })
                .Select(g => new
                {
                    Yil = g.Key.Year,
                    Ay = g.Key.Month,
                    Gelir = g.Where(x => x.IslemTutari > 0).Sum(x => x.IslemTutari),
                    Gider = Math.Abs(g.Where(x => x.IslemTutari < 0).Sum(x => x.IslemTutari))
                })
                .OrderBy(x => x.Yil)
                .ThenBy(x => x.Ay)
                .ToListAsync();

            return Ok(sonuc);
        }
        [HttpGet("kategori-harcama/{kullaniciId}")]
        public async Task<IActionResult> KategoriHarcama(int kullaniciId)
        {
            if (!TokenIdEslesiyor(kullaniciId)) return Forbid();

            var sonuc = await _context.FinansalVeriler
                .Include(x => x.Kategori)
                .Where(x => x.KullaniciID == kullaniciId && x.IslemTutari < 0)
                .GroupBy(x => x.Kategori.KategoriAdi)
                .Select(g => new
                {
                    Kategori = g.Key,
                    ToplamHarcama = Math.Abs(g.Sum(x => x.IslemTutari))
                })
                .OrderByDescending(x => x.ToplamHarcama)
                .ToListAsync();

            return Ok(sonuc);
        }
        [HttpGet("en-cok-harcama/{kullaniciId}")]
        public async Task<IActionResult> EnCokHarcama(int kullaniciId)
        {
            if (!TokenIdEslesiyor(kullaniciId)) return Forbid();

            var sonuc = await _context.FinansalVeriler
                .Include(x => x.Kategori)
                .Where(x => x.KullaniciID == kullaniciId && x.IslemTutari < 0)
                .GroupBy(x => x.Kategori.KategoriAdi)
                .Select(g => new
                {
                    Kategori = g.Key,
                    ToplamHarcama = Math.Abs(g.Sum(x => x.IslemTutari))
                })
                .OrderByDescending(x => x.ToplamHarcama)
                .FirstOrDefaultAsync();

            return Ok(sonuc);
        }
        [HttpGet("toplam-analiz/{kullaniciId}")]
        public async Task<IActionResult> ToplamAnaliz(int kullaniciId)
        {
            if (!TokenIdEslesiyor(kullaniciId)) return Forbid();

            var gelir = await _context.FinansalVeriler
                .Where(x => x.KullaniciID == kullaniciId && x.IslemTutari > 0)
                .SumAsync(x => x.IslemTutari);

            var gider = await _context.FinansalVeriler
                .Where(x => x.KullaniciID == kullaniciId && x.IslemTutari < 0)
                .SumAsync(x => x.IslemTutari);

            return Ok(new
            {
                ToplamGelir = gelir,
                ToplamGider = Math.Abs(gider),
                Net = gelir - Math.Abs(gider)
            });
        }
        [HttpGet("kategori-aylik/{kullaniciId}/{kategoriId}")]
        public async Task<IActionResult> KategoriAylik(int kullaniciId, int kategoriId)
        {
            if (!TokenIdEslesiyor(kullaniciId)) return Forbid();

            var sonuc = await _context.FinansalVeriler
                .Where(x => x.KullaniciID == kullaniciId &&
                            x.KategoriID == kategoriId &&
                            x.IslemTutari < 0)
                .GroupBy(x => new { x.Tarih.Year, x.Tarih.Month })
                .Select(g => new
                {
                    Yil = g.Key.Year,
                    Ay = g.Key.Month,
                    Toplam = Math.Abs(g.Sum(x => x.IslemTutari))
                })
                .ToListAsync();

            return Ok(sonuc);
        }
        [HttpGet("ai-oneri/{kullaniciId}")]
        public async Task<IActionResult> AiOneri(int kullaniciId)
        {
            if (!TokenIdEslesiyor(kullaniciId)) return Forbid();

            var gelir = await _context.FinansalVeriler
                .Where(x => x.KullaniciID == kullaniciId && x.IslemTutari > 0)
                .SumAsync(x => x.IslemTutari);

            var gider = await _context.FinansalVeriler
                .Where(x => x.KullaniciID == kullaniciId && x.IslemTutari < 0)
                .SumAsync(x => (decimal?)Math.Abs((double)x.IslemTutari)) ?? 0;

            var enCokKategori = await _context.FinansalVeriler
                .Include(x => x.Kategori)
                .Where(x => x.KullaniciID == kullaniciId && x.IslemTutari < 0)
                .GroupBy(x => x.Kategori.KategoriAdi)
                .OrderByDescending(g => g.Sum(x => Math.Abs(x.IslemTutari)))
                .Select(g => g.Key)
                .FirstOrDefaultAsync() ?? "";

            var anomaliSayisi = await _context.Anomaliler
                .Where(a => a.KullaniciID == kullaniciId)
                .CountAsync();

            var girdi = new OneriGirdisi
            {
                ToplamGelir = gelir,
                ToplamHarcama = gider,
                EnCokHarcananKategori = enCokKategori,
                AnomaliSayisi = anomaliSayisi
            };

            var oneriler = await _aiOneriService.OneriUretAsync(girdi, kullaniciId);

            return Ok(oneriler);
        }
        [HttpGet("akilli-oneriler/{kullaniciId}")]
        public async Task<IActionResult> GetAkilliOneriler(int kullaniciId)
        {
            if (!TokenIdEslesiyor(kullaniciId)) return Forbid();

            var oneriler = await _aiOneriService.DetayliFinansalVeDuygusalOneriUretAsync(kullaniciId);

            return Ok(new { oneriMetni = oneriler });
        }
        [HttpGet("duygu-harcama-analizi/{kullaniciId}")]
        public async Task<IActionResult> DuyguHarcamaAnalizi(int kullaniciId)
        {
            if (!TokenIdEslesiyor(kullaniciId)) return Forbid();

            var sonuc = await _context.FinansalVeriler
                .Where(x => x.KullaniciID == kullaniciId &&
                            x.IslemTutari < 0 &&
                            x.Duygu != null)
                .GroupBy(x => new { x.Duygu, x.MetinDuygusu })
                .Select(g => new
                {
                    Duygu = g.Key.Duygu,
                    MetinDuygusu = g.Key.MetinDuygusu,
                    IslemSayisi = g.Count(),
                    ToplamHarcama = Math.Abs(g.Sum(x => x.IslemTutari)),
                    OrtalamaHarcama = Math.Abs(g.Average(x => x.IslemTutari))
                })
                .OrderByDescending(x => x.ToplamHarcama)
                .ToListAsync();

            return Ok(sonuc);
    }
    }
}