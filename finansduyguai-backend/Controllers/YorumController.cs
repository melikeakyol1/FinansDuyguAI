using FinansalAnaliz.Data;
using FinansalAnaliz.DTOs;
using FinansalAnaliz.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinansalAnaliz.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class YorumController : ControllerBase
    {
        private readonly FinansalAnalizDbContext _context;

        public YorumController(FinansalAnalizDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Ekle(YorumCreateDto dto)
        {
            var tokenId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (tokenId == null)
                return Unauthorized();

            var yorum = new Yorum
            {
                KullaniciID = int.Parse(tokenId),
                Baslik = dto.Baslik,
                Icerik = dto.Icerik,
                Tarih = DateTime.Now
            };

            _context.Yorumlar.Add(yorum);
            await _context.SaveChangesAsync();

            return Ok(yorum);
        }
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Listele()
        {
            var yorumlar = await _context.Yorumlar
                .Include(x => x.Kullanici)
                .OrderByDescending(x => x.Tarih)
                .Select(x => new
                {
                    x.Id,
                    Kullanici = x.Kullanici.AdSoyad,
                    x.Baslik,
                    x.Icerik,
                    x.Tarih,
                    x.BegeniSayisi
                })
                .ToListAsync();

            return Ok(yorumlar);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> Sil(int id)
        {
            var tokenId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var yorum = await _context.Yorumlar.FindAsync(id);

            if (yorum == null)
                return NotFound();

            if (yorum.KullaniciID != int.Parse(tokenId))
                return Forbid();

            _context.Yorumlar.Remove(yorum);

            await _context.SaveChangesAsync();

            return Ok();
        }
    }
}
