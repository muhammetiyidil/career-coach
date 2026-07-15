namespace CareerCoachAPI.Models
{
    public class Education
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public int? DepartmentId { get; set; }

        public string CustomDepartmentName { get; set; } = string.Empty;

        public string SchoolName { get; set; } = string.Empty;

        public string DegreeLevel { get; set; } = string.Empty;

        public int StartYear { get; set; }

        public int EndYear { get; set; }

        public string GPA { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public User? User { get; set; }

        public Department? Department { get; set; }
    }
}