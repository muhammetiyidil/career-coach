namespace CareerCoachAPI.Models
{
    public class UserLearningProgress
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public int SkillId { get; set; }

        public string TaskTitle { get; set; } = string.Empty;
        public string TaskType { get; set; } = string.Empty;

        public int FromLevel { get; set; }
        public int ToLevel { get; set; }

        public string ReflectionText { get; set; } = string.Empty;

        // Dynamic selected learning platforms
        // Example: ["YouTube","Udemy","Coursera","edX"]
        public string SelectedPlatforms { get; set; } = string.Empty;

        // Practice Task / Development Activity
        public bool IsPracticeTaskCompleted { get; set; } = false;
        public string PracticeTaskDescription { get; set; } = string.Empty;

        // Case Study / Reflection Task
        public bool IsCaseStudyCompleted { get; set; } = false;
        public string CaseStudyDescription { get; set; } = string.Empty;

        // Project Suggestion / Personal Development Plan
        public bool IsProjectCompleted { get; set; } = false;
        public string ProjectDescription { get; set; } = string.Empty;

        public bool IsCompleted { get; set; } = false;

        public DateTime? CompletedAt { get; set; }

        public User? User { get; set; }
        public Skill? Skill { get; set; }
    }
}