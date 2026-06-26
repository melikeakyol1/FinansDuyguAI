namespace FinansalAnaliz.Models
{
    public class CsvMapping
    {
        public int Id { get; set; }
        public string Signature { get; set; } // CSV kimliği
        public string ColumnName { get; set; }
        public string MappedField { get; set; }
    }
}
