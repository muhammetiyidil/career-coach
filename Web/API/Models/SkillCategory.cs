namespace CareerCoachAPI.Models
{
    public class SkillCategory
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string SkillType { get; set; } = string.Empty;

        public string PracticeTask01 { get; set; } = string.Empty;
        public string PracticeTask12 { get; set; } = string.Empty;
        public string PracticeTask23 { get; set; } = string.Empty;
        public string PracticeTask34 { get; set; } = string.Empty;
        public string PracticeTask45 { get; set; } = string.Empty;

        public string CaseStudy01 { get; set; } = string.Empty;
        public string CaseStudy12 { get; set; } = string.Empty;
        public string CaseStudy23 { get; set; } = string.Empty;
        public string CaseStudy34 { get; set; } = string.Empty;
        public string CaseStudy45 { get; set; } = string.Empty;

        public string ProjectSuggestion01 { get; set; } = string.Empty;
        public string ProjectSuggestion12 { get; set; } = string.Empty;
        public string ProjectSuggestion23 { get; set; } = string.Empty;
        public string ProjectSuggestion34 { get; set; } = string.Empty;
        public string ProjectSuggestion45 { get; set; } = string.Empty;

        public string ProjectDescription01 { get; set; } = string.Empty;
        public string ProjectDescription12 { get; set; } = string.Empty;
        public string ProjectDescription23 { get; set; } = string.Empty;
        public string ProjectDescription34 { get; set; } = string.Empty;
        public string ProjectDescription45 { get; set; } = string.Empty;
    }
}