using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerCoachAPI.Migrations
{
    /// <inheritdoc />
    public partial class MakeEducationDepartmentOptional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Department",
                table: "Educations",
                newName: "CustomDepartmentName");

            migrationBuilder.AddColumn<int>(
                name: "DepartmentId",
                table: "Educations",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Educations_DepartmentId",
                table: "Educations",
                column: "DepartmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Educations_Departments_DepartmentId",
                table: "Educations",
                column: "DepartmentId",
                principalTable: "Departments",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Educations_Departments_DepartmentId",
                table: "Educations");

            migrationBuilder.DropIndex(
                name: "IX_Educations_DepartmentId",
                table: "Educations");

            migrationBuilder.DropColumn(
                name: "DepartmentId",
                table: "Educations");

            migrationBuilder.RenameColumn(
                name: "CustomDepartmentName",
                table: "Educations",
                newName: "Department");
        }
    }
}
