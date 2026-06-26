namespace FinansalAnaliz.Models
{
    public class Kullanici
    {
        public int Id { get; set; }
        public string AdSoyad { get; set; }
        public string Email { get; set; }
        public string? Telefon { get; set; }
        public string Sifre { get; set; }
        public DateTime KayitTarihi { get; set; }

        // Navigation Properties
        public ICollection<FinansalVeri> FinansalVeriler { get; set; } = new List<FinansalVeri>();
        public ICollection<DuyguKaydi> DuyguKayitlari { get; set; } = new List<DuyguKaydi>();
        public ICollection<Oneri> Oneriler { get; set; } = new List<Oneri>();
        public ICollection<Anomali> Anomaliler { get; set; } = new List<Anomali>();
    }

   
}
