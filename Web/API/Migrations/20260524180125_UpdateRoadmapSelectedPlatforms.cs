using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerCoachAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRoadmapSelectedPlatforms : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UsedCoursera",
                table: "UserRoadmapStates");

            migrationBuilder.DropColumn(
                name: "UsedUdemy",
                table: "UserRoadmapStates");

            migrationBuilder.DropColumn(
                name: "UsedYoutube",
                table: "UserRoadmapStates");

            migrationBuilder.AddColumn<string>(
                name: "SelectedPlatforms",
                table: "UserRoadmapStates",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SelectedPlatforms",
                table: "UserRoadmapStates");

            migrationBuilder.AddColumn<bool>(
                name: "UsedCoursera",
                table: "UserRoadmapStates",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "UsedUdemy",
                table: "UserRoadmapStates",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "UsedYoutube",
                table: "UserRoadmapStates",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
