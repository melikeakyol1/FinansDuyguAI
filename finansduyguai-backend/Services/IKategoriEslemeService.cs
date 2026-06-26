using FinansalAnaliz.DTOs;

namespace FinansalAnaliz.Services
{
    public interface IKategoriEslemeService
    {
        Task<KategoriEslesmeDto?> KategoriBulAsync(string aciklama);
    }
}
