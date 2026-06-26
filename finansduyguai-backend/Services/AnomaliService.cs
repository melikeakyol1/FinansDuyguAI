using Microsoft.ML;
using FinansalAnaliz.Models;

namespace FinansalAnaliz.Services
{
    public class AnomaliService
    {
        private readonly MLContext _mlContext;

        // Dışarıya bilgi taşımak için kullandığımız yardımcı sınıf
        public class AnomaliSonuc
        {
            public int Index { get; set; }
            public double PValue { get; set; }
        }

        public AnomaliService()
        {
            _mlContext = new MLContext();
        }

        // Dönüş tipini List<AnomaliSonuc> olarak güncelledik!
        public List<AnomaliSonuc> AnomalileriTespitEt(List<float> harcamalar)
        {
            if (harcamalar.Count < 10) return new List<AnomaliSonuc>();

            var veriView = _mlContext.Data.LoadFromEnumerable(harcamalar.Select(x => new HarcamaVerisi { Tutar = x }));

            var pipeline = _mlContext.Transforms.DetectSpikeBySsa(
                outputColumnName: nameof(AnomaliTahmini.Prediction),
                inputColumnName: nameof(HarcamaVerisi.Tutar),
                confidence: 98.0d,
                pvalueHistoryLength: 10,
                trainingWindowSize: harcamalar.Count,
                seasonalityWindowSize: 7);

            var transform = pipeline.Fit(veriView);
            var transformedData = transform.Transform(veriView);
            var predictions = _mlContext.Data.CreateEnumerable<AnomaliTahmini>(transformedData, reuseRowObject: false).ToList();

            // Burası değişti: Index ve PValue bilgisini paketleyip dönüyoruz
            return predictions.Select((p, i) => new { p, i })
                              .Where(x => x.p.Prediction[0] == 1) // 1 = Anomali bulduk
                              .Select(x => new AnomaliSonuc
                              {
                                  Index = x.i,
                                  PValue = x.p.Prediction[2] // ML.NET P-Value değeri [2]. indekstedir
                              }).ToList();
        }
    }
}