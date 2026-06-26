namespace FinansalAnaliz.Models
{
    public class Yorum
    {
        public int Id { get; set; }

        public int KullaniciID { get; set; }
        public Kullanici Kullanici { get; set; }

        public string Baslik { get; set; }    // Opsiyonel
        public string Icerik { get; set; }

        public DateTime Tarih { get; set; } = DateTime.Now;

        public bool Onaylandi { get; set; } = true;

        public int? BegeniSayisi { get; set; } = 0;
    }
}
