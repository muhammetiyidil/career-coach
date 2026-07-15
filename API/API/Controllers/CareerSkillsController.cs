using CareerCoachAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace CareerCoachAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CareerSkillsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CareerSkillsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCareerSkills()
        {
            var data = await _context.CareerSkills
                .Select(x => new
                {
                    x.Id,
                    x.CareerId,
                    CareerTitle = x.Career != null ? x.Career.Title : "",
                    x.SkillId,
                    SkillName = x.Skill != null ? x.Skill.Name : "",
                    SkillCategory = x.Skill != null ? x.Skill.Category : "",
                    x.RequiredLevel,
                    x.ImportanceScore
                })
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCareerSkill(int id)
        {
            var data = await _context.CareerSkills
                .Where(x => x.Id == id)
                .Select(x => new
                {
                    x.Id,
                    x.CareerId,
                    CareerTitle = x.Career != null ? x.Career.Title : "",
                    x.SkillId,
                    SkillName = x.Skill != null ? x.Skill.Name : "",
                    SkillCategory = x.Skill != null ? x.Skill.Category : "",
                    x.RequiredLevel,
                    x.ImportanceScore
                })
                .FirstOrDefaultAsync();

            if (data == null)
                return NotFound();

            return Ok(data);
        }

        [HttpGet("career/{careerId}")]
        public async Task<IActionResult> GetByCareer(int careerId)
        {
            var data = await _context.CareerSkills
                .Where(x => x.CareerId == careerId)
                .Select(x => new
                {
                    x.Id,
                    x.CareerId,
                    CareerTitle = x.Career != null ? x.Career.Title : "",
                    x.SkillId,
                    SkillName = x.Skill != null ? x.Skill.Name : "",
                    SkillCategory = x.Skill != null ? x.Skill.Category : "",
                    x.RequiredLevel,
                    x.ImportanceScore
                })
                .ToListAsync();

            return Ok(data);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCareerSkill(CareerSkill careerSkill)
        {
            var exists = await _context.CareerSkills.AnyAsync(x =>
                x.CareerId == careerSkill.CareerId &&
                x.SkillId == careerSkill.SkillId);

            if (exists)
                return BadRequest("This skill is already added to this career.");

            if (careerSkill.RequiredLevel <= 0)
                careerSkill.RequiredLevel = 1;

            if (careerSkill.ImportanceScore <= 0)
                careerSkill.ImportanceScore = 3;

            _context.CareerSkills.Add(careerSkill);

            await _context.SaveChangesAsync();

            return Ok(careerSkill);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCareerSkill(int id, CareerSkill careerSkill)
        {
            var existing = await _context.CareerSkills.FindAsync(id);

            if (existing == null)
                return NotFound();

            var duplicateExists = await _context.CareerSkills.AnyAsync(x =>
                x.Id != id &&
                x.CareerId == careerSkill.CareerId &&
                x.SkillId == careerSkill.SkillId);

            if (duplicateExists)
                return BadRequest("This skill is already added to this career.");

            existing.CareerId = careerSkill.CareerId;

            existing.SkillId = careerSkill.SkillId;

            existing.RequiredLevel = careerSkill.RequiredLevel <= 0
                ? 1
                : careerSkill.RequiredLevel;

            existing.ImportanceScore = careerSkill.ImportanceScore <= 0
                ? 3
                : careerSkill.ImportanceScore;

            await _context.SaveChangesAsync();

            return Ok(existing);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCareerSkill(int id)
        {
            var existing = await _context.CareerSkills.FindAsync(id);

            if (existing == null)
                return NotFound();

            _context.CareerSkills.Remove(existing);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}