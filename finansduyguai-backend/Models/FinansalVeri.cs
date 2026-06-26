namespace FinansalAnaliz.Models
{
    public class FinansalVeri
    {
        public int Id { get; set; }

        public int KullaniciID { get; set; }
        public int? KategoriID { get; set; }

        public DateTime Tarih { get; set; }
        public TimeSpan Saat { get; set; }
        public string? IslemTipi { get; set; }
        public string? Kanal { get; set; }
        public string? Aciklama { get; set; }
        public decimal IslemTutari { get; set; }
        public decimal? Bakiye { get; set; }
        public string? DuyguNotu { get; set; }
        public string? Duygu { get; set; }
        public string? MetinDuygusu { get; set; }
        public float? GuvenSkoru { get; set; }

        // Navigation
        public Kullanici? Kullanici { get; set; }
        public Kategori? Kategori { get; set; }
    }

}
