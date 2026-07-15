namespace CareerCoachAPI.Models
{
    public class SkillAnalysisRequest
    {
        public int UserId { get; set; }

        public string CvSummary { get; set; } = string.Empty;
        public string ExperienceText { get; set; } = string.Empty;
        public string ProjectText { get; set; } = string.Empty;

        public List<int> SelectedSkillIds { get; set; } = new();
    }
}