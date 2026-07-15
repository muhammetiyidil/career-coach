using CareerCoachAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace CareerCoachAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserSkillsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserSkillsController(AppDbContext context)
        {
            _context = context;
        }

        private static int GetDisplayPercent(string skillType, int level)
        {
            if (skillType.Equals("Personal", StringComparison.OrdinalIgnoreCase))
            {
                return level switch
                {
                    0 => 0,
                    1 => 33,
                    2 => 66,
                    3 => 100,
                    _ => 100
                };
            }

            return level;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUserSkills()
        {
            var data = await _context.UserSkills
                .Include(x => x.Skill)
                .Select(x => new
                {
                    x.Id,
                    x.UserId,
                    x.SkillId,
                    SkillName = x.Skill != null ? x.Skill.Name : "",
                    SkillCategory = x.Skill != null ? x.Skill.Category : "",
                    SkillType = x.Skill != null ? x.Skill.SkillType : "",
                    x.Level,
                    LevelPercent = x.Skill != null && x.Skill.SkillType == "Personal"
                        ? x.Level == 1 ? 33
                        : x.Level == 2 ? 66
                        : x.Level >= 3 ? 100
                        : 0
                        : x.Level
                })
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUser(int userId)
        {
            if (!IsAdmin() && GetCurrentUserId() != userId)
                return Forbid();

            var data = await _context.UserSkills
                .Include(x => x.Skill)
                .Where(x => x.UserId == userId)
                .Select(x => new
                {
                    x.Id,
                    x.UserId,
                    x.SkillId,
                    SkillName = x.Skill != null ? x.Skill.Name : "",
                    SkillCategory = x.Skill != null ? x.Skill.Category : "",
                    SkillType = x.Skill != null ? x.Skill.SkillType : "",
                    x.Level,
                    LevelPercent = x.Skill != null && x.Skill.SkillType == "Personal"
                        ? x.Level == 1 ? 33
                        : x.Level == 2 ? 66
                        : x.Level >= 3 ? 100
                        : 0
                        : x.Level
                })
                .ToListAsync();

            return Ok(data);
        }

        [HttpPost]
        public async Task<IActionResult> CreateUserSkill(UserSkill userSkill)
        {
            if (!IsAdmin() && GetCurrentUserId() != userSkill.UserId)
                return Forbid();

            var exists = await _context.UserSkills.AnyAsync(x =>
                x.UserId == userSkill.UserId &&
                x.SkillId == userSkill.SkillId);

            if (exists)
                return BadRequest("This skill is already added for this user.");

            var skill = await _context.Skills.FindAsync(userSkill.SkillId);

            bool isPersonalSkill =
                skill != null &&
                skill.SkillType.Equals("Personal", StringComparison.OrdinalIgnoreCase);

            if (isPersonalSkill)
            {
                if (userSkill.Level < 0) userSkill.Level = 0;
                if (userSkill.Level > 3) userSkill.Level = 3;
            }
            else
            {
                if (userSkill.Level < 0) userSkill.Level = 0;
                if (userSkill.Level > 5) userSkill.Level = 5;
            }

            _context.UserSkills.Add(userSkill);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                userSkill.Id,
                userSkill.UserId,
                userSkill.SkillId,
                SkillName = skill != null ? skill.Name : "",
                SkillCategory = skill != null ? skill.Category : "",
                SkillType = skill != null ? skill.SkillType : "",
                userSkill.Level,
                LevelPercent = skill != null && skill.SkillType == "Personal"
        ? GetDisplayPercent(skill.SkillType, userSkill.Level)
        : userSkill.Level
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUserSkill(int id, UserSkill userSkill)
        {
            var existing = await _context.UserSkills
                .Include(x => x.Skill)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (existing == null)
                return NotFound();

            if (!IsAdmin() && GetCurrentUserId() != existing.UserId)
                return Forbid();

            existing.SkillId = userSkill.SkillId;

            var skill = await _context.Skills.FindAsync(userSkill.SkillId);

            bool isPersonalSkill =
                skill != null &&
                skill.SkillType.Equals("Personal", StringComparison.OrdinalIgnoreCase);

            if (isPersonalSkill)
            {
                existing.Level = userSkill.Level < 0 ? 0 : userSkill.Level > 3 ? 3 : userSkill.Level;
            }
            else
            {
                existing.Level = userSkill.Level < 0 ? 0 : userSkill.Level > 5 ? 5 : userSkill.Level;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                userSkill.Id,
                userSkill.UserId,
                userSkill.SkillId,
                SkillName = skill != null ? skill.Name : "",
                SkillCategory = skill != null ? skill.Category : "",
                SkillType = skill != null ? skill.SkillType : "",
                userSkill.Level,
                LevelPercent = skill != null && skill.SkillType == "Personal"
        ? GetDisplayPercent(skill.SkillType, userSkill.Level)
        : userSkill.Level
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUserSkill(int id)
        {
            var existing = await _context.UserSkills.FindAsync(id);

            if (existing == null)
                return NotFound();

            if (!IsAdmin() && GetCurrentUserId() != existing.UserId)
                return Forbid();

            _context.UserSkills.Remove(existing);

            await _context.SaveChangesAsync();

            return NoContent();
        }

        private int GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            return int.TryParse(userId, out var id) ? id : 0;
        }

        private bool IsAdmin()
        {
            return User.IsInRole("Admin");
        }
    }
}