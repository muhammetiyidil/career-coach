using Microsoft.EntityFrameworkCore;

namespace CareerCoachAPI.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }

        public DbSet<Skill> Skills { get; set; }

        public DbSet<UserSkill> UserSkills { get; set; }

        public DbSet<UserPersonalSkillProgress> UserPersonalSkillProgresses { get; set; }

        public DbSet<Career> Careers { get; set; }

        public DbSet<CareerSkill> CareerSkills { get; set; }

        public DbSet<UserCareer> UserCareers { get; set; }

        public DbSet<Project> Projects { get; set; }

        public DbSet<Experience> Experiences { get; set; }

        public DbSet<Education> Educations { get; set; }

        public DbSet<UserLearningProgress> UserLearningProgresses { get; set; }

        public DbSet<UserRoadmapState> UserRoadmapStates { get; set; }

        public DbSet<SkillCategory> SkillCategories { get; set; }

        public DbSet<SkillType> SkillTypes { get; set; }

        public DbSet<LearningPlatform> LearningPlatforms { get; set; }

        public DbSet<JobPlatform> JobPlatforms { get; set; }

        public DbSet<Department> Departments { get; set; }
    }
}