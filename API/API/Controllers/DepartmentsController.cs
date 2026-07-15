using CareerCoachAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CareerCoachAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DepartmentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DepartmentsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetDepartments()
        {
            var data = await _context.Departments
                .OrderBy(x => x.Name)
                .Select(x => new
                {
                    x.Id,
                    x.Name
                })
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDepartment(int id)
        {
            var department = await _context.Departments
                .Where(x => x.Id == id)
                .Select(x => new
                {
                    x.Id,
                    x.Name
                })
                .FirstOrDefaultAsync();

            if (department == null)
                return NotFound("Department not found.");

            return Ok(department);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(Department department)
        {
            if (department == null)
                return BadRequest("Department data is required.");

            department.Name = department.Name?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(department.Name))
                return BadRequest("Department name is required.");

            var exists = await _context.Departments
                .AnyAsync(x => x.Name.ToLower() == department.Name.ToLower());

            if (exists)
                return BadRequest("This department already exists.");

            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Department created successfully.",
                department = new
                {
                    department.Id,
                    department.Name
                }
            });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, Department department)
        {
            if (department == null)
                return BadRequest("Department data is required.");

            var existing = await _context.Departments.FindAsync(id);

            if (existing == null)
                return NotFound("Department not found.");

            var newName = department.Name?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(newName))
                return BadRequest("Department name is required.");

            var exists = await _context.Departments
                .AnyAsync(x =>
                    x.Id != id &&
                    x.Name.ToLower() == newName.ToLower()
                );

            if (exists)
                return BadRequest("This department already exists.");

            existing.Name = newName;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Department updated successfully.",
                department = new
                {
                    existing.Id,
                    existing.Name
                }
            });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _context.Departments.FindAsync(id);

            if (existing == null)
                return NotFound("Department not found.");

            var used = await _context.Educations
                .AnyAsync(x => x.DepartmentId == id);

            if (used)
                return BadRequest("This department is used by education records and cannot be deleted.");

            _context.Departments.Remove(existing);
            await _context.SaveChangesAsync();

            return Ok("Department deleted successfully.");
        }
    }
}