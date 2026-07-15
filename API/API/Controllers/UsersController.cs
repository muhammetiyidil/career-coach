using CareerCoachAPI.Models;
using CareerCoachAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace CareerCoachAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly CvParserService _cvParser;

        public UsersController(AppDbContext context, CvParserService cvParser)
        {
            _context = context;
            _cvParser = cvParser;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .Select(user => new
                {
                    user.Id,
                    user.FirstName,
                    user.LastName,
                    user.Email,
                    user.Role,
                    user.Phone,
                    user.Country,
                    user.City,
                    user.ProfilePhotoUrl,
                    user.DateOfBirth,
                    user.EducationLevel,
                    user.CvSummary,
                    user.ExperienceText,
                    user.ProjectText,
                    user.IsProfileCompleted,
                    user.CreatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            if (!IsAdmin() && GetCurrentUserId() != id)
                return Forbid();

            var user = await _context.Users
                .Where(x => x.Id == id)
                .Select(user => new
                {
                    user.Id,
                    user.FirstName,
                    user.LastName,
                    user.Email,
                    user.Role,
                    user.Phone,
                    user.Country,
                    user.City,
                    user.ProfilePhotoUrl,
                    user.DateOfBirth,
                    user.EducationLevel,
                    user.CvSummary,
                    user.ExperienceText,
                    user.ProjectText,
                    user.IsProfileCompleted,
                    user.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (user == null)
                return NotFound();

            return Ok(user);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateUser(User user)
        {
            if (string.IsNullOrWhiteSpace(user.FirstName))
                return BadRequest("First name is required.");

            if (string.IsNullOrWhiteSpace(user.LastName))
                return BadRequest("Last name is required.");

            if (string.IsNullOrWhiteSpace(user.Email))
                return BadRequest("Email is required.");

            if (string.IsNullOrWhiteSpace(user.Country))
                return BadRequest("Country is required.");

            if (string.IsNullOrWhiteSpace(user.City))
                return BadRequest("City is required.");

            var emailExists = await _context.Users
                .AnyAsync(x => x.Email == user.Email);

            if (emailExists)
                return BadRequest("This email is already registered.");

            user.CreatedAt = DateTime.UtcNow;
            user.Role = string.IsNullOrWhiteSpace(user.Role) ? "User" : user.Role;

            if (!string.IsNullOrWhiteSpace(user.PasswordHash))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);
            }
            else
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456");
            }

            user.Phone ??= string.Empty;
            user.Country ??= string.Empty;
            user.City ??= string.Empty;
            user.ProfilePhotoUrl ??= string.Empty;
            user.EducationLevel ??= string.Empty;
            user.CvSummary ??= string.Empty;
            user.ExperienceText ??= string.Empty;
            user.ProjectText ??= string.Empty;

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(ToUserResponse(user));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, User user)
        {
            if (!IsAdmin() && GetCurrentUserId() != id)
                return Forbid();

            var existingUser = await _context.Users.FindAsync(id);

            if (existingUser == null)
                return NotFound();

            if (string.IsNullOrWhiteSpace(user.FirstName))
                return BadRequest("First name is required.");

            if (string.IsNullOrWhiteSpace(user.LastName))
                return BadRequest("Last name is required.");

            if (string.IsNullOrWhiteSpace(user.Email))
                return BadRequest("Email is required.");

            if (string.IsNullOrWhiteSpace(user.Country))
                return BadRequest("Country is required.");

            if (string.IsNullOrWhiteSpace(user.City))
                return BadRequest("City is required.");

            if (!user.Email.Equals(existingUser.Email, StringComparison.OrdinalIgnoreCase))
            {
                var emailExists = await _context.Users
                    .AnyAsync(x => x.Email == user.Email && x.Id != id);

                if (emailExists)
                    return BadRequest("This email is already registered.");

                existingUser.Email = user.Email;
            }

            existingUser.FirstName = user.FirstName;
            existingUser.LastName = user.LastName;

            if (IsAdmin())
            {
                existingUser.Role = string.IsNullOrWhiteSpace(user.Role)
                    ? existingUser.Role
                    : user.Role;
            }

            existingUser.Phone = user.Phone ?? string.Empty;
            existingUser.Country = user.Country;
            existingUser.City = user.City;
            existingUser.ProfilePhotoUrl = user.ProfilePhotoUrl ?? string.Empty;

            existingUser.DateOfBirth = user.DateOfBirth;
            existingUser.EducationLevel = user.EducationLevel ?? string.Empty;

            existingUser.CvSummary = user.CvSummary ?? string.Empty;
            existingUser.ExperienceText = user.ExperienceText ?? string.Empty;
            existingUser.ProjectText = user.ProjectText ?? string.Empty;

            var hasCvSummary = !string.IsNullOrWhiteSpace(existingUser.CvSummary);

            var hasEducation = await _context.Educations
                .AnyAsync(x => x.UserId == id);

            var hasExperience = await _context.Experiences
                .AnyAsync(x => x.UserId == id);

            var hasProject = await _context.Projects
                .AnyAsync(x => x.UserId == id);

            existingUser.IsProfileCompleted =
                hasCvSummary &&
                hasEducation &&
                (hasExperience || hasProject);

            await _context.SaveChangesAsync();

            return Ok(ToUserResponse(existingUser));
        }

        [HttpPut("{id}/change-password")]
        public async Task<IActionResult> ChangePassword(int id, ChangePasswordRequest request)
        {
            if (!IsAdmin() && GetCurrentUserId() != id)
                return Forbid();

            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound("User not found.");

            if (string.IsNullOrWhiteSpace(request.CurrentPassword))
                return BadRequest("Current password is required.");

            if (string.IsNullOrWhiteSpace(request.NewPassword))
                return BadRequest("New password is required.");

            if (string.IsNullOrWhiteSpace(request.ConfirmNewPassword))
                return BadRequest("Confirm new password is required.");

            if (request.NewPassword != request.ConfirmNewPassword)
                return BadRequest("New passwords do not match.");

            var isCurrentPasswordValid =
                BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash);

            if (!isCurrentPasswordValid)
                return BadRequest("Current password is incorrect.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            await _context.SaveChangesAsync();

            return Ok("Password changed successfully.");
        }

        [HttpPost("{id}/upload-profile-photo")]
        public async Task<IActionResult> UploadProfilePhoto(int id, IFormFile file)
        {
            if (!IsAdmin() && GetCurrentUserId() != id)
                return Forbid();

            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound("User not found.");

            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLower();

            if (!allowedExtensions.Contains(extension))
                return BadRequest("Only JPG, PNG and WEBP files are allowed.");

            var uploadsFolder = Path.Combine(
                Directory.GetCurrentDirectory(),
                "wwwroot",
                "uploads",
                "profile-photos"
            );

            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var fileName = $"user_{id}_{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            user.ProfilePhotoUrl = $"/uploads/profile-photos/{fileName}";

            await _context.SaveChangesAsync();

            return Ok(ToUserResponse(user));
        }

        [HttpDelete("{id}/remove-profile-photo")]
        public async Task<IActionResult> RemoveProfilePhoto(int id)
        {
            if (!IsAdmin() && GetCurrentUserId() != id)
                return Forbid();

            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound("User not found.");

            user.ProfilePhotoUrl = string.Empty;

            await _context.SaveChangesAsync();

            return Ok(ToUserResponse(user));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound();

            _context.Users.Remove(user);
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

        private object ToUserResponse(User user)
        {
            return new
            {
                user.Id,
                user.FirstName,
                user.LastName,
                user.Email,
                user.Role,
                user.Phone,
                user.Country,
                user.City,
                user.ProfilePhotoUrl,
                user.DateOfBirth,
                user.EducationLevel,
                user.CvSummary,
                user.ExperienceText,
                user.ProjectText,
                user.IsProfileCompleted,
                user.CreatedAt
            };
        }

        [HttpPost("{id}/upload-cv")]
        public async Task<IActionResult> UploadCv(int id, IFormFile file)
        {
            if (!IsAdmin() && GetCurrentUserId() != id)
                return Forbid();

            if (file == null || file.Length == 0)
                return BadRequest("No file was uploaded.");

            var allowedExtensions = new[] { ".pdf", ".docx", ".doc" };
            var extension = Path.GetExtension(file.FileName).ToLower();

            if (!allowedExtensions.Contains(extension))
                return BadRequest("Only PDF, DOCX, and DOC files are allowed.");

            try
            {
                var departments = await _context.Departments.ToListAsync();
                
                using (var stream = file.OpenReadStream())
                {
                    var result = _cvParser.ParseCv(stream, extension, departments);
                    return Ok(result);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while parsing the CV: {ex.Message}");
            }
        }
    }

}