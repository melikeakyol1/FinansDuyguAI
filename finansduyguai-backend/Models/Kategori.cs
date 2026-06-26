using FinansalAnaliz.Models;

namespace FinansalAnaliz.Models
{
    public class Kategori
    {
        public int Id { get; set; }
        public string KategoriAdi { get; set; }
        public string MlKategori { get; set; }
        public ICollection<FinansalVeri> FinansalVeriler { get; set; } = new List<FinansalVeri>();
        public ICollection<Anomali> Anomaliler { get; set; } = new List<Anomali>();
        public ICollection<KategoriAnahtarKelime> AnahtarKelimeler { get; set; } = new List<KategoriAnahtarKelime>();
    }
}