using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinansalAnaliz.Migrations
{
    /// <inheritdoc />
    public partial class DuyguAnaliziEkle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<float>(
                name: "GuvenSkoru",
                table: "DuyguKayitlari",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MetinDuygusu",
                table: "DuyguKayitlari",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GuvenSkoru",
                table: "DuyguKayitlari");

            migrationBuilder.DropColumn(
                name: "MetinDuygusu",
                table: "DuyguKayitlari");
        }
    }
}
