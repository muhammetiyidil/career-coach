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
    public class UserCareersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserCareersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var data = await _context.UserCareers
                .Select(x => new
                {
                    x.Id,
                    x.UserId,
                    UserName = x.User != null
                        ? (x.User.FirstName + " " + x.User.LastName)
                        : "",
                    UserEmail = x.User != null ? x.User.Email : "",

                    x.CareerId,
                    CareerTitle = x.Career != null ? x.Career.Title : "",
                    CareerDescription = x.Career != null ? x.Career.Description : "",

                    x.MatchPercentage,
                    x.SelectedAt
                })
                .OrderByDescending(x => x.SelectedAt)
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUser(int userId)
        {
            if (!IsAdmin() && GetCurrentUserId() != userId)
                return Forbid();

            var data = await _context.UserCareers
                .Where(x => x.UserId == userId)
                .Select(x => new
                {
                    x.Id,
                    x.UserId,
                    x.CareerId,
                    x.MatchPercentage,
                    x.SelectedAt,

                    CareerTitle = x.Career != null ? x.Career.Title : "",
                    CareerDescription = x.Career != null ? x.Career.Description : ""
                })
                .OrderByDescending(x => x.SelectedAt)
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("career-skills/{userId}")]
        public async Task<IActionResult> GetSelectedCareerSkills(int userId)
        {
            if (!IsAdmin() && GetCurrentUserId() != userId)
                return Forbid();

            var selectedCareerIds = await _context.UserCareers
                .Where(x => x.UserId == userId)
                .Select(x => x.CareerId)
                .ToListAsync();

            var skillIds = await _context.CareerSkills
                .Where(x => selectedCareerIds.Contains(x.CareerId))
                .Select(x => x.SkillId)
                .Distinct()
                .ToListAsync();

            return Ok(skillIds);
        }

        [HttpPost("select")]
        public async Task<IActionResult> SelectCareers(List<UserCareer> selectedCareers)
        {
            if (selectedCareers == null || selectedCareers.Count == 0)
                return BadRequest("At least one career must be selected.");

            if (selectedCareers.Count > 4)
                return BadRequest("You can select maximum 4 careers.");

            int userId = selectedCareers.First().UserId;

            if (!IsAdmin() && GetCurrentUserId() != userId)
                return Forbid();

            if (userId <= 0)
                return BadRequest("Invalid user id.");

            var oldSelections = await _context.UserCareers
                .Where(x => x.UserId == userId)
                .ToListAsync();

            _context.UserCareers.RemoveRange(oldSelections);

            var cleanSelections = selectedCareers.Select(x => new UserCareer
            {
                UserId = userId,
                CareerId = x.CareerId,
                MatchPercentage = x.MatchPercentage,
                SelectedAt = DateTime.UtcNow
            }).ToList();

            _context.UserCareers.AddRange(cleanSelections);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Selected careers saved successfully.",
                userId = userId,
                count = cleanSelections.Count,
                data = cleanSelections
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUserCareer(int id)
        {
            var existing = await _context.UserCareers.FindAsync(id);

            if (existing == null)
                return NotFound();

            if (!IsAdmin() && GetCurrentUserId() != existing.UserId)
                return Forbid();

            _context.UserCareers.Remove(existing);

            await _context.SaveChangesAsync();

            return NoContent();
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