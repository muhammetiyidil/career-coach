using CareerCoachAPI.Models;
using CareerCoachAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CareerCoachAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly EmailService _emailService;

        public AuthController(
            AppDbContext context,
            IConfiguration configuration,
            EmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.FirstName))
                return BadRequest("First name is required.");

            if (string.IsNullOrWhiteSpace(request.LastName))
                return BadRequest("Last name is required.");

            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest("Email is required.");

            if (string.IsNullOrWhiteSpace(request.Password))
                return BadRequest("Password is required.");

            if (string.IsNullOrWhiteSpace(request.ConfirmPassword))
                return BadRequest("Confirm password is required.");

            if (request.Password != request.ConfirmPassword)
                return BadRequest("Passwords do not match.");

            var emailExists = await _context.Users
                .AnyAsync(x => x.Email == request.Email);

            if (emailExists)
                return BadRequest("This email is already registered.");

            var user = new User
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Country = request.Country,
                City = request.City,
                Role = "User",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = CreateToken(user);

            return Ok(new
            {
                message = "Registration successful.",
                token,
                user = new
                {
                    user.Id,
                    user.FirstName,
                    user.LastName,
                    user.Email,
                    user.Role,
                    user.Country,
                    user.City,
                    user.ProfilePhotoUrl,
                    user.IsProfileCompleted,
                    user.CreatedAt
                }
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest("Email is required.");

            if (string.IsNullOrWhiteSpace(request.Password))
                return BadRequest("Password is required.");

            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Email == request.Email);

            if (user == null)
                return Unauthorized("Invalid email or password.");

            var isPasswordValid = BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash
            );

            if (!isPasswordValid)
                return Unauthorized("Invalid email or password.");

            var token = CreateToken(user);

            return Ok(new
            {
                message = "Login successful.",
                token,
                user = new
                {
                    user.Id,
                    user.FirstName,
                    user.LastName,
                    user.Email,
                    user.Role,
                    user.Country,
                    user.City,
                    user.ProfilePhotoUrl,
                    user.IsProfileCompleted,
                    user.CreatedAt
                }
            });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest("Email is required.");

            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Email == request.Email);

            if (user == null)
            {
                return Ok(new
                {
                    message = "If this email exists, a password reset link has been sent."
                });
            }

            var token = Guid.NewGuid().ToString();

            user.PasswordResetToken = token;
            user.PasswordResetTokenExpires = DateTime.UtcNow.AddHours(1);

            await _context.SaveChangesAsync();

            var resetLink = $"http://localhost:5173/reset-password?token={token}";

            var emailBody = $@"
    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;'>
        <h2 style='color: #2563eb; margin-bottom: 16px;'>CareerCoach Password Reset</h2>

        <p>Hello {user.FirstName},</p>

        <p>
            We received a request to reset the password for your CareerCoach account.
            You can create a new password by clicking the button below.
        </p>

        <p style='text-align: center; margin: 28px 0;'>
            <a href='{resetLink}'
               style='background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;'>
                Reset My Password
            </a>
        </p>

        <p>
            This link is valid for 1 hour. If you did not request a password reset,
            you can safely ignore this email.
        </p>

        <hr style='margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;' />

        <p style='font-size: 13px; color: #6b7280;'>
            CareerCoach helps you analyze your skills, discover suitable career paths,
            and follow your personalized learning roadmap.
        </p>
    </div>
";

            await _emailService.SendEmailAsync(
    user.Email,
    "Reset Your CareerCoach Password",
    emailBody
);

            return Ok(new
            {
                message = "If this email exists, a password reset link has been sent."
            });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Token))
                return BadRequest("Token is required.");

            if (string.IsNullOrWhiteSpace(request.NewPassword))
                return BadRequest("New password is required.");

            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.PasswordResetToken == request.Token);

            if (user == null)
                return BadRequest("Invalid token.");

            if (user.PasswordResetTokenExpires == null ||
                user.PasswordResetTokenExpires < DateTime.UtcNow)
            {
                return BadRequest("Token expired.");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            user.PasswordResetToken = null;
            user.PasswordResetTokenExpires = null;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Password updated successfully."
            });
        }

        // TEMPORARY: Admin password hash generator
        // İşin bitince bu endpoint'i sil.
        [HttpGet("generate-hash")]
        public IActionResult GenerateHash()
        {
            var hash = BCrypt.Net.BCrypt.HashPassword("Admin123!");
            return Ok(hash);
        }

        private string CreateToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)
            );

            var credentials = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256
            );

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}