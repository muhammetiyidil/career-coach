using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerCoachAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonalSkillTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PersonalCaseStudyTemplate",
                table: "Skills",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PersonalPracticeTaskTemplate",
                table: "Skills",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PersonalProjectDescriptionTemplate",
                table: "Skills",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PersonalProjectSuggestionTemplate",
                table: "Skills",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PersonalCaseStudyTemplate",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "PersonalPracticeTaskTemplate",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "PersonalProjectDescriptionTemplate",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "PersonalProjectSuggestionTemplate",
                table: "Skills");
        }
    }
}
