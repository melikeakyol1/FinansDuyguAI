namespace FinansalAnaliz.Models
{
    public class Oneri
    {
        public int Id { get; set; }
        public int KullaniciID { get; set; }
        public string Aciklama { get; set; }
        public string? OneriTipi { get; set; }
        public DateTime OlusturmaTarihi { get; set; }

        public Kullanici? Kullanici { get; set; }
    }

}
