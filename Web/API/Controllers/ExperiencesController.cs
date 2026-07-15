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
    public class ExperiencesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ExperiencesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUser(int userId)
        {
            if (!IsAdmin() && GetCurrentUserId() != userId)
                return Forbid();

            var data = await _context.Experiences
                .Where(x => x.UserId == userId)
                .ToListAsync();

            return Ok(data);
        }

        [HttpPost]
        public async Task<IActionResult> CreateExperience(Experience experience)
        {
            if (!IsAdmin() && GetCurrentUserId() != experience.UserId)
                return Forbid();

            _context.Experiences.Add(experience);
            await _context.SaveChangesAsync();

            return Ok(experience);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateExperience(int id, Experience experience)
        {
            var existing = await _context.Experiences.FindAsync(id);

            if (existing == null)
                return NotFound();

            if (!IsAdmin() && GetCurrentUserId() != existing.UserId)
                return Forbid();

            existing.CompanyName = experience.CompanyName;
            existing.Position = experience.Position;
            existing.Technologies = experience.Technologies;
            existing.Description = experience.Description;
            existing.DurationInMonths = experience.DurationInMonths;

            await _context.SaveChangesAsync();

            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteExperience(int id)
        {
            var existing = await _context.Experiences.FindAsync(id);

            if (existing == null)
                return NotFound();

            if (!IsAdmin() && GetCurrentUserId() != existing.UserId)
                return Forbid();

            _context.Experiences.Remove(existing);
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