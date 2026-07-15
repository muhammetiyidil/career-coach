using CareerCoachAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace CareerCoachAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class LearningPlatformsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LearningPlatformsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetPlatforms()
        {
            var platforms = await _context.LearningPlatforms
                .OrderBy(x => x.Name)
                .ToListAsync();

            return Ok(platforms);
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActivePlatforms()
        {
            var platforms = await _context.LearningPlatforms
                .Where(x => x.IsActive)
                .OrderBy(x => x.Name)
                .ToListAsync();

            return Ok(platforms);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPlatform(int id)
        {
            var platform = await _context.LearningPlatforms.FindAsync(id);

            if (platform == null)
                return NotFound();

            return Ok(platform);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreatePlatform(LearningPlatform platform)
        {
            if (string.IsNullOrWhiteSpace(platform.Name))
                return BadRequest("Platform name is required.");

            if (string.IsNullOrWhiteSpace(platform.BaseSearchUrl))
                return BadRequest("Base search URL is required.");

            var exists = await _context.LearningPlatforms.AnyAsync(x =>
                x.Name.ToLower() == platform.Name.ToLower());

            if (exists)
                return BadRequest("This platform already exists.");

            platform.Name = platform.Name.Trim();
            platform.BaseSearchUrl = platform.BaseSearchUrl.Trim();
            platform.QuerySuffix = platform.QuerySuffix?.Trim() ?? "";

            _context.LearningPlatforms.Add(platform);
            await _context.SaveChangesAsync();

            return Ok(platform);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdatePlatform(int id, LearningPlatform platform)
        {
            var existing = await _context.LearningPlatforms.FindAsync(id);

            if (existing == null)
                return NotFound();

            if (string.IsNullOrWhiteSpace(platform.Name))
                return BadRequest("Platform name is required.");

            if (string.IsNullOrWhiteSpace(platform.BaseSearchUrl))
                return BadRequest("Base search URL is required.");

            var duplicateExists = await _context.LearningPlatforms.AnyAsync(x =>
                x.Id != id &&
                x.Name.ToLower() == platform.Name.ToLower());

            if (duplicateExists)
                return BadRequest("This platform already exists.");

            existing.Name = platform.Name.Trim();
            existing.BaseSearchUrl = platform.BaseSearchUrl.Trim();
            existing.QuerySuffix = platform.QuerySuffix?.Trim() ?? "";
            existing.IsActive = platform.IsActive;

            await _context.SaveChangesAsync();

            return Ok(existing);
        }

        [HttpPatch("{id}/toggle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> TogglePlatform(int id)
        {
            var platform = await _context.LearningPlatforms.FindAsync(id);

            if (platform == null)
                return NotFound();

            platform.IsActive = !platform.IsActive;

            await _context.SaveChangesAsync();

            return Ok(platform);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePlatform(int id)
        {
            var platform = await _context.LearningPlatforms.FindAsync(id);

            if (platform == null)
                return NotFound();

            _context.LearningPlatforms.Remove(platform);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}