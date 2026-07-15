using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerCoachAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddLearningTrackingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CaseStudyDescription",
                table: "UserLearningProgresses",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsCaseStudyCompleted",
                table: "UserLearningProgresses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPracticeTaskCompleted",
                table: "UserLearningProgresses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsProjectCompleted",
                table: "UserLearningProgresses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PracticeTaskDescription",
                table: "UserLearningProgresses",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProjectDescription",
                table: "UserLearningProgresses",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CaseStudyDescription",
                table: "UserLearningProgresses");

            migrationBuilder.DropColumn(
                name: "IsCaseStudyCompleted",
                table: "UserLearningProgresses");

            migrationBuilder.DropColumn(
                name: "IsPracticeTaskCompleted",
                table: "UserLearningProgresses");

            migrationBuilder.DropColumn(
                name: "IsProjectCompleted",
                table: "UserLearningProgresses");

            migrationBuilder.DropColumn(
                name: "PracticeTaskDescription",
                table: "UserLearningProgresses");

            migrationBuilder.DropColumn(
                name: "ProjectDescription",
                table: "UserLearningProgresses");

            migrationBuilder.DropColumn(
                name: "UsedCoursera",
                table: "UserLearningProgresses");

            migrationBuilder.DropColumn(
                name: "UsedUdemy",
                table: "UserLearningProgresses");

            migrationBuilder.DropColumn(
                name: "UsedYoutube",
                table: "UserLearningProgresses");
        }
    }
}
