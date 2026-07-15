namespace CareerCoachAPI.Models
{
    public class Project
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Technologies { get; set; } = string.Empty;

        public string GithubUrl { get; set; } = string.Empty;

        public string LiveDemoUrl { get; set; } = string.Empty;

        public string ProjectType { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User? User { get; set; }
    }
}