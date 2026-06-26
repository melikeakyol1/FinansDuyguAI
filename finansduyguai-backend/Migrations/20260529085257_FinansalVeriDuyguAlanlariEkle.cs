using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinansalAnaliz.Migrations
{
    /// <inheritdoc />
    public partial class FinansalVeriDuyguAlanlariEkle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Duygu",
                table: "FinansalVeriler",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DuyguNotu",
                table: "FinansalVeriler",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "GuvenSkoru",
                table: "FinansalVeriler",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MetinDuygusu",
                table: "FinansalVeriler",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Duygu",
                table: "FinansalVeriler");

            migrationBuilder.DropColumn(
                name: "DuyguNotu",
                table: "FinansalVeriler");

            migrationBuilder.DropColumn(
                name: "GuvenSkoru",
                table: "FinansalVeriler");

            migrationBuilder.DropColumn(
                name: "MetinDuygusu",
                table: "FinansalVeriler");
        }
    }
}
