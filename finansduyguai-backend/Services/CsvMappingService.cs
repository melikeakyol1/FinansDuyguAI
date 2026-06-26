namespace FinansalAnaliz.Services
{
    public class CsvMappingService
    {
        public Dictionary<string, string?> AutoMap(string[] headers)
        {
            var map = new Dictionary<string, string?>();

            foreach (var h in headers)
            {
                var lower = h.ToLower();

                if (lower.Contains("tarih") || lower.Contains("date"))
                    map[h] = "Tarih";
                else if (lower.Contains("tutar") || lower.Contains("amount"))
                    map[h] = "IslemTutari";
                else if (lower.Contains("aciklama") || lower.Contains("desc"))
                    map[h] = "Aciklama";
                else if (lower.Contains("saat") || lower.Contains("time"))
                    map[h] = "Saat";
                else if (lower.Contains("bakiye") || lower.Contains("balance"))
                    map[h] = "Bakiye";
                else
                    map[h] = null;
            }

            return map;
        }
    }
}