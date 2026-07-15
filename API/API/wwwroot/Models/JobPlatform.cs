namespace CareerCoachAPI.Models
{
    public class JobPlatform
    {
        public int Id { get; set; }

        // LinkedIn / Kariyer.net / Indeed
        public string Name { get; set; } = string.Empty;

        // Search base url
        public string BaseSearchUrl { get; set; } = string.Empty;

        // Platform active?
        public bool IsActive { get; set; } = true;
    }
}