using CareerCoachAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Reflection;
using CareerCoachAPI.Services;

namespace CareerCoachAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SkillAnalyzerController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly MlPredictionService _mlService;

        public SkillAnalyzerController(AppDbContext context, MlPredictionService mlService)
        {
            _context = context;
            _mlService = mlService;
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeSkills(SkillAnalysisRequest request)
        {
            if (!IsAdmin() && GetCurrentUserId() != request.UserId)
                return Forbid();

            var user = await _context.Users.FindAsync(request.UserId);

            var experiences = await _context.Experiences
                .Where(x => x.UserId == request.UserId)
                .ToListAsync();

            var projects = await _context.Projects
                .Where(x => x.UserId == request.UserId)
                .ToListAsync();

            var allSkills = await _context.Skills.ToListAsync();
            var detectedSkillIds = new HashSet<int>();

            string projectAndExperienceText =
                (
                    string.Join(" ", projects.Select(p =>
                        $"{p.Title} {p.ProjectType} {p.Technologies} {p.Description}"
                    ))
                    + " " +
                    string.Join(" ", experiences.Select(e =>
                        $"{e.Position} {e.Technologies} {e.Description}"
                    ))
                ).ToLower();

            foreach (var dbSkill in allSkills)
            {
                if (string.IsNullOrWhiteSpace(dbSkill.Name))
                    continue;

                string skillName = dbSkill.Name.ToLower();

                if (projectAndExperienceText.Contains(skillName))
                    detectedSkillIds.Add(dbSkill.Id);
            }

            foreach (var selectedId in request.SelectedSkillIds ?? new List<int>())
            {
                detectedSkillIds.Add(selectedId);
            }

            var selectedSkills = allSkills
                .Where(s => detectedSkillIds.Contains(s.Id))
                .ToList();

            string experienceText = string.Join(" ", experiences.Select(e =>
                $"{e.Position} {e.CompanyName} {e.Technologies} {e.Description} {e.DurationInMonths} months"
            ));

            string projectText = string.Join(" ", projects.Select(p =>
                $"{p.Title} {p.ProjectType} {p.Technologies} {p.Description} {p.GithubUrl} {p.LiveDemoUrl}"
            ));

            var results = new List<SkillAnalysisResult>();

            foreach (var skill in selectedSkills)
            {
                string skillName = skill.Name.ToLower();
                bool isPersonalSkill = IsPersonalSkill(skill);

                if (isPersonalSkill)
                {
                    var existingPersonalProgress = await _context.UserPersonalSkillProgresses
                        .FirstOrDefaultAsync(x =>
                            x.UserId == request.UserId &&
                            x.SkillId == skill.Id);

                    if (existingPersonalProgress == null)
                    {
                        _context.UserPersonalSkillProgresses.Add(new UserPersonalSkillProgress
                        {
                            UserId = request.UserId,
                            SkillId = skill.Id,
                            HasThisSkill = false,
                            Task1Completed = false,
                            Task2Completed = false,
                            Task3Completed = false,
                            ProgressPercentage = 0
                        });
                    }

                    var existingPersonalUserSkill = await _context.UserSkills
                        .FirstOrDefaultAsync(us =>
                            us.UserId == request.UserId &&
                            us.SkillId == skill.Id);

                    int currentLevel = existingPersonalUserSkill?.Level ?? 0;

                    results.Add(new SkillAnalysisResult
                    {
                        SkillId = skill.Id,
                        SkillName = skill.Name,
                        EstimatedLevel = currentLevel,
                        Reason = "Personal skill is selected for development. It will become 100% only when the user clicks 'I have this skill'."
                    });

                    continue;
                }

                int projectCountWithSkill = projects.Count(p =>
                    $"{p.Technologies} {p.Description} {p.Title} {p.ProjectType}"
                        .ToLower()
                        .Contains(skillName)
                );

                int totalExperienceMonthsWithSkill = experiences
                    .Where(e =>
                        $"{e.Technologies} {e.Description} {e.Position}"
                            .ToLower()
                            .Contains(skillName)
                    )
                    .Sum(e => e.DurationInMonths);

                int projectScore = GetProjectScore(projectCountWithSkill);
                int experienceScore = GetExperienceScore(totalExperienceMonthsWithSkill);

                int calculatedLevel = Math.Min(
    5,
    (int)Math.Round(
        (projectScore * 0.6) +
        (experienceScore * 0.7)
    )
);

                int roadmapLevel = await _context.UserLearningProgresses
                    .Where(x =>
                        x.UserId == request.UserId &&
                        x.SkillId == skill.Id &&
                        x.IsCompleted)
                    .MaxAsync(x => (int?)x.ToLevel) ?? 0;

                int finalCalculatedLevel = Math.Max(calculatedLevel, roadmapLevel);

                string reason = calculatedLevel > 0
                    ? $"Automatically detected from {projectCountWithSkill} related project(s) and {totalExperienceMonthsWithSkill} month(s) of related experience."
                    : "No project or experience evidence found for this skill yet.";

                var existingUserSkill = await _context.UserSkills
                    .FirstOrDefaultAsync(us =>
                        us.UserId == request.UserId &&
                        us.SkillId == skill.Id);

                if (existingUserSkill == null)
                {
                    _context.UserSkills.Add(new UserSkill
                    {
                        UserId = request.UserId,
                        SkillId = skill.Id,
                        Level = finalCalculatedLevel
                    });
                }
                else
                {
                    existingUserSkill.Level = finalCalculatedLevel;
                }

                results.Add(new SkillAnalysisResult
                {
                    SkillId = skill.Id,
                    SkillName = skill.Name,
                    EstimatedLevel = finalCalculatedLevel,
                    Reason = reason
                });
            }

            if (user != null)
            {
                user.CvSummary = request.CvSummary;
                user.ExperienceText = experienceText;
                user.ProjectText = projectText;
                user.IsProfileCompleted = true;
            }

            await _context.SaveChangesAsync();

            return Ok(results);
        }

        [HttpPost("predict/{userId}")]
        public async Task<IActionResult> PredictCareersRuleBased(int userId)
        {
            if (!IsAdmin() && GetCurrentUserId() != userId)
                return Forbid();

            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            var userSkills = await _context.UserSkills
                .Include(us => us.Skill)
                .Where(us => us.UserId == userId)
                .ToListAsync();

            if (!userSkills.Any())
                return BadRequest("No user skills found. Please analyze skills first.");

            var careers = await _context.Careers
                .Include(c => c.CareerSkills)
                    .ThenInclude(cs => cs.Skill)
                .ToListAsync();

            var predictions = new List<CareerPredictionResult>();

            foreach (var career in careers)
            {
                if (career.CareerSkills == null || !career.CareerSkills.Any())
                    continue;

                double totalWeightedScore = 0;
                double totalImportance = 0;

                var strongSkills = new List<string>();
                var weakSkills = new List<string>();
                var missingSkills = new List<string>();
                var roadmap = new List<LearningRoadmapItem>();

                foreach (var required in career.CareerSkills)
                {
                    if (required.Skill == null)
                        continue;

                    var userSkill = userSkills.FirstOrDefault(us =>
                        us.SkillId == required.SkillId);

                    int currentLevel = userSkill?.Level ?? 0;
                    int targetLevel = required.RequiredLevel <= 0 ? 1 : required.RequiredLevel;
                    int importance = required.ImportanceScore <= 0 ? 1 : required.ImportanceScore;

                    bool isPersonal = IsPersonalSkill(required.Skill);

                    double skillScore;

                    if (isPersonal)
                    {
                        int personalPercent = ConvertPersonalLevelToPercent(currentLevel);
                        skillScore = personalPercent;
                    }
                    else
                    {
                        skillScore = Math.Min((double)currentLevel / targetLevel, 1.0) * 100;
                    }

                    totalWeightedScore += skillScore * importance;
                    totalImportance += importance;

                    bool isMatched = isPersonal
                        ? currentLevel >= 3
                        : currentLevel >= targetLevel;

                    if (isMatched)
                    {
                        strongSkills.Add(required.Skill.Name);
                    }
                    else if (currentLevel > 0)
                    {
                        weakSkills.Add(required.Skill.Name);

                        roadmap.Add(new LearningRoadmapItem
                        {
                            Skill = required.Skill.Name,
                            CurrentLevel = isPersonal ? ConvertPersonalLevelToPercent(currentLevel) : currentLevel,
                            TargetLevel = isPersonal ? 100 : targetLevel,
                            Gap = isPersonal ? 100 - ConvertPersonalLevelToPercent(currentLevel) : targetLevel - currentLevel,
                            Priority = GetPriority(importance)
                        });
                    }
                    else
                    {
                        missingSkills.Add(required.Skill.Name);

                        roadmap.Add(new LearningRoadmapItem
                        {
                            Skill = required.Skill.Name,
                            CurrentLevel = 0,
                            TargetLevel = isPersonal ? 100 : targetLevel,
                            Gap = isPersonal ? 100 : targetLevel,
                            Priority = GetPriority(importance)
                        });
                    }
                }

                if (totalImportance == 0)
                    continue;

                double matchPercentage = Math.Round(totalWeightedScore / totalImportance, 2);

                predictions.Add(new CareerPredictionResult
                {
                    CareerId = career.Id,
                    Career = career.Title,
                    Description = career.Description,
                    Industry = career.Industry,
                    MatchPercentage = matchPercentage,
                    MatchLabel = GetMatchLabel(matchPercentage),
                    StrongSkills = strongSkills,
                    WeakSkills = weakSkills,
                    MissingSkills = missingSkills,
                    LearningRoadmap = roadmap
                        .OrderByDescending(x => x.Gap)
                        .ThenByDescending(x => x.Priority == "High")
                        .Take(10)
                        .ToList()
                });
            }

            var orderedPredictions = predictions
                .OrderByDescending(x => x.MatchPercentage)
                .Take(10)
                .ToList();

            if (!orderedPredictions.Any())
                return NotFound("No career skill requirements found.");

            var bestCareer = orderedPredictions.First();

            return Ok(new
            {
                source = "Rule-Based Career Matching",
                predictedCareer = bestCareer.Career,
                predictedMatchPercentage = bestCareer.MatchPercentage,
                predictedMatchLabel = bestCareer.MatchLabel,
                predictedRoadmap = bestCareer.LearningRoadmap,
                topPredictions = orderedPredictions
            });
        }

        [HttpPost("ml-predict/{userId}")]
        public async Task<IActionResult> PredictWithML(int userId)
        {
            return await PredictCareersMl(userId, "ML.NET SDCA Regression Matcher");
        }

        [HttpPost("similarity-predict/{userId}")]
        public async Task<IActionResult> PredictWithSimilarityModel(int userId)
        {
            return await PredictCareersMl(userId, "ML.NET Similarity Matcher");
        }

        private async Task<IActionResult> PredictCareersMl(int userId, string sourceLabel)
        {
            if (!IsAdmin() && GetCurrentUserId() != userId)
                return Forbid();

            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            var userSkills = await _context.UserSkills
                .Include(us => us.Skill)
                .Where(us => us.UserId == userId)
                .ToListAsync();

            if (!userSkills.Any())
                return BadRequest("No user skills found. Please analyze skills first.");

            var personalProgresses = await _context.UserPersonalSkillProgresses
                .Include(x => x.Skill)
                .Where(x => x.UserId == userId)
                .ToListAsync();

            var userEducations = await _context.Educations
                .Include(e => e.Department)
                .Where(e => e.UserId == userId)
                .ToListAsync();

            var careers = await _context.Careers
                .Include(c => c.CareerSkills)
                    .ThenInclude(cs => cs.Skill)
                .ToListAsync();

            var mlMatches = await _mlService.PredictMatchesAsync(_context, userSkills, personalProgresses, userEducations);

            var predictions = new List<CareerPredictionResult>();

            foreach (var career in careers)
            {
                if (career.CareerSkills == null || !career.CareerSkills.Any())
                    continue;

                var mlMatch = mlMatches.FirstOrDefault(m => m.CareerId == career.Id);
                double matchPercentage = mlMatch?.MatchPercentage ?? 0;

                var strongSkills = new List<string>();
                var weakSkills = new List<string>();
                var missingSkills = new List<string>();
                var roadmap = new List<LearningRoadmapItem>();

                foreach (var required in career.CareerSkills)
                {
                    if (required.Skill == null)
                        continue;

                    var userSkill = userSkills.FirstOrDefault(us =>
                        us.SkillId == required.SkillId);

                    int currentLevel = userSkill?.Level ?? 0;
                    int targetLevel = required.RequiredLevel <= 0 ? 1 : required.RequiredLevel;
                    int importance = required.ImportanceScore <= 0 ? 1 : required.ImportanceScore;

                    bool isPersonal = IsPersonalSkill(required.Skill);

                    bool isMatched = isPersonal
                        ? currentLevel >= 3
                        : currentLevel >= targetLevel;

                    if (isMatched)
                    {
                        strongSkills.Add(required.Skill.Name);
                    }
                    else if (currentLevel > 0)
                    {
                        weakSkills.Add(required.Skill.Name);

                        roadmap.Add(new LearningRoadmapItem
                        {
                            Skill = required.Skill.Name,
                            CurrentLevel = isPersonal ? ConvertPersonalLevelToPercent(currentLevel) : currentLevel,
                            TargetLevel = isPersonal ? 100 : targetLevel,
                            Gap = isPersonal ? 100 - ConvertPersonalLevelToPercent(currentLevel) : targetLevel - currentLevel,
                            Priority = GetPriority(importance)
                        });
                    }
                    else
                    {
                        missingSkills.Add(required.Skill.Name);

                        roadmap.Add(new LearningRoadmapItem
                        {
                            Skill = required.Skill.Name,
                            CurrentLevel = 0,
                            TargetLevel = isPersonal ? 100 : targetLevel,
                            Gap = isPersonal ? 100 : targetLevel,
                            Priority = GetPriority(importance)
                        });
                    }
                }

                predictions.Add(new CareerPredictionResult
                {
                    CareerId = career.Id,
                    Career = career.Title,
                    Description = career.Description,
                    Industry = career.Industry,
                    MatchPercentage = matchPercentage,
                    MatchLabel = GetMatchLabel(matchPercentage),
                    StrongSkills = strongSkills,
                    WeakSkills = weakSkills,
                    MissingSkills = missingSkills,
                    LearningRoadmap = roadmap
                        .OrderByDescending(x => x.Gap)
                        .ThenByDescending(x => x.Priority == "High")
                        .Take(10)
                        .ToList()
                });
            }

            var orderedPredictions = predictions
                .OrderByDescending(x => x.MatchPercentage)
                .Take(10)
                .ToList();

            if (!orderedPredictions.Any())
                return NotFound("No career skill requirements found.");

            var bestCareer = orderedPredictions.First();

            return Ok(new
            {
                source = sourceLabel,
                predictedCareer = bestCareer.Career,
                predictedMatchPercentage = bestCareer.MatchPercentage,
                predictedMatchLabel = bestCareer.MatchLabel,
                predictedRoadmap = bestCareer.LearningRoadmap,
                topPredictions = orderedPredictions
            });
        }

        private int GetProjectScore(int projectCount)
        {
            if (projectCount <= 0)
                return 0;

            if (projectCount == 1)
                return 1;

            if (projectCount == 2)
                return 2;

            if (projectCount == 3)
                return 3;

            return 4;
        }

        private int GetExperienceScore(int months)
        {
            if (months <= 0)
                return 0;

            if (months <= 3)
                return 1;

            if (months <= 9)
                return 2;

            if (months <= 18)
                return 3;

            if (months <= 36)
                return 4;

            return 5;
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

        private static string GetPriority(int importance)
        {
            if (importance >= 4)
                return "High";

            if (importance == 3)
                return "Medium";

            return "Low";
        }

        private static string GetMatchLabel(double score)
        {
            if (score >= 90)
                return "Excellent Match";

            if (score >= 75)
                return "Strong Match";

            if (score >= 60)
                return "Good Match";

            if (score >= 40)
                return "Moderate Match";

            return "Low Match";
        }

        private bool IsPersonalSkill(Skill skill)
        {
            return
                skill.SkillType != null &&
                skill.SkillType.Equals("Personal", StringComparison.OrdinalIgnoreCase)
                ||
                skill.Category != null &&
                skill.Category.Equals("Personal", StringComparison.OrdinalIgnoreCase);
        }

        private string GetUserDepartment(object user)
        {
            var possibleNames = new[]
            {
                "Department",
                "UniversityDepartment",
                "EducationDepartment",
                "Major"
            };

            foreach (var name in possibleNames)
            {
                PropertyInfo? property = user.GetType().GetProperty(name);

                if (property == null)
                    continue;

                object? value = property.GetValue(user);

                if (value != null && !string.IsNullOrWhiteSpace(value.ToString()))
                    return value.ToString()!;
            }

            return "Computer Engineering";
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

        private class CareerPredictionResult
        {
            public int CareerId { get; set; }

            public string Career { get; set; } = string.Empty;

            public string Description { get; set; } = string.Empty;

            public string Industry { get; set; } = string.Empty;

            public double MatchPercentage { get; set; }

            public string MatchLabel { get; set; } = string.Empty;

            public List<string> StrongSkills { get; set; } = new();

            public List<string> WeakSkills { get; set; } = new();

            public List<string> MissingSkills { get; set; } = new();

            public List<LearningRoadmapItem> LearningRoadmap { get; set; } = new();
        }

        private class LearningRoadmapItem
        {
            public string Skill { get; set; } = string.Empty;

            public double CurrentLevel { get; set; }

            public double TargetLevel { get; set; }

            public double Gap { get; set; }

            public string Priority { get; set; } = string.Empty;
        }
    }
}