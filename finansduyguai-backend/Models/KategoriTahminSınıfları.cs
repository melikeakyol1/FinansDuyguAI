using Microsoft.ML.Data;

namespace FinansalAnaliz.Models
{
    public class KategoriData
    {
        [LoadColumn(0)] public string Aciklama { get; set; }
        [LoadColumn(1)] public string KategoriAdi { get; set; }
    }

    public class KategoriTahmin
    {
        [ColumnName("PredictedLabel")]
        public string TahminEdilenKategori { get; set; }

        public float[] Score { get; set; }
    }
}

