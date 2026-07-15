using CareerCoachAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using CareerCoachAPI.Services;

namespace CareerCoachAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CareerMatchController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly MlPredictionService _mlService;

        public CareerMatchController(AppDbContext context, MlPredictionService mlService)
        {
            _context = context;
            _mlService = mlService;
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetCareerMatches(int userId)
        {
            if (!IsAdmin() && GetCurrentUserId() != userId)
                return Forbid();

            var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == userId);

            string userLocation = user == null
                ? ""
                : $"{user.Country}, {user.City}".Trim().Trim(',');

            var userSkills = await _context.UserSkills
                .Include(us => us.Skill)
                .Where(us => us.UserId == userId)
                .ToListAsync();

            var personalProgresses = await _context.UserPersonalSkillProgresses
                .Include(x => x.Skill)
                .Where(x => x.UserId == userId)
                .ToListAsync();

            var userEducations = await _context.Educations
                .Include(e => e.Department)
                .Where(e => e.UserId == userId)
                .ToListAsync();

            var careers = await _context.Careers.ToListAsync();

            var careerSkills = await _context.CareerSkills
                .Include(cs => cs.Skill)
                .ToListAsync();

            var skillCategories = await _context.SkillCategories
                .Where(x => x.SkillType == "Technical")
                .ToListAsync();

            var learningPlatforms = await _context.LearningPlatforms
                .Where(x => x.IsActive)
                .ToListAsync();

            var jobPlatforms = await _context.JobPlatforms
                .Where(x => x.IsActive)
                .ToListAsync();

            var results = new List<CareerMatchResult>();

            var mlMatches = await _mlService.PredictMatchesAsync(_context, userSkills, personalProgresses, userEducations);

            foreach (var career in careers)
            {
                var requiredSkills = careerSkills
                    .Where(cs => cs.CareerId == career.Id)
                    .ToList();

                bool hasRequirements = requiredSkills.Count > 0;

                double weightedScore = 0;
                double totalWeight = 0;

                var missingSkills = new List<MissingSkillRecommendation>();
                var matchedSkills = new List<MatchedSkillDto>();

                foreach (var required in requiredSkills)
                {
                    if (required.Skill == null)
                        continue;

                    var skill = required.Skill;

                    var userSkill = userSkills.FirstOrDefault(us => us.SkillId == required.SkillId);

                    var personalProgressRecord = personalProgresses
                        .FirstOrDefault(x => x.SkillId == required.SkillId);

                    int userLevel = userSkill?.Level ?? 0;
                    int requiredLevel = required.RequiredLevel <= 0 ? 1 : required.RequiredLevel;
                    int importance = required.ImportanceScore <= 0 ? 3 : required.ImportanceScore;

                    string skillType = skill.SkillType ?? "";
                    string skillCategory = skill.Category ?? "";

                    bool isPersonalSkill =
                        skillType.Equals("Personal", StringComparison.OrdinalIgnoreCase) ||
                        skillCategory.Equals("Personal", StringComparison.OrdinalIgnoreCase);

                    int personalProgressPercentage = 0;

                    if (isPersonalSkill)
                    {
                        if (personalProgressRecord != null)
                        {
                            personalProgressPercentage = personalProgressRecord.ProgressPercentage;

                            userLevel = personalProgressPercentage switch
                            {
                                >= 100 => 3,
                                >= 66 => 2,
                                >= 33 => 1,
                                _ => 0
                            };
                        }
                        else
                        {
                            personalProgressPercentage = ConvertPersonalLevelToPercent(userLevel);
                        }
                    }

                    double skillScore = isPersonalSkill
                        ? personalProgressPercentage / 100.0
                        : Math.Min(userLevel, requiredLevel) / (double)requiredLevel;

                    weightedScore += skillScore * importance;
                    totalWeight += importance;

                    bool isMatched = isPersonalSkill
                        ? personalProgressPercentage >= 100
                        : userLevel >= requiredLevel;

                    bool hasSkillAtAll = isPersonalSkill
                        ? personalProgressPercentage > 0
                        : userLevel > 0;

                    if (hasSkillAtAll)
                    {
                        matchedSkills.Add(new MatchedSkillDto
                        {
                            SkillId = skill.Id,
                            SkillName = skill.Name,
                            SkillType = skillType,
                            SkillCategory = skillCategory,
                            UserLevel = isPersonalSkill ? personalProgressPercentage : userLevel,
                            RequiredLevel = isPersonalSkill ? 100 : requiredLevel
                        });
                    }

                    if (isMatched)
                    {
                        continue;
                    }

                    int nextLevel = isPersonalSkill
                        ? Math.Min(userLevel + 1, 3)
                        : Math.Min(userLevel + 1, requiredLevel);

                    string recommendationLevel = isPersonalSkill
                        ? "personal-development"
                        : GetRecommendationLevel(nextLevel);

                    var categoryTemplate = skillCategories.FirstOrDefault(x =>
                        x.Name.Equals(skillCategory, StringComparison.OrdinalIgnoreCase));

                    string practiceTask;
                    string caseStudy;
                    string projectSuggestion;
                    string projectDescription;
                    List<string> developmentActivities = new();

                    if (isPersonalSkill)
                    {
                        string developmentActivity = BuildText(
                            skill.PersonalDevelopmentActivityTemplate,
                            "No development activity defined yet."
                        );

                        string reflection = BuildText(
                            skill.PersonalReflectionTemplate,
                            "No reflection task defined yet."
                        );

                        string feedback = BuildText(
                            skill.PersonalFeedbackTemplate,
                            "No feedback activity defined yet."
                        );

                        string realLifeExercise = BuildText(
                            skill.PersonalRealLifeExerciseTemplate,
                            "No real-life exercise defined yet."
                        );

                        developmentActivities = new List<string>
                        {
                            developmentActivity,
                            reflection,
                            feedback,
                            realLifeExercise
                        }
                        .Where(x => !string.IsNullOrWhiteSpace(x))
                        .ToList();

                        practiceTask = developmentActivity;
                        caseStudy = reflection;
                        projectSuggestion = realLifeExercise;
                        projectDescription = feedback;
                    }
                    else
                    {
                        practiceTask = BuildSkillBasedText(
                            GetPracticeTaskByLevel(categoryTemplate, userLevel),
                            skill.Name,
                            "No practice task defined yet."
                        );

                        caseStudy = BuildSkillBasedText(
                            GetCaseStudyByLevel(categoryTemplate, userLevel),
                            skill.Name,
                            "No case study defined yet."
                        );

                        projectSuggestion = BuildSkillBasedText(
                            GetProjectSuggestionByLevel(categoryTemplate, userLevel),
                            skill.Name,
                            "No project suggestion defined yet."
                        );

                        projectDescription = BuildSkillBasedText(
                            GetProjectDescriptionByLevel(categoryTemplate, userLevel),
                            skill.Name,
                            "No project description defined yet."
                        );
                    }

                    missingSkills.Add(new MissingSkillRecommendation
                    {
                        SkillId = skill.Id,
                        SkillName = skill.Name,
                        SkillType = skillType,
                        SkillCategory = skillCategory,
                        UserLevel = isPersonalSkill ? personalProgressPercentage : userLevel,
                        RequiredLevel = isPersonalSkill ? 100 : requiredLevel,
                        RecommendationLevel = recommendationLevel,
                        TaskTitle = isPersonalSkill
                            ? $"{skill.Name} Personal Development Plan"
                            : GetTaskTitle(skill.Name, nextLevel),
                        TaskType = isPersonalSkill
                            ? "Personal Development"
                            : GetTaskType(nextLevel),
                        LearningPlatforms = isPersonalSkill
                            ? new List<LearningPlatformLink>()
                            : BuildLearningPlatformLinks(
                                learningPlatforms,
                                skill.Name,
                                recommendationLevel
                            ),
                        PracticeTask = practiceTask,
                        CaseStudy = caseStudy,
                        ProjectSuggestion = projectSuggestion,
                        ProjectDescription = projectDescription,
                        DevelopmentActivities = developmentActivities
                    });
                }

                int skillMatchPercentage = totalWeight > 0
                    ? (int)Math.Round((weightedScore / totalWeight) * 100)
                    : 0;

                int educationBonus = CalculateEducationBonus(userEducations, career);

                int ruleBasedScore = Math.Min(skillMatchPercentage + educationBonus, 100);

                string locationQuery = string.IsNullOrWhiteSpace(userLocation)
                    ? ""
                    : userLocation;

                var mlMatch = mlMatches.FirstOrDefault(m => m.CareerId == career.Id);
                double mlPercentage = mlMatch?.MatchPercentage ?? 0;

                // Show the stronger of rule-based and ML scores so UI match % is meaningful
                int displayMatch = Math.Max(ruleBasedScore, (int)mlPercentage);

                results.Add(new CareerMatchResult
                {
                    CareerId = career.Id,
                    CareerTitle = career.Title,
                    CareerDescription = career.Description,
                    MatchPercentage = displayMatch,
                    RuleBasedScore = ruleBasedScore,
                    MlBoost = (int)Math.Max(mlPercentage - ruleBasedScore, 0),
                    IsAiRecommended = displayMatch >= 70,
                    MlPrediction = "ML.NET SDCA Regression Model",
                    HasRequirements = hasRequirements,
                    JobPlatforms = BuildJobPlatformLinks(
                        jobPlatforms,
                        career.Title,
                        locationQuery
                    ),
                    MissingSkills = missingSkills,
                    MatchedSkills = matchedSkills
                });
            }

            return Ok(results.OrderByDescending(r => r.MatchPercentage));
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

        private int CalculateEducationBonus(List<Education> educations, Career career)
        {
            if (educations == null || educations.Count == 0)
                return 0;

            if (string.IsNullOrWhiteSpace(career.RequiredEducation))
                return 0;

            var requiredDepartments = career.RequiredEducation
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(x => NormalizeText(x))
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .ToList();

            foreach (var education in educations)
            {
                string userDepartment = NormalizeText(
                    education.Department != null
                        ? education.Department.Name
                        : education.CustomDepartmentName
                );

                foreach (var required in requiredDepartments)
                {
                    if (required.Contains(userDepartment) || userDepartment.Contains(required))
                        return 10;
                }
            }

            return 0;
        }

        private string NormalizeText(string? text)
        {
            return string.IsNullOrWhiteSpace(text)
                ? ""
                : text.Trim().ToLower();
        }

        private List<LearningPlatformLink> BuildLearningPlatformLinks(
            List<LearningPlatform> platforms,
            string skillName,
            string recommendationLevel)
        {
            var links = new List<LearningPlatformLink>();

            foreach (var platform in platforms)
            {
                string query = $"{skillName} {recommendationLevel} {platform.QuerySuffix}".Trim();

                links.Add(new LearningPlatformLink
                {
                    PlatformName = platform.Name,
                    Url = $"{platform.BaseSearchUrl}{Uri.EscapeDataString(query)}"
                });
            }

            return links;
        }

        private List<JobPlatformLink> BuildJobPlatformLinks(
            List<JobPlatform> platforms,
            string careerTitle,
            string location)
        {
            var links = new List<JobPlatformLink>();

            foreach (var platform in platforms)
            {
                string query = string.IsNullOrWhiteSpace(location)
                    ? careerTitle
                    : $"{careerTitle} {location}";

                links.Add(new JobPlatformLink
                {
                    PlatformName = platform.Name,
                    Url = $"{platform.BaseSearchUrl}{Uri.EscapeDataString(query)}"
                });
            }

            return links;
        }

        private string BuildText(string? template, string fallback)
        {
            if (string.IsNullOrWhiteSpace(template))
                return fallback;

            return template.Trim();
        }

        private string BuildSkillBasedText(
            string? template,
            string skillName,
            string fallback)
        {
            string text = string.IsNullOrWhiteSpace(template)
                ? fallback
                : template.Trim();

            text = text.Trim();

            if (string.IsNullOrWhiteSpace(text))
                return $"Related skill: {skillName}.";

            if (text.Contains(skillName, StringComparison.OrdinalIgnoreCase))
                return text;

            return $"{text} ({skillName})";
        }

        private string? GetPracticeTaskByLevel(SkillCategory? category, int currentLevel)
        {
            if (category == null)
                return null;

            return currentLevel switch
            {
                <= 0 => category.PracticeTask01,
                1 => category.PracticeTask12,
                2 => category.PracticeTask23,
                3 => category.PracticeTask34,
                _ => category.PracticeTask45
            };
        }

        private string? GetCaseStudyByLevel(SkillCategory? category, int currentLevel)
        {
            if (category == null)
                return null;

            return currentLevel switch
            {
                <= 0 => category.CaseStudy01,
                1 => category.CaseStudy12,
                2 => category.CaseStudy23,
                3 => category.CaseStudy34,
                _ => category.CaseStudy45
            };
        }

        private string? GetProjectSuggestionByLevel(SkillCategory? category, int currentLevel)
        {
            if (category == null)
                return null;

            return currentLevel switch
            {
                <= 0 => category.ProjectSuggestion01,
                1 => category.ProjectSuggestion12,
                2 => category.ProjectSuggestion23,
                3 => category.ProjectSuggestion34,
                _ => category.ProjectSuggestion45
            };
        }

        private string? GetProjectDescriptionByLevel(SkillCategory? category, int currentLevel)
        {
            if (category == null)
                return null;

            return currentLevel switch
            {
                <= 0 => category.ProjectDescription01,
                1 => category.ProjectDescription12,
                2 => category.ProjectDescription23,
                3 => category.ProjectDescription34,
                _ => category.ProjectDescription45
            };
        }

        private string GetRecommendationLevel(int level)
        {
            if (level <= 0) return "No Knowledge";
            if (level == 1) return "Beginner";
            if (level == 2) return "Basic";
            if (level == 3) return "Intermediate";
            if (level == 4) return "Advanced";
            return "Expert";
        }

        private string GetTaskType(int nextLevel)
        {
            if (nextLevel <= 2) return "Learning + Practice";
            if (nextLevel == 3) return "Practice Task";
            if (nextLevel == 4) return "Advanced Practice";
            return "Advanced Case Study + Project";
        }

        private string GetTaskTitle(string skillName, int nextLevel)
        {
            if (nextLevel <= 2)
                return $"Complete beginner learning and practice for {skillName}";

            if (nextLevel == 3)
                return $"Complete an intermediate task for {skillName}";

            if (nextLevel == 4)
                return $"Complete an advanced task for {skillName}";

            return $"Complete an expert-level case study and project for {skillName}";
        }
    }
}