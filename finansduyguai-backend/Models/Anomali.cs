using System.ComponentModel.DataAnnotations.Schema;

namespace FinansalAnaliz.Models
{
    public class Anomali
    {
        public int Id { get; set; }

        public int KullaniciID { get; set; }
        public int? FinansalVeriID { get; set; } //sonradan ekledim.
        public int? KategoriID { get; set; }

        // public int Ay { get; set; }
        public decimal OrtalamaTutar { get; set; }
        public decimal IslemTutari { get; set; }
        public double GuvenSkoru { get; set; }//new
        public string Aciklama { get; set; }//new
        public decimal SapmaYuzdesi { get; set; }
        public DateTime TespitTarihi { get; set; }

        [ForeignKey("KullaniciID")]
        public Kullanici? Kullanici { get; set; }

        [ForeignKey("KategoriID")]
        public Kategori? Kategori { get; set; }

        [ForeignKey("FinansalVeriID")]
        public FinansalVeri? FinansalVeri { get; set; }//new

    }
    }
