namespace CareerCoachAPI.Models
{
    public class UserRoadmapState
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public int SkillId { get; set; }

        public int FromLevel { get; set; }

        public int ToLevel { get; set; }

        public string SelectedPlatforms { get; set; } = string.Empty;

        public bool IsCompleted { get; set; }

        public bool IsPracticeTaskCompleted { get; set; }

        public string PracticeTaskDescription { get; set; } = string.Empty;

        public bool IsCaseStudyCompleted { get; set; }

        public string CaseStudyDescription { get; set; } = string.Empty;

        public bool IsProjectCompleted { get; set; }

        public string ProjectDescription { get; set; } = string.Empty;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public User? User { get; set; }

        public Skill? Skill { get; set; }
    }
}