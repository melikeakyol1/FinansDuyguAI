namespace FinansalAnaliz.DTOs
{
    namespace FinansalAnaliz.DTOs
    {
        public class DuyguKaydiCreateDto
        {
            public int KullaniciID { get; set; }
            public DateTime Tarih { get; set; }
            public string Duygu { get; set; } = "";
            public string? Aciklama { get; set; }
        }
    }
}
