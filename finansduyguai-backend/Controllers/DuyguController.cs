using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using FinansalAnaliz.Data;
using FinansalAnaliz.DTOs;
using FinansalAnaliz.Models;
using FinansalAnaliz.Services;
using FinansalAnaliz.DTOs.FinansalAnaliz.DTOs;

namespace FinansalAnaliz.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DuyguController : Controller
    {
        private readonly FinansalAnalizDbContext _context;
        private readonly PythonDuyguAnalizService _duyguAnalizService;

        public DuyguController(
            FinansalAnalizDbContext context,
            PythonDuyguAnalizService duyguAnalizService)
        {
            _context = context;
            _duyguAnalizService = duyguAnalizService;
        }

        private bool TokenIdEslesiyor(int kullaniciId)
        {
            var tokenId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return tokenId != null && int.Parse(tokenId) == kullaniciId;
        }

        [HttpPost]
        public async Task<IActionResult> DuyguEkle([FromBody] DuyguKaydiCreateDto dto)
        {
            if (!TokenIdEslesiyor(dto.KullaniciID)) return Forbid();

            var analiz = await _duyguAnalizService.AnalizEtAsync(dto.Aciklama);

            var kayit = new DuyguKaydi
            {
                KullaniciID = dto.KullaniciID,
                Tarih = dto.Tarih.Date,
                Duygu = dto.Duygu,
                Aciklama = dto.Aciklama,
                MetinDuygusu = analiz?.MetinDuygusu ?? "neutral",
                GuvenSkoru = analiz?.GuvenSkoru ?? 0
            };

            _context.DuyguKayitlari.Add(kayit);
            await _context.SaveChangesAsync();

            return Ok(kayit);
        }

        [HttpGet("{kullaniciId}")]
        public async Task<IActionResult> DuygulariListele(int kullaniciId)
        {
            if (!TokenIdEslesiyor(kullaniciId)) return Forbid();

            var liste = await _context.DuyguKayitlari
                .Where(x => x.KullaniciID == kullaniciId)
                .OrderByDescending(x => x.Tarih)
                .ToListAsync();

            return Ok(liste);
        }
    }
}