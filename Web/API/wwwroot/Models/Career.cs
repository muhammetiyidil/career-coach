namespace CareerCoachAPI.Models
{
    public class Career
    {
        public int Id { get; set; }

        // Career Information
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        // Career Details
        public string Industry { get; set; } = string.Empty;
        public string RequiredEducation { get; set; } = string.Empty;

        // Low / Medium / High
        public string DemandLevel { get; set; } = string.Empty;

        // Optional future fields
        public decimal? AverageSalary { get; set; }
        public string WorkType { get; set; } = string.Empty;
        // Remote / Hybrid / On-site

        public string CareerCategory { get; set; } = string.Empty;
        // Technology / Design / Business / Healthcare etc.

        // Navigation Properties
        public List<CareerSkill> CareerSkills { get; set; } = new();
        public List<UserCareer> UserCareers { get; set; } = new();
    }
}