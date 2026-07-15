using CareerCoachAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace CareerCoachAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SkillCategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SkillCategoriesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            return Ok(await _context.SkillCategories.ToListAsync());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategory(int id)
        {
            var category = await _context.SkillCategories.FindAsync(id);

            if (category == null)
                return NotFound();

            return Ok(category);
        }

        [HttpGet("type/{skillType}")]
        public async Task<IActionResult> GetCategoriesByType(string skillType)
        {
            var categories = await _context.SkillCategories
                .Where(x => x.SkillType.ToLower() == skillType.ToLower())
                .ToListAsync();

            return Ok(categories);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCategory(SkillCategory category)
        {
            if (string.IsNullOrWhiteSpace(category.Name))
                return BadRequest("Category name is required.");

            if (string.IsNullOrWhiteSpace(category.SkillType))
                return BadRequest("Skill type is required.");

            var exists = await _context.SkillCategories.AnyAsync(x =>
                x.Name.ToLower() == category.Name.ToLower() &&
                x.SkillType.ToLower() == category.SkillType.ToLower());

            if (exists)
                return BadRequest("Category already exists for this skill type.");

            NormalizeTemplates(category);

            _context.SkillCategories.Add(category);
            await _context.SaveChangesAsync();

            return Ok(category);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCategory(int id, SkillCategory category)
        {
            var existing = await _context.SkillCategories.FindAsync(id);

            if (existing == null)
                return NotFound();

            if (string.IsNullOrWhiteSpace(category.Name))
                return BadRequest("Category name is required.");

            if (string.IsNullOrWhiteSpace(category.SkillType))
                return BadRequest("Skill type is required.");

            var duplicateExists = await _context.SkillCategories.AnyAsync(x =>
                x.Id != id &&
                x.Name.ToLower() == category.Name.ToLower() &&
                x.SkillType.ToLower() == category.SkillType.ToLower());

            if (duplicateExists)
                return BadRequest("Category already exists for this skill type.");

            existing.Name = category.Name;
            existing.SkillType = category.SkillType;

            existing.PracticeTask01 = category.PracticeTask01 ?? "";
            existing.PracticeTask12 = category.PracticeTask12 ?? "";
            existing.PracticeTask23 = category.PracticeTask23 ?? "";
            existing.PracticeTask34 = category.PracticeTask34 ?? "";
            existing.PracticeTask45 = category.PracticeTask45 ?? "";

            existing.CaseStudy01 = category.CaseStudy01 ?? "";
            existing.CaseStudy12 = category.CaseStudy12 ?? "";
            existing.CaseStudy23 = category.CaseStudy23 ?? "";
            existing.CaseStudy34 = category.CaseStudy34 ?? "";
            existing.CaseStudy45 = category.CaseStudy45 ?? "";

            existing.ProjectSuggestion01 = category.ProjectSuggestion01 ?? "";
            existing.ProjectSuggestion12 = category.ProjectSuggestion12 ?? "";
            existing.ProjectSuggestion23 = category.ProjectSuggestion23 ?? "";
            existing.ProjectSuggestion34 = category.ProjectSuggestion34 ?? "";
            existing.ProjectSuggestion45 = category.ProjectSuggestion45 ?? "";

            existing.ProjectDescription01 = category.ProjectDescription01 ?? "";
            existing.ProjectDescription12 = category.ProjectDescription12 ?? "";
            existing.ProjectDescription23 = category.ProjectDescription23 ?? "";
            existing.ProjectDescription34 = category.ProjectDescription34 ?? "";
            existing.ProjectDescription45 = category.ProjectDescription45 ?? "";

            await _context.SaveChangesAsync();

            return Ok(existing);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var existing = await _context.SkillCategories.FindAsync(id);

            if (existing == null)
                return NotFound();

            _context.SkillCategories.Remove(existing);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private static void NormalizeTemplates(SkillCategory category)
        {
            category.PracticeTask01 ??= "";
            category.PracticeTask12 ??= "";
            category.PracticeTask23 ??= "";
            category.PracticeTask34 ??= "";
            category.PracticeTask45 ??= "";

            category.CaseStudy01 ??= "";
            category.CaseStudy12 ??= "";
            category.CaseStudy23 ??= "";
            category.CaseStudy34 ??= "";
            category.CaseStudy45 ??= "";

            category.ProjectSuggestion01 ??= "";
            category.ProjectSuggestion12 ??= "";
            category.ProjectSuggestion23 ??= "";
            category.ProjectSuggestion34 ??= "";
            category.ProjectSuggestion45 ??= "";

            category.ProjectDescription01 ??= "";
            category.ProjectDescription12 ??= "";
            category.ProjectDescription23 ??= "";
            category.ProjectDescription34 ??= "";
            category.ProjectDescription45 ??= "";
        }
    }
}