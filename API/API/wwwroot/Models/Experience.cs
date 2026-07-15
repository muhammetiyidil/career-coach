namespace CareerCoachAPI.Models
{
    public class Experience
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public string CompanyName { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;

        public string Technologies { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public int DurationInMonths { get; set; }

        public User? User { get; set; }
    }
}