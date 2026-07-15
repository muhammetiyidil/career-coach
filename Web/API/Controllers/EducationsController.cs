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
    public class EducationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EducationsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUser(int userId)
        {
            if (!IsAdmin() && GetCurrentUserId() != userId)
                return Forbid();

            var data = await _context.Educations
    .Include(x => x.Department)
    .Where(x => x.UserId == userId)
    .Select(x => new
    {
        x.Id,
        x.UserId,
        x.DepartmentId,

        DepartmentName = x.Department != null
            ? x.Department.Name
            : x.CustomDepartmentName,

        x.CustomDepartmentName,

        x.SchoolName,
        x.DegreeLevel,
        x.StartYear,
        x.EndYear,
        x.GPA,
        x.Description
    })
    .ToListAsync();

            return Ok(data);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Education education)
        {
            if (!IsAdmin() && GetCurrentUserId() != education.UserId)
                return Forbid();

            _context.Educations.Add(education);

            await _context.SaveChangesAsync();

            return Ok(education);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Education education)
        {
            var existing = await _context.Educations.FindAsync(id);

            if (existing == null)
                return NotFound();

            if (!IsAdmin() && GetCurrentUserId() != existing.UserId)
                return Forbid();

            existing.SchoolName = education.SchoolName;
            existing.DepartmentId = education.DepartmentId;
            existing.CustomDepartmentName = education.CustomDepartmentName;
            existing.DegreeLevel = education.DegreeLevel;
            existing.StartYear = education.StartYear;
            existing.EndYear = education.EndYear;
            existing.GPA = education.GPA;
            existing.Description = education.Description;

            await _context.SaveChangesAsync();

            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _context.Educations.FindAsync(id);

            if (existing == null)
                return NotFound();

            if (!IsAdmin() && GetCurrentUserId() != existing.UserId)
                return Forbid();

            _context.Educations.Remove(existing);

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