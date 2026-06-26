using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinansalAnaliz.Data;
using FinansalAnaliz.Models;
using FinansalAnaliz.DTOs;

namespace FinansalAnaliz.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KategoriController : Controller
    {
        private readonly FinansalAnalizDbContext _context;
        public KategoriController(FinansalAnalizDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetKategoriler()
        {
            var kategoriler = await _context.Kategoriler.ToListAsync();
            return Ok(kategoriler);

        }
        [HttpPost]
        public async Task<IActionResult> AddKategori([FromBody] Kategori kategori)
        {
            if (kategori == null || string.IsNullOrEmpty(kategori.KategoriAdi))
                return BadRequest("Kategori adı boş olamaz.)");
            _context.Kategoriler.Add(kategori);
            await _context.SaveChangesAsync();
            return Ok(kategori);    
        }
    }
}