using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerCoachAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePersonalSkillTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PersonalProjectSuggestionTemplate",
                table: "Skills",
                newName: "PersonalReflectionTemplate");

            migrationBuilder.RenameColumn(
                name: "PersonalProjectDescriptionTemplate",
                table: "Skills",
                newName: "PersonalRealLifeExerciseTemplate");

            migrationBuilder.RenameColumn(
                name: "PersonalPracticeTaskTemplate",
                table: "Skills",
                newName: "PersonalFeedbackTemplate");

            migrationBuilder.RenameColumn(
                name: "PersonalCaseStudyTemplate",
                table: "Skills",
                newName: "PersonalDevelopmentActivityTemplate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PersonalReflectionTemplate",
                table: "Skills",
                newName: "PersonalProjectSuggestionTemplate");

            migrationBuilder.RenameColumn(
                name: "PersonalRealLifeExerciseTemplate",
                table: "Skills",
                newName: "PersonalProjectDescriptionTemplate");

            migrationBuilder.RenameColumn(
                name: "PersonalFeedbackTemplate",
                table: "Skills",
                newName: "PersonalPracticeTaskTemplate");

            migrationBuilder.RenameColumn(
                name: "PersonalDevelopmentActivityTemplate",
                table: "Skills",
                newName: "PersonalCaseStudyTemplate");
        }
    }
}
