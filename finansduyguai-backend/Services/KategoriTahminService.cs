using Microsoft.ML;
using FinansalAnaliz.Models;
using System.Globalization;

namespace FinansalAnaliz.Services
{
    public class KategoriTahminService
    {
        private readonly MLContext _mlContext;
        private ITransformer _model;
        private PredictionEngine<KategoriData, KategoriTahmin> _predictionEngine;
        private readonly string _modelPath = "model.zip";
        public KategoriTahminService()
        {
            _mlContext = new MLContext(seed: 0);
            LoadOrTrainModel();
        }
        private void LoadOrTrainModel()
        {
            if (File.Exists(_modelPath))
            {
                using var stream = new FileStream(_modelPath, FileMode.Open, FileAccess.Read);
                _model = _mlContext.Model.Load(stream, out _);
            }
            else
            {
                ModeliEgit();
            }

            _predictionEngine =
                _mlContext.Model.CreatePredictionEngine<KategoriData, KategoriTahmin>(_model);
        }
        public void ModeliEgit()
        {
            string veriYolu = Path.Combine(Environment.CurrentDirectory, "kategori-egitim.csv");

            if (!File.Exists(veriYolu))
                return;

            var data = _mlContext.Data.LoadFromTextFile<KategoriData>(
                veriYolu,
                hasHeader: true,
                separatorChar: ',');

            var pipeline =
                _mlContext.Transforms.Conversion.MapValueToKey("Label", nameof(KategoriData.KategoriAdi))
                .Append(_mlContext.Transforms.Text.FeaturizeText("Features", nameof(KategoriData.Aciklama)))
                .Append(_mlContext.MulticlassClassification.Trainers.SdcaMaximumEntropy())
                .Append(_mlContext.Transforms.Conversion.MapKeyToValue("PredictedLabel"));

            _model = pipeline.Fit(data);

            using var fs = new FileStream(_modelPath, FileMode.Create, FileAccess.Write);
            _mlContext.Model.Save(_model, data.Schema, fs);
        }

        public (string kategori, float confidence) TahminEt(string aciklama)
        {
            aciklama = Normalize(aciklama);

            var result = _predictionEngine.Predict(new KategoriData
            {
                Aciklama = aciklama
            });

            // Max score confidence (approx)
            float maxScore = result.Score.Max();

            return (result.TahminEdilenKategori, maxScore);
        }
        private string Normalize(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return "";

            text = text.ToLowerInvariant();

            return text
                .Replace("ı", "i")
                .Replace("ğ", "g")
                .Replace("ü", "u")
                .Replace("ş", "s")
                .Replace("ö", "o")
                .Replace("ç", "c")
                .Trim();
        }
    }
}
    