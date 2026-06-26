using System.Text.Json.Serialization;

namespace FinansalAnaliz.Models
{
    public class KategoriAnahtarKelime
    {
        public int Id { get; set; }
        public int KategoriID { get; set; }
        public string AnahtarKelime { get; set; }
        public float ConfidenceScore { get; set; }

        [JsonIgnore]
        public Kategori? Kategori { get; set; }
    }
}
