namespace CareerCoachAPI.Models
{
    public class UserSkill
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public int SkillId { get; set; }

        // AI will calculate this level: 1-5
        public int Level { get; set; }

        public User? User { get; set; }
        public Skill? Skill { get; set; }
    }
}