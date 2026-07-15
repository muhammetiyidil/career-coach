using CareerCoachAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace CareerCoachAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SkillsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SkillsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetSkills()
        {
            return Ok(await _context.Skills.ToListAsync());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSkill(int id)
        {
            var skill = await _context.Skills.FindAsync(id);

            if (skill == null)
                return NotFound();

            return Ok(skill);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateSkill(Skill skill)
        {
            if (string.IsNullOrWhiteSpace(skill.Name))
                return BadRequest("Skill name is required.");

            if (string.IsNullOrWhiteSpace(skill.SkillType))
                return BadRequest("Skill type is required.");

            if (skill.SkillType.Equals("Personal", StringComparison.OrdinalIgnoreCase))
            {
                skill.Category = "Personal";

                skill.PersonalDevelopmentActivityTemplate ??= "";
                skill.PersonalReflectionTemplate ??= "";
                skill.PersonalFeedbackTemplate ??= "";
                skill.PersonalRealLifeExerciseTemplate ??= "";
            }
            else
            {
                if (string.IsNullOrWhiteSpace(skill.Category))
                    return BadRequest("Category is required for technical skills.");

                skill.PersonalDevelopmentActivityTemplate = "";
                skill.PersonalReflectionTemplate = "";
                skill.PersonalFeedbackTemplate = "";
                skill.PersonalRealLifeExerciseTemplate = "";
            }

            _context.Skills.Add(skill);
            await _context.SaveChangesAsync();

            return Ok(skill);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSkill(int id, Skill skill)
        {
            var existingSkill = await _context.Skills.FindAsync(id);

            if (existingSkill == null)
                return NotFound();

            if (string.IsNullOrWhiteSpace(skill.Name))
                return BadRequest("Skill name is required.");

            if (string.IsNullOrWhiteSpace(skill.SkillType))
                return BadRequest("Skill type is required.");

            existingSkill.Name = skill.Name;
            existingSkill.SkillType = skill.SkillType;
            existingSkill.Description = skill.Description ?? "";

            if (skill.SkillType.Equals("Personal", StringComparison.OrdinalIgnoreCase))
            {
                existingSkill.Category = "Personal";

                existingSkill.PersonalDevelopmentActivityTemplate =
                    skill.PersonalDevelopmentActivityTemplate ?? "";

                existingSkill.PersonalReflectionTemplate =
                    skill.PersonalReflectionTemplate ?? "";

                existingSkill.PersonalFeedbackTemplate =
                    skill.PersonalFeedbackTemplate ?? "";

                existingSkill.PersonalRealLifeExerciseTemplate =
                    skill.PersonalRealLifeExerciseTemplate ?? "";
            }
            else
            {
                if (string.IsNullOrWhiteSpace(skill.Category))
                    return BadRequest("Category is required for technical skills.");

                existingSkill.Category = skill.Category;

                existingSkill.PersonalDevelopmentActivityTemplate = "";
                existingSkill.PersonalReflectionTemplate = "";
                existingSkill.PersonalFeedbackTemplate = "";
                existingSkill.PersonalRealLifeExerciseTemplate = "";
            }

            await _context.SaveChangesAsync();

            return Ok(existingSkill);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteSkill(int id)
        {
            var skill = await _context.Skills.FindAsync(id);

            if (skill == null)
                return NotFound();

            _context.Skills.Remove(skill);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}