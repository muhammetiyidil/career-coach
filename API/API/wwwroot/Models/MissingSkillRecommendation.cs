namespace CareerCoachAPI.Models
{
    public class MissingSkillRecommendation
    {
        public int SkillId { get; set; }

        public string SkillName { get; set; } = string.Empty;

        public string SkillType { get; set; } = string.Empty;

        public string SkillCategory { get; set; } = string.Empty;

        public int UserLevel { get; set; }

        public int RequiredLevel { get; set; }

        public string RecommendationLevel { get; set; } = string.Empty;

        public string TaskTitle { get; set; } = string.Empty;

        public string TaskType { get; set; } = string.Empty;

        // Dynamic learning platform links
        public List<LearningPlatformLink> LearningPlatforms { get; set; } = new();

        public string PracticeTask { get; set; } = string.Empty;

        public string CaseStudy { get; set; } = string.Empty;

        public string ProjectSuggestion { get; set; } = string.Empty;

        public string ProjectDescription { get; set; } = string.Empty;

        public List<string> DevelopmentActivities { get; set; } = new();
    }

    public class LearningPlatformLink
    {
        public string PlatformName { get; set; } = string.Empty;

        public string Url { get; set; } = string.Empty;
    }
}