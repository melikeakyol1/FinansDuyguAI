using Microsoft.ML.Data;

namespace FinansalAnaliz.Models
{
    public class HarcamaVerisi
    {
        public float Tutar { get; set; }
    }

    public class AnomaliTahmini
    {
        [VectorType(3)]
        public double[] Prediction { get; set; }
        // [0]: Anomali mi (1/0), [1]: Skor, [2]: P-Value
    }
}
