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
    public class LearningProgressController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LearningProgressController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllProgress()
        {
            var progress = await _context.UserLearningProgresses
                .Select(x => new
                {
                    x.Id,
                    x.UserId,
                    UserName = x.User != null ? (x.User.FirstName + " " + x.User.LastName) : "",
                    UserEmail = x.User != null ? x.User.Email : "",

                    x.SkillId,
                    SkillName = x.Skill != null ? x.Skill.Name : "",
                    SkillType = x.Skill != null ? x.Skill.SkillType : "",
                    SkillCategory = x.Skill != null ? x.Skill.Category : "",

                    x.TaskTitle,
                    x.TaskType,
                    x.ReflectionText,

                    x.SelectedPlatforms,

                    x.IsPracticeTaskCompleted,
                    x.PracticeTaskDescription,

                    x.IsCaseStudyCompleted,
                    x.CaseStudyDescription,

                    x.IsProjectCompleted,
                    x.ProjectDescription,

                    x.FromLevel,
                    x.ToLevel,
                    x.IsCompleted,
                    x.CompletedAt
                })
                .OrderByDescending(x => x.CompletedAt)
                .ToListAsync();

            return Ok(progress);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserProgress(int userId)
        {
            if (!IsAdmin() && GetCurrentUserId() != userId)
                return Forbid();

            var progress = await _context.UserLearningProgresses
                .Where(x => x.UserId == userId)
                .Select(x => new
                {
                    x.Id,
                    x.UserId,
                    x.SkillId,

                    SkillName = x.Skill != null ? x.Skill.Name : "",
                    SkillType = x.Skill != null ? x.Skill.SkillType : "",
                    SkillCategory = x.Skill != null ? x.Skill.Category : "",

                    x.TaskTitle,
                    x.TaskType,
                    x.ReflectionText,

                    x.SelectedPlatforms,

                    x.IsPracticeTaskCompleted,
                    x.PracticeTaskDescription,

                    x.IsCaseStudyCompleted,
                    x.CaseStudyDescription,

                    x.IsProjectCompleted,
                    x.ProjectDescription,

                    x.FromLevel,
                    x.ToLevel,

                    x.IsCompleted,
                    x.CompletedAt
                })
                .OrderByDescending(x => x.CompletedAt)
                .ToListAsync();

            return Ok(progress);
        }

        [HttpPost("complete")]
        public async Task<IActionResult> CompleteTask(UserLearningProgress progress)
        {
            if (!IsAdmin() && GetCurrentUserId() != progress.UserId)
                return Forbid();

            if (progress.UserId <= 0 || progress.SkillId <= 0)
            {
                return BadRequest(
                    $"Invalid data. UserId: {progress.UserId}, SkillId: {progress.SkillId}"
                );
            }

            var skill = await _context.Skills
                .FirstOrDefaultAsync(x => x.Id == progress.SkillId);

            if (skill == null)
            {
                return BadRequest("Skill not found.");
            }

            bool isPersonalSkill =
                (
                    !string.IsNullOrWhiteSpace(skill.SkillType) &&
                    skill.SkillType.Equals("Personal", StringComparison.OrdinalIgnoreCase)
                )
                ||
                (
                    !string.IsNullOrWhiteSpace(skill.Category) &&
                    skill.Category.Equals("Personal", StringComparison.OrdinalIgnoreCase)
                );

            bool hasLearningResource =
                !string.IsNullOrWhiteSpace(progress.SelectedPlatforms) &&
                progress.SelectedPlatforms.Trim() != "[]";

            if (!isPersonalSkill)
            {
                if (!hasLearningResource)
                    return BadRequest("Please select at least one learning resource.");

                if (!progress.IsPracticeTaskCompleted)
                    return BadRequest("Please mark the practice task as completed.");

                if (!progress.IsCaseStudyCompleted)
                    return BadRequest("Please mark the case study as completed.");
            }

            if (isPersonalSkill)
            {
                if (!progress.IsPracticeTaskCompleted)
                    return BadRequest("Please complete Development Activities.");

                if (!progress.IsCaseStudyCompleted)
                    return BadRequest("Please complete Reflection Task.");

                if (!progress.IsProjectCompleted)
                    return BadRequest("Please complete Personal Development Plan.");
            }

            var userSkill = await _context.UserSkills
                .FirstOrDefaultAsync(x =>
                    x.UserId == progress.UserId &&
                    x.SkillId == progress.SkillId
                );

            if (userSkill == null)
            {
                userSkill = new UserSkill
                {
                    UserId = progress.UserId,
                    SkillId = progress.SkillId,
                    Level = 0
                };

                _context.UserSkills.Add(userSkill);
            }

            int currentLevel = userSkill.Level;
            int nextLevel = currentLevel;

            if (!isPersonalSkill)
            {
                bool isProjectRequired = currentLevel >= 2;

                if (isProjectRequired && !progress.IsProjectCompleted)
                {
                    return BadRequest(
                        "Please complete the project suggestion section for this level."
                    );
                }

                if (currentLevel >= 5)
                {
                    return BadRequest(
                        "Skill is already at maximum level."
                    );
                }

                nextLevel = Math.Min(currentLevel + 1, 5);
                userSkill.Level = nextLevel;
            }

            if (isPersonalSkill)
            {
                nextLevel = 3;
                userSkill.Level = 3;
            }

            var completedProgress = new UserLearningProgress
            {
                UserId = progress.UserId,
                SkillId = progress.SkillId,

                TaskTitle = progress.TaskTitle,
                TaskType = progress.TaskType,

                ReflectionText = progress.ReflectionText,

                SelectedPlatforms = progress.SelectedPlatforms ?? string.Empty,

                IsPracticeTaskCompleted = progress.IsPracticeTaskCompleted,
                PracticeTaskDescription = progress.PracticeTaskDescription,

                IsCaseStudyCompleted = progress.IsCaseStudyCompleted,
                CaseStudyDescription = progress.CaseStudyDescription,

                IsProjectCompleted = progress.IsProjectCompleted,
                ProjectDescription = progress.ProjectDescription,

                FromLevel = currentLevel,
                ToLevel = nextLevel,

                IsCompleted = true,
                CompletedAt = DateTime.UtcNow
            };

            _context.UserLearningProgresses.Add(completedProgress);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = isPersonalSkill
                    ? "Personal development activity completed and progress updated."
                    : "Task completed and skill level updated.",

                skillId = progress.SkillId,
                skillType = skill.SkillType,
                skillCategory = skill.Category,

                selectedPlatforms = completedProgress.SelectedPlatforms,

                fromLevel = currentLevel,
                toLevel = nextLevel,

                newLevel = userSkill.Level,

                progressPercentage = isPersonalSkill
                    ? ConvertPersonalLevelToPercent(userSkill.Level)
                    : userSkill.Level * 20
            });
        }

        private int ConvertPersonalLevelToPercent(int level)
        {
            return level switch
            {
                <= 0 => 0,
                1 => 33,
                2 => 66,
                >= 3 => 100
            };
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