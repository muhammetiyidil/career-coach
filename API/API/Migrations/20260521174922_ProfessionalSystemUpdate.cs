using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerCoachAPI.Migrations
{
    /// <inheritdoc />
    public partial class ProfessionalSystemUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DateOfBirth",
                table: "Users",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "LearningResources",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "MaxLevel",
                table: "LearningResources",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MinLevel",
                table: "LearningResources",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ResourceType",
                table: "LearningResources",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "AverageSalary",
                table: "Careers",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CareerCategory",
                table: "Careers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "WorkType",
                table: "Careers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "LearningResources");

            migrationBuilder.DropColumn(
                name: "MaxLevel",
                table: "LearningResources");

            migrationBuilder.DropColumn(
                name: "MinLevel",
                table: "LearningResources");

            migrationBuilder.DropColumn(
                name: "ResourceType",
                table: "LearningResources");

            migrationBuilder.DropColumn(
                name: "AverageSalary",
                table: "Careers");

            migrationBuilder.DropColumn(
                name: "CareerCategory",
                table: "Careers");

            migrationBuilder.DropColumn(
                name: "WorkType",
                table: "Careers");
        }
    }
}
