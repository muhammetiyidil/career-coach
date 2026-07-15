namespace CareerCoachAPI.Models
{
    public class UserPersonalSkillProgress
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public int SkillId { get; set; }

        public bool HasThisSkill { get; set; }

        public bool Task1Completed { get; set; }

        public bool Task2Completed { get; set; }

        public bool Task3Completed { get; set; }

        public int ProgressPercentage { get; set; }

        public User? User { get; set; }

        public Skill? Skill { get; set; }
    }
}