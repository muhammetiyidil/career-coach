namespace CareerCoachAPI.Models
{
    public class CareerSkill
    {
        public int Id { get; set; }

        public int CareerId { get; set; }
        public int SkillId { get; set; }

        public int RequiredLevel { get; set; }

        public int ImportanceScore { get; set; } = 3;

        public Career? Career { get; set; }
        public Skill? Skill { get; set; }
    }
}