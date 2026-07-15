namespace CareerCoachAPI.Models
{
    public class UserCareer
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public int CareerId { get; set; }

        public int MatchPercentage { get; set; }

        public DateTime SelectedAt { get; set; } = DateTime.UtcNow;

        public User? User { get; set; }
        public Career? Career { get; set; }
    }
}