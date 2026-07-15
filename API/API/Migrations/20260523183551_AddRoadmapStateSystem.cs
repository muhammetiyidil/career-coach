using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerCoachAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddRoadmapStateSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserRoadmapStates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    SkillId = table.Column<int>(type: "int", nullable: false),
                    UsedYoutube = table.Column<bool>(type: "bit", nullable: false),
                    UsedUdemy = table.Column<bool>(type: "bit", nullable: false),
                    UsedCoursera = table.Column<bool>(type: "bit", nullable: false),
                    IsPracticeTaskCompleted = table.Column<bool>(type: "bit", nullable: false),
                    PracticeTaskDescription = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsCaseStudyCompleted = table.Column<bool>(type: "bit", nullable: false),
                    CaseStudyDescription = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsProjectCompleted = table.Column<bool>(type: "bit", nullable: false),
                    ProjectDescription = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoadmapStates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserRoadmapStates_Skills_SkillId",
                        column: x => x.SkillId,
                        principalTable: "Skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserRoadmapStates_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserRoadmapStates_SkillId",
                table: "UserRoadmapStates",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_UserRoadmapStates_UserId",
                table: "UserRoadmapStates",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserRoadmapStates");
        }
    }
}
