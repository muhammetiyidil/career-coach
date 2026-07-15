using CareerCoachAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CareerCoachAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserPersonalSkillProgressController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserPersonalSkillProgressController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUser(int userId)
        {
            if (!IsAdmin() && GetCurrentUserId() != userId)
                return Forbid();

            var data = await _context.UserPersonalSkillProgresses
                .Include(x => x.Skill)
                .Where(x => x.UserId == userId)
                .Select(x => new
                {
                    x.Id,
                    x.UserId,
                    x.SkillId,
                    SkillName = x.Skill != null ? x.Skill.Name : "",
                    x.HasThisSkill,
                    x.Task1Completed,
                    x.Task2Completed,
                    x.Task3Completed,
                    x.ProgressPercentage
                })
                .ToListAsync();

            return Ok(data);
        }

        [HttpPost("select")]
        public async Task<IActionResult> Select(UserPersonalSkillProgress request)
        {
            if (!IsAdmin() && GetCurrentUserId() != request.UserId)
                return Forbid();

            var existing = await _context.UserPersonalSkillProgresses
                .FirstOrDefaultAsync(x =>
                    x.UserId == request.UserId &&
                    x.SkillId == request.SkillId);

            if (existing == null)
            {
                var userSkill = await _context.UserSkills
                    .FirstOrDefaultAsync(x =>
                        x.UserId == request.UserId &&
                        x.SkillId == request.SkillId);

                int level = userSkill?.Level ?? 0;

                existing = new UserPersonalSkillProgress
                {
                    UserId = request.UserId,
                    SkillId = request.SkillId,

                    HasThisSkill = level >= 3,

                    Task1Completed = level >= 1,
                    Task2Completed = level >= 2,
                    Task3Completed = level >= 3,

                    ProgressPercentage = level switch
                    {
                        >= 3 => 100,
                        2 => 66,
                        1 => 33,
                        _ => 0
                    }
                };

                _context.UserPersonalSkillProgresses.Add(existing);
            }

            await _context.SaveChangesAsync();

            return Ok(existing);
        }

        [HttpPost("save")]
        public async Task<IActionResult> Save(UserPersonalSkillProgress request)
        {
            if (!IsAdmin() && GetCurrentUserId() != request.UserId)
                return Forbid();

            var existing = await _context.UserPersonalSkillProgresses
                .FirstOrDefaultAsync(x =>
                    x.UserId == request.UserId &&
                    x.SkillId == request.SkillId);

            int progress = CalculateProgress(
                request.HasThisSkill,
                request.Task1Completed,
                request.Task2Completed,
                request.Task3Completed
            );

            if (existing == null)
            {
                existing = new UserPersonalSkillProgress
                {
                    UserId = request.UserId,
                    SkillId = request.SkillId
                };

                _context.UserPersonalSkillProgresses.Add(existing);
            }

            existing.HasThisSkill = request.HasThisSkill;
            existing.Task1Completed = request.Task1Completed;
            existing.Task2Completed = request.Task2Completed;
            existing.Task3Completed = request.Task3Completed;
            existing.ProgressPercentage = progress;

            await UpdateUserSkillLevel(
                request.UserId,
                request.SkillId,
                progress
            );

            await _context.SaveChangesAsync();

            return Ok(existing);
        }

        [HttpDelete("user/{userId}/skill/{skillId}")]
        public async Task<IActionResult> Delete(int userId, int skillId)
        {
            if (!IsAdmin() && GetCurrentUserId() != userId)
                return Forbid();

            var existing = await _context.UserPersonalSkillProgresses
                .FirstOrDefaultAsync(x =>
                    x.UserId == userId &&
                    x.SkillId == skillId);

            if (existing == null)
                return NotFound();

            _context.UserPersonalSkillProgresses.Remove(existing);

            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task UpdateUserSkillLevel(
            int userId,
            int skillId,
            int progress)
        {
            var existingUserSkill = await _context.UserSkills
                .FirstOrDefaultAsync(x =>
                    x.UserId == userId &&
                    x.SkillId == skillId);

            int level = progress switch
            {
                >= 100 => 3,
                >= 66 => 2,
                >= 33 => 1,
                _ => 0
            };

            if (existingUserSkill == null)
            {
                _context.UserSkills.Add(new UserSkill
                {
                    UserId = userId,
                    SkillId = skillId,
                    Level = level
                });
            }
            else
            {
                existingUserSkill.Level = level;
            }
        }

        private int CalculateProgress(
            bool hasThisSkill,
            bool task1,
            bool task2,
            bool task3)
        {
            if (hasThisSkill)
                return 100;

            int progress = 0;

            if (task1)
                progress += 33;

            if (task2)
                progress += 33;

            if (task3)
                progress += 34;

            return progress;
        }

        private int GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            return int.TryParse(userId, out var id)
                ? id
                : 0;
        }

        private bool IsAdmin()
        {
            return User.IsInRole("Admin");
        }
    }
}