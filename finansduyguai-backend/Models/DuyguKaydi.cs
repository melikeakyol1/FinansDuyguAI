namespace FinansalAnaliz.Models
{
    public class DuyguKaydi
    {
        public int Id { get; set; }
        public int KullaniciID { get; set; }
        public DateTime Tarih { get; set; }
        public string? Aciklama { get; set; }
        public string Duygu { get; set; }
        public string? MetinDuygusu { get; set; }
        public float? GuvenSkoru { get; set; }

        public Kullanici? Kullanici { get; set; }
    }

}
