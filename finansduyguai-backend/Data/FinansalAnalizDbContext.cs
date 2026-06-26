using FinansalAnaliz.Models;
using Microsoft.EntityFrameworkCore;

namespace FinansalAnaliz.Data
{
    public class FinansalAnalizDbContext : DbContext
    {
        public FinansalAnalizDbContext(DbContextOptions<FinansalAnalizDbContext> options)
            : base(options) { }

        public DbSet<Kullanici> Kullanicilar { get; set; }
        public DbSet<Kategori> Kategoriler { get; set; }
        public DbSet<FinansalVeri> FinansalVeriler { get; set; }
        public DbSet<DuyguKaydi> DuyguKayitlari { get; set; }
        public DbSet<Anomali> Anomaliler { get; set; }
        public DbSet<Oneri> Oneriler { get; set; }
        public DbSet<KategoriAnahtarKelime> KategoriAnahtarKelimeler { get; set; }
        public DbSet<Yorum> Yorumlar { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Anomali>(entity =>
            {
                entity.Property(e => e.IslemTutari).HasPrecision(18, 2);
                entity.Property(e => e.OrtalamaTutar).HasPrecision(18, 2);
                entity.Property(e => e.SapmaYuzdesi).HasPrecision(18, 2);
            });

            // FinansalVeri Tablosu
            modelBuilder.Entity<FinansalVeri>(entity =>
            {
                entity.Property(e => e.Bakiye).HasPrecision(18, 2);
                entity.Property(e => e.IslemTutari).HasPrecision(18, 2);
            });
            modelBuilder.Entity<Anomali>()
                .HasOne(a => a.Kullanici)
                .WithMany(k => k.Anomaliler)
                .HasForeignKey(a => a.KullaniciID)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Anomali>()
                .HasOne(a => a.Kategori)
                .WithMany(k => k.Anomaliler)
                .HasForeignKey(a => a.KategoriID)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Anomali>()
                .HasOne(a => a.FinansalVeri)
                .WithMany()
                .HasForeignKey(a => a.FinansalVeriID)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}