using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerCoachAPI.Migrations
{
    /// <inheritdoc />npm
    public partial class AddCountryAndCity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Location",
                table: "Users",
                newName: "Country");

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "City",
                table: "Users");

            migrationBuilder.RenameColumn(
                name: "Country",
                table: "Users",
                newName: "Location");
        }
    }
}
