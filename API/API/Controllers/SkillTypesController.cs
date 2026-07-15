using CareerCoachAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace CareerCoachAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SkillTypesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SkillTypesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetSkillTypes()
        {
            return Ok(await _context.SkillTypes.ToListAsync());
        }
    }
}