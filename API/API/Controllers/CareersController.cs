using CareerCoachAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace CareerCoachAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CareersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CareersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCareers()
        {
            return Ok(await _context.Careers.ToListAsync());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCareer(int id)
        {
            var career = await _context.Careers.FindAsync(id);

            if (career == null)
                return NotFound();

            return Ok(career);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCareer(Career career)
        {
            _context.Careers.Add(career);
            await _context.SaveChangesAsync();

            return Ok(career);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCareer(int id, Career career)
        {
            var existingCareer = await _context.Careers.FindAsync(id);

            if (existingCareer == null)
                return NotFound();

            existingCareer.Title = career.Title;
            existingCareer.Description = career.Description;
            existingCareer.Industry = career.Industry;
            existingCareer.RequiredEducation = career.RequiredEducation;
            existingCareer.DemandLevel = career.DemandLevel;
            existingCareer.AverageSalary = career.AverageSalary;
            existingCareer.WorkType = career.WorkType;
            existingCareer.CareerCategory = career.CareerCategory;

            await _context.SaveChangesAsync();

            return Ok(existingCareer);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCareer(int id)
        {
            var career = await _context.Careers.FindAsync(id);

            if (career == null)
                return NotFound();

            _context.Careers.Remove(career);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}