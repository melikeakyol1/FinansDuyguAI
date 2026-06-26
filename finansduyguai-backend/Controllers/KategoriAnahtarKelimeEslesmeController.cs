using Microsoft.AspNetCore.Mvc;
using FinansalAnaliz.Data;
using FinansalAnaliz.DTOs;
using Microsoft.EntityFrameworkCore;
using FinansalAnaliz.Models;

namespace FinansalAnaliz.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KategoriAnahtarKelimeEslesmeController : Controller
    {
        private readonly FinansalAnalizDbContext _context;
        public KategoriAnahtarKelimeEslesmeController(FinansalAnalizDbContext context)
        {
            _context = context;
        }
        [HttpGet]
        public async Task<IActionResult> GetAnahtarKelimeler()
        {
            var list = await _context.KategoriAnahtarKelimeler
                .Select(k => new
                {
                    k.Id,
                    k.KategoriID,
                    k.AnahtarKelime,
                    k.ConfidenceScore
                })
                .ToListAsync();

            return Ok(list);
        }
        [HttpPost]
        public async Task<IActionResult> Eslesenler([FromBody] KategoriAnahtarKelime kategori)
        {
            if (kategori == null || string.IsNullOrEmpty(kategori.AnahtarKelime))
                return BadRequest("Anahtar kelime boş olamaz.");
            var KategoriVarMi = await _context.Kategoriler.AnyAsync(k => k.Id == kategori.KategoriID);

            if (!KategoriVarMi)
                return BadRequest("Kategori Bulunamadı");
            _context.KategoriAnahtarKelimeler.Add(kategori);
            await _context.SaveChangesAsync();
            return Ok(kategori);
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> Guncelle(int id, [FromBody] KategoriAnahtarKelime kategori)
        {
            if (kategori == null || string.IsNullOrEmpty(kategori.AnahtarKelime))
                return BadRequest("Anahtar kelime boş olamaz.");

            var mevcutKayit = await _context.KategoriAnahtarKelimeler.FindAsync(id);

            if (mevcutKayit == null)
                return NotFound("Güncellenecek kayıt bulunamadı.");

            var kategoriVarMi = await _context.Kategoriler.AnyAsync(k => k.Id == kategori.KategoriID);

            if (!kategoriVarMi)
                return BadRequest("Kategori bulunamadı.");

            mevcutKayit.KategoriID = kategori.KategoriID;
            mevcutKayit.AnahtarKelime = kategori.AnahtarKelime;
            mevcutKayit.ConfidenceScore = kategori.ConfidenceScore;

            await _context.SaveChangesAsync();

            return Ok(mevcutKayit);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> Sil(int id)
        {
            var kayit = await _context.KategoriAnahtarKelimeler.FindAsync(id);

            if (kayit == null)
                return NotFound("Silinecek kayıt bulunamadı.");

            _context.KategoriAnahtarKelimeler.Remove(kayit);
            await _context.SaveChangesAsync();

            return Ok("Anahtar kelime silindi.");
        }
    }
}
