using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinansalAnaliz.Migrations
{
    /// <inheritdoc />
    public partial class AddMlKategori : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MlKategori",
                table: "Kategoriler",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MlKategori",
                table: "Kategoriler");
        }
    }
}
