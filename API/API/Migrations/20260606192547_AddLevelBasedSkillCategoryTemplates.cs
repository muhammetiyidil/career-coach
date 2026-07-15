using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerCoachAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddLevelBasedSkillCategoryTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ProjectSuggestionTemplate",
                table: "SkillCategories",
                newName: "ProjectSuggestion45");

            migrationBuilder.RenameColumn(
                name: "ProjectDescriptionTemplate",
                table: "SkillCategories",
                newName: "ProjectSuggestion34");

            migrationBuilder.RenameColumn(
                name: "PracticeTaskTemplate",
                table: "SkillCategories",
                newName: "ProjectSuggestion23");

            migrationBuilder.RenameColumn(
                name: "CaseStudyTemplate",
                table: "SkillCategories",
                newName: "ProjectSuggestion12");

            migrationBuilder.AddColumn<string>(
                name: "CaseStudy01",
                table: "SkillCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CaseStudy12",
                table: "SkillCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CaseStudy23",
                table: "SkillCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CaseStudy34",
                table: "SkillCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CaseStudy45",
                table: "SkillCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PracticeTask01",
                table: "SkillCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PracticeTask12",
                table: "SkillCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PracticeTask23",
                table: "SkillCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PracticeTask34",
                table: "SkillCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PracticeTask45",
                table: "SkillCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProjectDescription01",
                table: "SkillCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProjectDescription12",
                table: "SkillCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProjectDescription23",
                table: "SkillCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProjectDescription34",
                table: "SkillCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProjectDescription45",
                table: "SkillCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProjectSuggestion01",
                table: "SkillCategories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CaseStudy01",
                table: "SkillCategories");

            migrationBuilder.DropColumn(
                name: "CaseStudy12",
                table: "SkillCategories");

            migrationBuilder.DropColumn(
                name: "CaseStudy23",
                table: "SkillCategories");

            migrationBuilder.DropColumn(
                name: "CaseStudy34",
                table: "SkillCategories");

            migrationBuilder.DropColumn(
                name: "CaseStudy45",
                table: "SkillCategories");

            migrationBuilder.DropColumn(
                name: "PracticeTask01",
                table: "SkillCategories");

            migrationBuilder.DropColumn(
                name: "PracticeTask12",
                table: "SkillCategories");

            migrationBuilder.DropColumn(
                name: "PracticeTask23",
                table: "SkillCategories");

            migrationBuilder.DropColumn(
                name: "PracticeTask34",
                table: "SkillCategories");

            migrationBuilder.DropColumn(
                name: "PracticeTask45",
                table: "SkillCategories");

            migrationBuilder.DropColumn(
                name: "ProjectDescription01",
                table: "SkillCategories");

            migrationBuilder.DropColumn(
                name: "ProjectDescription12",
                table: "SkillCategories");

            migrationBuilder.DropColumn(
                name: "ProjectDescription23",
                table: "SkillCategories");

            migrationBuilder.DropColumn(
                name: "ProjectDescription34",
                table: "SkillCategories");

            migrationBuilder.DropColumn(
                name: "ProjectDescription45",
                table: "SkillCategories");

            migrationBuilder.DropColumn(
                name: "ProjectSuggestion01",
                table: "SkillCategories");

            migrationBuilder.RenameColumn(
                name: "ProjectSuggestion45",
                table: "SkillCategories",
                newName: "ProjectSuggestionTemplate");

            migrationBuilder.RenameColumn(
                name: "ProjectSuggestion34",
                table: "SkillCategories",
                newName: "ProjectDescriptionTemplate");

            migrationBuilder.RenameColumn(
                name: "ProjectSuggestion23",
                table: "SkillCategories",
                newName: "PracticeTaskTemplate");

            migrationBuilder.RenameColumn(
                name: "ProjectSuggestion12",
                table: "SkillCategories",
                newName: "CaseStudyTemplate");
        }
    }
}
