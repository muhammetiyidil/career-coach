using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerCoachAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddSelectedPlatformsToUserLearningProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UsedCoursera",
                table: "UserLearningProgresses");

            migrationBuilder.DropColumn(
                name: "UsedUdemy",
                table: "UserLearningProgresses");

            migrationBuilder.DropColumn(
                name: "UsedYoutube",
                table: "UserLearningProgresses");

            migrationBuilder.AddColumn<string>(
                name: "SelectedPlatforms",
                table: "UserLearningProgresses",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SelectedPlatforms",
                table: "UserLearningProgresses");

            migrationBuilder.AddColumn<bool>(
                name: "UsedCoursera",
                table: "UserLearningProgresses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "UsedUdemy",
                table: "UserLearningProgresses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "UsedYoutube",
                table: "UserLearningProgresses",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
