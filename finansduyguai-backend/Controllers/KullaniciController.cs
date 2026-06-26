using Microsoft.AspNetCore.Mvc;
using FinansalAnaliz.Data;
using FinansalAnaliz.Models;
using Microsoft.EntityFrameworkCore;
using FinansalAnaliz.DTOs;
using FinansalAnaliz.Services;
using Microsoft.AspNetCore.Authorization;
using Newtonsoft.Json.Linq;

namespace FinansalAnaliz.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KullaniciController : Controller
    {
        private readonly FinansalAnalizDbContext _context;
        private readonly JwtService _jwtService;

        public KullaniciController(FinansalAnalizDbContext context, JwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<Kullanici>>> GetKullanicilar()
        {
            return await _context.Kullanicilar.ToListAsync();
        }
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<Kullanici>> GetKullanici(int id)
        {
            var tokenId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            if (tokenId != id) return Forbid();

            var kullanici = await _context.Kullanicilar.FindAsync(id);
            if (kullanici == null)
                return NotFound("Kullanıcı bulunamadı.");

            return Ok(new { kullanici.Id, kullanici.AdSoyad, kullanici.Email });
        }
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteKullanici(int id)
        {
            var tokenId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            if (tokenId != id) return Forbid();

            var kullanici = await _context.Kullanicilar.FindAsync(id);
            if (kullanici == null) return NotFound();

            _context.Kullanicilar.Remove(kullanici);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        [HttpPost]
        public async Task<ActionResult> PostKullanici(KullaniciCreateDto dto)
        {
            // Email kontrolü
            if (await _context.Kullanicilar.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Bu email adresi zaten kayıtlı.");

            var yeniKullanici = new Kullanici
            {
                AdSoyad = dto.AdSoyad,
                Email = dto.Email,
                Telefon = dto.Telefon,
                // Güvenli yöntem: Şifreyi hashleyerek sakla
                Sifre = BCrypt.Net.BCrypt.HashPassword(dto.Sifre),
                KayitTarihi = DateTime.Now
            };

            _context.Kullanicilar.Add(yeniKullanici);
            await _context.SaveChangesAsync();
            var token = _jwtService.TokenUret(yeniKullanici);

            // Hassas verileri (şifre gibi) geri dönmemek için anonim nesne döndürüyoruz
            return CreatedAtAction(nameof(GetKullanici), new { id = yeniKullanici.Id }, new
            {
                token,
                id = yeniKullanici.Id,
                adSoyad = yeniKullanici.AdSoyad,
                email = yeniKullanici.Email
            });
        }
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var kullanici = await _context.Kullanicilar
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            // HATA BURADAYDI: Şifre yanlışsa hemen dön
            if (kullanici == null || !BCrypt.Net.BCrypt.Verify(dto.Sifre, kullanici.Sifre))
            {
                return Unauthorized("Email veya şifre hatalı.");
            }

            // Başarılıysa buraya geçer
            var token = _jwtService.TokenUret(kullanici);

            return Ok(new
            {
                token,
                id = kullanici.Id,
                adSoyad = kullanici.AdSoyad,
                email = kullanici.Email
            });
        }

    }
    }
