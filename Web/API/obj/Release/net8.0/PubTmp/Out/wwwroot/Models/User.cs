namespace CareerCoachAPI.Models
{
    public class User
    {
        public int Id { get; set; }

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string PasswordHash { get; set; } = string.Empty;

        public string Role { get; set; } = "User";

        public string Phone { get; set; } = string.Empty;

        public string Country { get; set; } = string.Empty;

        public string City { get; set; } = string.Empty;

        public string ProfilePhotoUrl { get; set; } = string.Empty;

        public DateTime? DateOfBirth { get; set; }

        public string EducationLevel { get; set; } = string.Empty;

        public string CvSummary { get; set; } = string.Empty;

        public string ExperienceText { get; set; } = string.Empty;

        public string ProjectText { get; set; } = string.Empty;

        public bool IsProfileCompleted { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<UserSkill> UserSkills { get; set; } = new();

        public List<UserCareer> UserCareers { get; set; } = new();

        public List<Project> Projects { get; set; } = new();

        public List<Experience> Experiences { get; set; } = new();

        public List<Education> Educations { get; set; } = new();

        public List<UserLearningProgress> UserLearningProgresses { get; set; } = new();

        public string? PasswordResetToken { get; set; }

        public DateTime? PasswordResetTokenExpires { get; set; }
    }
}