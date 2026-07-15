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
    public class RoadmapStateController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RoadmapStateController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllRoadmapStates()
        {
            var states = await _context.UserRoadmapStates
                .OrderByDescending(x => x.UpdatedAt)
                .ToListAsync();

            return Ok(states);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserRoadmapStates(int userId)
        {
            if (!IsAdmin() && GetCurrentUserId() != userId)
                return Forbid();

            var states = await _context.UserRoadmapStates
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.UpdatedAt)
                .ToListAsync();

            return Ok(states);
        }

        [HttpGet("user/{userId}/skill/{skillId}")]
        public async Task<IActionResult> GetUserSkillRoadmapState(int userId, int skillId)
        {
            if (!IsAdmin() && GetCurrentUserId() != userId)
                return Forbid();

            var states = await _context.UserRoadmapStates
                .Where(x =>
                    x.UserId == userId &&
                    x.SkillId == skillId)
                .OrderByDescending(x => x.UpdatedAt)
                .ToListAsync();

            if (states.Count == 0)
                return NotFound();

            return Ok(states);
        }

        [HttpGet("user/{userId}/skill/{skillId}/levels/{fromLevel}/{toLevel}")]
        public async Task<IActionResult> GetUserSkillLevelRoadmapState(
            int userId,
            int skillId,
            int fromLevel,
            int toLevel)
        {
            if (!IsAdmin() && GetCurrentUserId() != userId)
                return Forbid();

            var state = await _context.UserRoadmapStates
                .FirstOrDefaultAsync(x =>
                    x.UserId == userId &&
                    x.SkillId == skillId &&
                    x.FromLevel == fromLevel &&
                    x.ToLevel == toLevel);

            if (state == null)
                return NotFound();

            return Ok(state);
        }

        [HttpPost("save")]
        public async Task<IActionResult> SaveRoadmapState(UserRoadmapState request)
        {
            if (!IsAdmin() && GetCurrentUserId() != request.UserId)
                return Forbid();

            if (request.UserId <= 0 || request.SkillId <= 0)
                return BadRequest("UserId and SkillId are required.");

            if (request.FromLevel < 0 || request.ToLevel < 0)
                return BadRequest("FromLevel and ToLevel must be valid.");

            var existing = await _context.UserRoadmapStates
                .FirstOrDefaultAsync(x =>
                    x.UserId == request.UserId &&
                    x.SkillId == request.SkillId &&
                    x.FromLevel == request.FromLevel &&
                    x.ToLevel == request.ToLevel);

            if (existing == null)
            {
                request.SelectedPlatforms ??= string.Empty;
                request.PracticeTaskDescription ??= string.Empty;
                request.CaseStudyDescription ??= string.Empty;
                request.ProjectDescription ??= string.Empty;
                request.UpdatedAt = DateTime.UtcNow;

                _context.UserRoadmapStates.Add(request);
                await _context.SaveChangesAsync();

                return Ok(request);
            }

            existing.SelectedPlatforms = request.SelectedPlatforms ?? string.Empty;

            existing.IsCompleted = request.IsCompleted;

            existing.IsPracticeTaskCompleted = request.IsPracticeTaskCompleted;
            existing.PracticeTaskDescription = request.PracticeTaskDescription ?? string.Empty;

            existing.IsCaseStudyCompleted = request.IsCaseStudyCompleted;
            existing.CaseStudyDescription = request.CaseStudyDescription ?? string.Empty;

            existing.IsProjectCompleted = request.IsProjectCompleted;
            existing.ProjectDescription = request.ProjectDescription ?? string.Empty;

            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(existing);
        }

        [HttpDelete("user/{userId}/skill/{skillId}")]
        public async Task<IActionResult> DeleteRoadmapStatesBySkill(int userId, int skillId)
        {
            if (!IsAdmin() && GetCurrentUserId() != userId)
                return Forbid();

            var states = await _context.UserRoadmapStates
                .Where(x =>
                    x.UserId == userId &&
                    x.SkillId == skillId)
                .ToListAsync();

            if (states.Count == 0)
                return NotFound();

            _context.UserRoadmapStates.RemoveRange(states);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("user/{userId}/skill/{skillId}/levels/{fromLevel}/{toLevel}")]
        public async Task<IActionResult> DeleteRoadmapStateByLevel(
            int userId,
            int skillId,
            int fromLevel,
            int toLevel)
        {
            if (!IsAdmin() && GetCurrentUserId() != userId)
                return Forbid();

            var existing = await _context.UserRoadmapStates
                .FirstOrDefaultAsync(x =>
                    x.UserId == userId &&
                    x.SkillId == skillId &&
                    x.FromLevel == fromLevel &&
                    x.ToLevel == toLevel);

            if (existing == null)
                return NotFound();

            _context.UserRoadmapStates.Remove(existing);
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