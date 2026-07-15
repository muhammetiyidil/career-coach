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
    public class ProjectsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProjectsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUser(int userId)
        {
            if (!IsAdmin() && GetCurrentUserId() != userId)
                return Forbid();

            var data = await _context.Projects
                .Where(x => x.UserId == userId)
                .ToListAsync();

            return Ok(data);
        }

        [HttpPost]
        public async Task<IActionResult> CreateProject(Project project)
        {
            if (!IsAdmin() && GetCurrentUserId() != project.UserId)
                return Forbid();

            project.CreatedAt = DateTime.UtcNow;

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            return Ok(project);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProject(int id, Project project)
        {
            var existing = await _context.Projects.FindAsync(id);

            if (existing == null)
                return NotFound();

            if (!IsAdmin() && GetCurrentUserId() != existing.UserId)
                return Forbid();

            existing.Title = project.Title;
            existing.Description = project.Description;
            existing.Technologies = project.Technologies;
            existing.GithubUrl = project.GithubUrl;
            existing.LiveDemoUrl = project.LiveDemoUrl;
            existing.ProjectType = project.ProjectType;

            await _context.SaveChangesAsync();

            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var existing = await _context.Projects.FindAsync(id);

            if (existing == null)
                return NotFound();

            if (!IsAdmin() && GetCurrentUserId() != existing.UserId)
                return Forbid();

            _context.Projects.Remove(existing);
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