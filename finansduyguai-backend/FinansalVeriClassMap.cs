using CsvHelper.Configuration;
using FinansalAnaliz.DTOs;

namespace FinansalAnaliz
{
    public sealed class FinansalVeriClassMap : ClassMap<FinansalVeriCsvDto>
    { 
    
    public FinansalVeriClassMap()
        {
            Map(x => x.Tarih).Name("Tarih");
            Map(x => x.Saat).Name("Saat");
            Map(x => x.IslemTipi).Name("İşlem");
            Map(x => x.Kanal).Name("Kanal"); 
            Map(x => x.Aciklama).Name("Açıklama");
            Map(x => x.IslemTutari).Name("İşlem Tutarı");
            Map(x => x.Bakiye).Name("Bakiye");
        }
    }
}
