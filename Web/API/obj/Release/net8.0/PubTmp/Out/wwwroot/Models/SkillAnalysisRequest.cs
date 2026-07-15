namespace CareerCoachAPI.Models
{
    public class SkillAnalysisResult
    {
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;

        public int EstimatedLevel { get; set; }

        public string Reason { get; set; } = string.Empty;
    }
}