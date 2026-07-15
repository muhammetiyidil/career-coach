namespace CareerCoachAPI.Models
{
    public class Skill
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string SkillType { get; set; } = string.Empty;

        // Technical: Frontend / Backend / AI
        // Personal: null olabilir
        public string? Category { get; set; }

        public string Description { get; set; } = string.Empty;

        public string PersonalDevelopmentActivityTemplate { get; set; } = string.Empty;

        public string PersonalReflectionTemplate { get; set; } = string.Empty;

        public string PersonalFeedbackTemplate { get; set; } = string.Empty;

        public string PersonalRealLifeExerciseTemplate { get; set; } = string.Empty;

        public List<UserSkill> UserSkills { get; set; } = new();

        public List<CareerSkill> CareerSkills { get; set; } = new();
    }
}