namespace CareerCoachAPI.Models
{
    public class LearningPlatform
    {
        public int Id { get; set; }

        // YouTube / Udemy / Coursera
        public string Name { get; set; } = string.Empty;

        // Search base url
        public string BaseSearchUrl { get; set; } = string.Empty;

        // tutorial / course / training
        public string QuerySuffix { get; set; } = string.Empty;

        // Platform active?
        public bool IsActive { get; set; } = true;
    }
}