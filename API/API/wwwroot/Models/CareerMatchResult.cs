namespace CareerCoachAPI.Models
{
    public class CareerMatchResult
    {
        public int CareerId { get; set; }

        public string CareerTitle { get; set; } = string.Empty;

        public string CareerDescription { get; set; } = string.Empty;

        public int MatchPercentage { get; set; }

        public int RuleBasedScore { get; set; }

        public int MlBoost { get; set; }

        public bool IsAiRecommended { get; set; }

        public string MlPrediction { get; set; } = string.Empty;

        public bool HasRequirements { get; set; }

        public List<JobPlatformLink> JobPlatforms { get; set; } = new();

        public List<MissingSkillRecommendation> MissingSkills { get; set; } = new();

        public List<MatchedSkillDto> MatchedSkills { get; set; } = new();
    }

    public class JobPlatformLink
    {
        public string PlatformName { get; set; } = string.Empty;

        public string Url { get; set; } = string.Empty;
    }

    public class MatchedSkillDto
    {
        public int SkillId { get; set; }

        public string SkillName { get; set; } = string.Empty;

        public string SkillType { get; set; } = string.Empty;

        public string SkillCategory { get; set; } = string.Empty;

        public int UserLevel { get; set; }

        public int RequiredLevel { get; set; }
    }
}