using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using CareerCoachAPI.Models;
using UglyToad.PdfPig;

namespace CareerCoachAPI.Services
{
    public class ParsedEducationDto
    {
        public string SchoolName { get; set; } = string.Empty;
        public string DegreeLevel { get; set; } = string.Empty;
        public int? DepartmentId { get; set; }
        public string CustomDepartmentName { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;
        public int StartYear { get; set; }
        public int EndYear { get; set; }
        public string GPA { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class ParsedExperienceDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public int DurationInMonths { get; set; }
        public string Technologies { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class ParsedProjectDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Technologies { get; set; } = string.Empty;
        public string GithubUrl { get; set; } = string.Empty;
        public string LiveDemoUrl { get; set; } = string.Empty;
        public string ProjectType { get; set; } = string.Empty;
    }

    public class CvParseResultDto
    {
        public string CvSummary { get; set; } = string.Empty;
        public List<ParsedEducationDto> Educations { get; set; } = new();
        public List<ParsedExperienceDto> Experiences { get; set; } = new();
        public List<ParsedProjectDto> Projects { get; set; } = new();
    }

    public class CvParserService
    {
        public CvParseResultDto ParseCv(Stream fileStream, string fileExtension, List<Department> departments)
        {
            string rawText = string.Empty;

            if (fileExtension.Equals(".pdf", StringComparison.OrdinalIgnoreCase))
            {
                rawText = ExtractTextFromPdf(fileStream);
            }
            else if (fileExtension.Equals(".docx", StringComparison.OrdinalIgnoreCase))
            {
                rawText = ExtractTextFromDocx(fileStream);
            }
            else if (fileExtension.Equals(".doc", StringComparison.OrdinalIgnoreCase))
            {
                rawText = ExtractTextFromDoc(fileStream);
            }

            return ParseCvText(rawText, departments);
        }

        private string ExtractTextFromPdf(Stream pdfStream)
        {
            try
            {
                var textBuilder = new StringBuilder();
                using (var document = PdfDocument.Open(pdfStream))
                {
                    foreach (var page in document.GetPages())
                    {
                        textBuilder.AppendLine(page.Text);
                    }
                }
                return textBuilder.ToString();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PDF Extraction Error] {ex.Message}");
                return string.Empty;
            }
        }

        private string ExtractTextFromDocx(Stream docxStream)
        {
            try
            {
                using (var archive = new ZipArchive(docxStream, ZipArchiveMode.Read))
                {
                    var entry = archive.GetEntry("word/document.xml");
                    if (entry == null) return string.Empty;

                    using (var stream = entry.Open())
                    {
                        var doc = XDocument.Load(stream);
                        // Get all text nodes
                        var textNodes = doc.Descendants()
                            .Where(x => x.Name.LocalName == "t")
                            .Select(x => x.Value);
                        return string.Join(" ", textNodes);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DOCX Extraction Error] {ex.Message}");
                return string.Empty;
            }
        }

        private string ExtractTextFromDoc(Stream docStream)
        {
            try
            {
                var textBuilder = new StringBuilder();
                using (var reader = new BinaryReader(docStream))
                {
                    byte[] bytes = reader.ReadBytes((int)docStream.Length);
                    for (int i = 0; i < bytes.Length; i++)
                    {
                        byte b = bytes[i];
                        if ((b >= 32 && b <= 126) || b == 10 || b == 13 || b == 9)
                        {
                            textBuilder.Append((char)b);
                        }
                    }
                }
                
                string rawText = textBuilder.ToString();
                return Regex.Replace(rawText, @"[^\u0020-\u007E\r\n\t]", " ");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DOC Extraction Error] {ex.Message}");
                return string.Empty;
            }
        }

        private int LevenshteinDistance(string s, string t)
        {
            if (string.IsNullOrEmpty(s)) return string.IsNullOrEmpty(t) ? 0 : t.Length;
            if (string.IsNullOrEmpty(t)) return s.Length;

            int n = s.Length;
            int m = t.Length;
            int[,] d = new int[n + 1, m + 1];

            for (int i = 0; i <= n; d[i, 0] = i++) ;
            for (int j = 0; j <= m; d[0, j] = j++) ;

            for (int i = 1; i <= n; i++)
            {
                for (int j = 1; j <= m; j++)
                {
                    int cost = (t[j - 1] == s[i - 1]) ? 0 : 1;
                    d[i, j] = Math.Min(
                        Math.Min(d[i - 1, j] + 1, d[i, j - 1] + 1),
                        d[i - 1, j - 1] + cost);
                }
            }
            return d[n, m];
        }

        private string NormalizeForHeaderCheck(string text)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;
            text = text.ToLowerInvariant();
            text = text.Replace('ı', 'i')
                       .Replace('ğ', 'g')
                       .Replace('ü', 'u')
                       .Replace('ş', 's')
                       .Replace('ö', 'o')
                       .Replace('ç', 'c')
                       .Replace('İ', 'i')
                       .Replace('Ğ', 'g')
                       .Replace('Ü', 'u')
                       .Replace('Ş', 's')
                       .Replace('Ö', 'o')
                       .Replace('Ç', 'c');
            return text.Trim();
        }

        private bool ContainsFuzzyKeyword(string line, string[] keywords)
        {
            if (string.IsNullOrWhiteSpace(line)) return false;
            
            string normalizedLine = NormalizeForHeaderCheck(line);
            
            foreach (var keyword in keywords)
            {
                string normalizedKeyword = NormalizeForHeaderCheck(keyword);
                if (normalizedLine.Contains(normalizedKeyword))
                {
                    return true;
                }
            }

            string[] words = normalizedLine.Split(new[] { ' ', '.', ',', ';', ':', '-', '(', ')', '[', ']', '/', '\\', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

            foreach (var word in words)
            {
                if (word.Length < 3) continue;
                foreach (var keyword in keywords)
                {
                    string normalizedKeyword = NormalizeForHeaderCheck(keyword);
                    if (normalizedKeyword.Contains(" ")) continue;

                    int limit = 0;
                    if (normalizedKeyword.Length >= 7) limit = 2;
                    else if (normalizedKeyword.Length >= 5) limit = 1;

                    if (limit > 0 && Math.Abs(word.Length - normalizedKeyword.Length) <= limit)
                    {
                        if (LevenshteinDistance(word, normalizedKeyword) <= limit)
                        {
                            return true;
                        }
                    }
                }
            }

            return false;
        }

        private string SummarizeText(string text, int maxChars = 300)
        {
            if (string.IsNullOrWhiteSpace(text)) return string.Empty;

            string cleaned = Regex.Replace(text, @"[\r\n\t]+", " ");
            cleaned = Regex.Replace(cleaned, @"^\s*[-•*+]\s*", "");
            cleaned = Regex.Replace(cleaned, @"\s+[-•*+]\s+", " ");
            cleaned = Regex.Replace(cleaned, @"\s+", " ").Trim();

            if (cleaned.Length <= maxChars) return cleaned;

            string[] sentences = Regex.Split(cleaned, @"(?<=[.!?])\s+");
            var summaryBuilder = new StringBuilder();

            foreach (var sentence in sentences)
            {
                string trimmed = sentence.Trim();
                if (string.IsNullOrEmpty(trimmed)) continue;

                if (summaryBuilder.Length + trimmed.Length + (summaryBuilder.Length > 0 ? 1 : 0) <= maxChars)
                {
                    if (summaryBuilder.Length > 0)
                    {
                        summaryBuilder.Append(" ");
                    }
                    summaryBuilder.Append(trimmed);
                }
                else
                {
                    if (summaryBuilder.Length == 0)
                    {
                        string truncated = trimmed.Substring(0, Math.Min(trimmed.Length, maxChars - 3)).Trim();
                        summaryBuilder.Append(truncated + "...");
                    }
                    else
                    {
                        if (!summaryBuilder.ToString().EndsWith("..."))
                        {
                            summaryBuilder.Append("...");
                        }
                    }
                    break;
                }
            }

            string result = summaryBuilder.ToString().Trim();
            if (result.Length > maxChars)
            {
                result = result.Substring(0, maxChars - 3).Trim() + "...";
            }

            return result;
        }

        private string ExtractSchoolName(string line)
        {
            if (string.IsNullOrEmpty(line)) return string.Empty;

            string cleaned = Regex.Replace(line, @"^(education|egitim|academic|okul|lise|mezuniyet|about me|summary|objective|experience|projects)[^a-zA-Z]*", "", RegexOptions.IgnoreCase);

            string[] parts = cleaned.Split(new[] { ',', '|', '(', ')', '[', ']', ';', '-', '–', '\t' }, StringSplitOptions.RemoveEmptyEntries);
            string[] schoolKeywords = new[] { "university", "college", "school", "lise", "universite", "institute", "enstitu", "akademi", "fakulte", "kolej", "okul" };

            foreach (var part in parts)
            {
                string trimmedPart = part.Trim();
                if (ContainsFuzzyKeyword(trimmedPart, schoolKeywords))
                {
                    return trimmedPart;
                }
            }

            var dateMatch = Regex.Match(cleaned, @"\b(19\d{2}|20\d{2}|\d{2}/\d{2}|\d{2}\.\d{2})\b");
            if (dateMatch.Success)
            {
                string beforeDate = cleaned.Substring(0, dateMatch.Index).Trim();
                return Regex.Replace(beforeDate, @"[,\-|–\s]+$", "").Trim();
            }

            return cleaned;
        }

        private string ExtractCompanyName(string line)
        {
            if (string.IsNullOrEmpty(line)) return string.Empty;

            string cleaned = Regex.Replace(line, @"^(experience|deneyim|work|employment|is deneyimi|staj|calisma)[^a-zA-Z]*", "", RegexOptions.IgnoreCase);

            var atMatch = Regex.Match(cleaned, @"\bat\s+([A-Za-z0-9\s\.-]+)", RegexOptions.IgnoreCase);
            if (atMatch.Success)
            {
                string candidate = atMatch.Groups[1].Value.Trim();
                string[] stopWords = new[] { "for", "in", "during", "since", "from", "to", ",", "-", "|", "(", "\t" };
                string firstPart = candidate.Split(stopWords, StringSplitOptions.None)[0].Trim();
                return firstPart;
            }

            string[] parts = cleaned.Split(new[] { ',', '|', '(', ')', '[', ']', ';', '-', '–', '\t' }, StringSplitOptions.RemoveEmptyEntries);
            string[] positionKeywords = new[] { "engineer", "developer", "manager", "analyst", "designer", "muhendis", "gelistirici", "stajyer", "intern", "uzman", "architect", "programmer", "lead", "senior", "junior" };

            foreach (var part in parts)
            {
                string trimmedPart = part.Trim();
                if (!ContainsFuzzyKeyword(trimmedPart, positionKeywords) && trimmedPart.Length >= 3 && trimmedPart.Length <= 30)
                {
                    return trimmedPart;
                }
            }

            return string.Empty;
        }

        private string ExtractPosition(string line)
        {
            if (string.IsNullOrEmpty(line)) return string.Empty;

            string cleaned = Regex.Replace(line, @"^(experience|deneyim|work|employment|is deneyimi|staj|calisma)[^a-zA-Z]*", "", RegexOptions.IgnoreCase);
            string[] positionKeywords = new[] {
                "engineer", "developer", "manager", "analyst", "designer", "muhendis", "gelistirici", "stajyer", "intern",
                "uzman", "architect", "programmer", "administrator", "lead", "senior", "junior", "yönetici", "yonetici",
                "danışman", "danisman", "asistan", "assistant", "specialist", "tester", "analist", "tasarımcı", "tasarimci"
            };

            string[] parts = cleaned.Split(new[] { ',', '|', '(', ')', '[', ']', ';', '-', '–', '\t' }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var part in parts)
            {
                string trimmedPart = part.Trim();
                if (ContainsFuzzyKeyword(trimmedPart, positionKeywords))
                {
                    string noCompany = Regex.Replace(trimmedPart, @"\bat\s+.*$", "", RegexOptions.IgnoreCase).Trim();
                    return noCompany;
                }
            }

            if (ContainsFuzzyKeyword(cleaned, positionKeywords))
            {
                var atMatch = Regex.Match(cleaned, @"^(.*?)\s+at\s+", RegexOptions.IgnoreCase);
                if (atMatch.Success)
                {
                    return atMatch.Groups[1].Value.Trim();
                }
                return cleaned;
            }

            return string.Empty;
        }

        private string ExtractProjectTitle(string line)
        {
            if (string.IsNullOrEmpty(line)) return string.Empty;

            string cleaned = Regex.Replace(line, @"^(project|proje|portfolio|portfolyo|calismalar|faaliyetler)[^a-zA-Z]*", "", RegexOptions.IgnoreCase);

            string[] parts = cleaned.Split(new[] { ':', '-', '–', '|', '\t' }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length > 0)
            {
                string title = parts[0].Trim();
                if (title.Length <= 40) return title;
            }

            return cleaned.Length <= 40 ? cleaned : cleaned.Substring(0, 40).Trim() + "...";
        }

        public CvParseResultDto ParseCvText(string text, List<Department> departments)
        {
            var result = new CvParseResultDto();
            if (string.IsNullOrWhiteSpace(text)) return result;

            string[] lines = text.Split(new[] { "\r\n", "\n", "\r" }, StringSplitOptions.RemoveEmptyEntries)
                                 .Select(l => l.Trim())
                                 .Where(l => !string.IsNullOrEmpty(l))
                                 .ToArray();

            string currentSection = "Summary";
            var sectionLines = new Dictionary<string, List<string>>
            {
                { "Summary", new List<string>() },
                { "Education", new List<string>() },
                { "Experience", new List<string>() },
                { "Projects", new List<string>() },
                { "Other", new List<string>() }
            };

            foreach (var line in lines)
            {
                string lowerLine = line.ToLower();
                if (IsSectionHeader(lowerLine, out string sectionName))
                {
                    currentSection = sectionName;
                    if (line.Length <= 25)
                    {
                        continue;
                    }
                }

                sectionLines[currentSection].Add(line);
            }

            // 1. Process Summary
            var summaryBuilder = new StringBuilder();
            var summaryLines = sectionLines["Summary"].Take(4).ToList();
            if (!summaryLines.Any() && lines.Any())
            {
                summaryLines = lines.Take(3).ToList();
            }
            foreach (var line in summaryLines)
            {
                summaryBuilder.Append(line + " ");
            }
            result.CvSummary = summaryBuilder.ToString().Trim();

            // 2. Process Education Section
            result.Educations = ParseEducations(sectionLines["Education"], departments);
            if (!result.Educations.Any())
            {
                result.Educations = ParseEducations(lines.ToList(), departments);
            }

            // 3. Process Experience Section
            result.Experiences = ParseExperiences(sectionLines["Experience"]);
            if (!result.Experiences.Any())
            {
                var experienceCandidateLines = lines.Where(line => 
                    !result.Educations.Any(edu => line.Contains(edu.SchoolName) || edu.Description.Contains(line)) &&
                    !ContainsFuzzyKeyword(line, new[] { "education", "egitim", "academic", "university", "universite", "lise", "okul", "summary", "ozet" })
                ).ToList();
                result.Experiences = ParseExperiences(experienceCandidateLines);
            }

            // 4. Process Projects Section
            result.Projects = ParseProjects(sectionLines["Projects"]);
            if (!result.Projects.Any())
            {
                var projectCandidateLines = lines.Where(line =>
                    !result.Educations.Any(edu => line.Contains(edu.SchoolName) || edu.Description.Contains(line)) &&
                    !result.Experiences.Any(exp => line.Contains(exp.CompanyName) || line.Contains(exp.Position) || exp.Description.Contains(line)) &&
                    !ContainsFuzzyKeyword(line, new[] { "education", "egitim", "academic", "university", "universite", "lise", "okul", "experience", "deneyim", "work", "job", "summary", "ozet" })
                ).ToList();
                result.Projects = ParseProjects(projectCandidateLines);
            }

            return result;
        }

        private bool IsSectionHeader(string lowerLine, out string sectionName)
        {
            sectionName = string.Empty;
            if (string.IsNullOrWhiteSpace(lowerLine)) return false;

            string normalized = NormalizeForHeaderCheck(lowerLine);
            string cleanStart = Regex.Replace(normalized, @"^[^a-z0-9]+", "").Trim();

            string[] educationKeywords = new[] { "education", "egitim", "academic", "ogrenim", "okul", "mezuniyet" };
            string[] experienceKeywords = new[] { "experience", "employment", "work", "deneyim", "is gecmisi", "career", "tecrube", "is deneyimi", "staj", "calisma" };
            string[] projectKeywords = new[] { "project", "proje", "portfolio", "portfolyo", "calismalar", "faaliyetler" };
            string[] summaryKeywords = new[] { "summary", "objective", "about me", "ozet", "hakkimda", "profil", "on yazi", "ozgecmis" };
            string[] otherKeywords = new[] { "skill", "yetenek", "language", "dil", "certificate", "sertifika", "reference", "referans", "hobby", "hobi", "interest", "contact", "iletisim", "about", "hakkinda" };

            bool StartsWithKeyword(string str, string[] keywords)
            {
                foreach (var kw in keywords)
                {
                    string normKw = NormalizeForHeaderCheck(kw);
                    if (str.StartsWith(normKw, StringComparison.OrdinalIgnoreCase))
                    {
                        if (str.Length == normKw.Length || !char.IsLetterOrDigit(str[normKw.Length]))
                        {
                            return true;
                        }
                    }
                }
                return false;
            }

            if (cleanStart.Length <= 35)
            {
                if (ContainsFuzzyKeyword(cleanStart, educationKeywords)) { sectionName = "Education"; return true; }
                if (ContainsFuzzyKeyword(cleanStart, experienceKeywords)) { sectionName = "Experience"; return true; }
                if (ContainsFuzzyKeyword(cleanStart, projectKeywords)) { sectionName = "Projects"; return true; }
                if (ContainsFuzzyKeyword(cleanStart, summaryKeywords)) { sectionName = "Summary"; return true; }
                if (ContainsFuzzyKeyword(cleanStart, otherKeywords)) { sectionName = "Other"; return true; }
            }
            else
            {
                if (StartsWithKeyword(cleanStart, educationKeywords)) { sectionName = "Education"; return true; }
                if (StartsWithKeyword(cleanStart, experienceKeywords)) { sectionName = "Experience"; return true; }
                if (StartsWithKeyword(cleanStart, projectKeywords)) { sectionName = "Projects"; return true; }
                if (StartsWithKeyword(cleanStart, summaryKeywords)) { sectionName = "Summary"; return true; }
                if (StartsWithKeyword(cleanStart, otherKeywords)) { sectionName = "Other"; return true; }
            }

            return false;
        }

        private List<ParsedEducationDto> ParseEducations(List<string> lines, List<Department> departments)
        {
            var list = new List<ParsedEducationDto>();
            ParsedEducationDto? current = null;

            string[] schoolKeywords = new[] { 
                "university", "college", "school", "lise", "universite", "institute", "enstitu", "akademi", "fakulte", "kolej", "okul",
                "odtü", "metu", "itü", "itu", "boun", "hacettepe", "bilkent", "yıldız", "yildiz", "koç", "koc", "sabancı", "sabanci",
                "marmara", "ege", "gazi", "istanbul", "ankara", "anadolu"
            };
            string[] degreeKeywords = new[] { 
                "bachelor", "master", "phd", "degree", "lisans", "onlisans", "yuksek lisans", "doktora", "mezun", "bsc", "msc", 
                "ph.d", "b.s", "m.s", "diploma" 
            };

            foreach (var line in lines)
            {
                bool isNewEntry = false;
                string normalized = NormalizeForHeaderCheck(line);

                if (ContainsFuzzyKeyword(line, schoolKeywords))
                {
                    isNewEntry = true;
                }
                else if (ContainsFuzzyKeyword(line, degreeKeywords))
                {
                    if (current == null) isNewEntry = true;
                }

                if (isNewEntry)
                {
                    if (current != null)
                    {
                        current.Description = SummarizeText(current.Description, 300);
                        list.Add(current);
                    }
                    current = new ParsedEducationDto();
                }

                if (current == null) current = new ParsedEducationDto();

                // School Name
                if (string.IsNullOrEmpty(current.SchoolName))
                {
                    if (ContainsFuzzyKeyword(line, schoolKeywords))
                    {
                        current.SchoolName = ExtractSchoolName(line);
                    }
                }

                // Degree Level
                if (string.IsNullOrEmpty(current.DegreeLevel))
                {
                    if (normalized.Contains("bachelor") || normalized.Contains("bsc") || normalized.Contains("lisans") || normalized.Contains("b.s"))
                        current.DegreeLevel = "Bachelor";
                    else if (normalized.Contains("master") || normalized.Contains("msc") || normalized.Contains("yuksek lisans") || normalized.Contains("m.s"))
                        current.DegreeLevel = "Master";
                    else if (normalized.Contains("phd") || normalized.Contains("doktora") || normalized.Contains("ph.d"))
                        current.DegreeLevel = "PhD";
                    else if (normalized.Contains("associate") || normalized.Contains("onlisans"))
                        current.DegreeLevel = "Associate Degree";
                }

                // Years
                var yearMatches = Regex.Matches(line, @"\b(19\d{2}|20\d{2})\b");
                if (yearMatches.Count > 0)
                {
                    int firstYear = int.Parse(yearMatches[0].Value);
                    if (current.StartYear == 0)
                    {
                        current.StartYear = firstYear;
                    }
                    if (yearMatches.Count > 1)
                    {
                        current.EndYear = int.Parse(yearMatches[1].Value);
                    }
                    else if (normalized.Contains("present") || normalized.Contains("devam") || normalized.Contains("current"))
                    {
                        current.EndYear = DateTime.Now.Year;
                    }
                }

                // GPA
                var gpaMatch = Regex.Match(line, @"\b([0-4]\.\d{1,2})\b");
                if (gpaMatch.Success)
                {
                    current.GPA = gpaMatch.Value;
                }

                // Department
                foreach (var dept in departments)
                {
                    string normalizedDept = NormalizeForHeaderCheck(dept.Name);
                    string[] deptKeywords = new[] { normalizedDept };
                    if (ContainsFuzzyKeyword(line, deptKeywords))
                    {
                        current.DepartmentId = dept.Id;
                        current.DepartmentName = dept.Name;
                        break;
                    }
                }

                if (current.DepartmentId == null && string.IsNullOrEmpty(current.CustomDepartmentName))
                {
                    var deptMatch = Regex.Match(line, @"(in|of|department of)\s+([A-Za-z\s]{3,30})", RegexOptions.IgnoreCase);
                    if (deptMatch.Success)
                    {
                        current.CustomDepartmentName = deptMatch.Groups[2].Value.Trim();
                        current.DepartmentName = current.CustomDepartmentName;
                    }
                }

                // Discard description unless it is clearly an education description line
                if (normalized.Contains("coursework") || normalized.Contains("thesis") || normalized.Contains("gpa") || normalized.Contains("grade") || normalized.Contains("honor"))
                {
                    current.Description = (current.Description + " " + line).Trim();
                }
            }

            if (current != null)
            {
                current.Description = SummarizeText(current.Description, 300);
                list.Add(current);
            }
            return list.Where(x => !string.IsNullOrEmpty(x.SchoolName)).ToList();
        }

        private List<ParsedExperienceDto> ParseExperiences(List<string> lines)
        {
            var list = new List<ParsedExperienceDto>();
            ParsedExperienceDto? current = null;

            string[] positionKeywords = new[] {
                "engineer", "developer", "manager", "analyst", "designer", "muhendis", "gelistirici", "stajyer", "intern",
                "uzman", "architect", "programmer", "administrator", "lead", "senior", "junior", "yönetici", "yonetici",
                "danışman", "danisman", "asistan", "assistant", "specialist", "tester", "analist", "tasarımcı", "tasarimci"
            };

            foreach (var line in lines)
            {
                bool isNewEntry = false;
                string normalized = NormalizeForHeaderCheck(line);

                if (ContainsFuzzyKeyword(line, positionKeywords))
                {
                    isNewEntry = true;
                }
                else if (normalized.Contains("at ") && (normalized.Contains("months") || normalized.Contains("years") || normalized.Contains("yil") || normalized.Contains("ay")))
                {
                    isNewEntry = true;
                }

                if (isNewEntry)
                {
                    if (current != null)
                    {
                        if (current.DurationInMonths <= 0)
                        {
                            current.DurationInMonths = 1;
                        }
                        current.Description = SummarizeText(current.Description, 300);
                        list.Add(current);
                    }
                    current = new ParsedExperienceDto();
                }

                if (current == null) current = new ParsedExperienceDto();

                // Position Title
                if (string.IsNullOrEmpty(current.Position))
                {
                    current.Position = ExtractPosition(line);
                }

                // Company Name
                if (string.IsNullOrEmpty(current.CompanyName))
                {
                    current.CompanyName = ExtractCompanyName(line);
                }

                // Duration in Months
                var durationMatch = Regex.Match(line, @"(\d+)\s*(month|month\(s\)|ay)", RegexOptions.IgnoreCase);
                if (durationMatch.Success)
                {
                    current.DurationInMonths = int.Parse(durationMatch.Groups[1].Value);
                }
                else
                {
                    var yearMatch = Regex.Match(line, @"(\d+)\s*(year|year\(s\)|yil|yıl)", RegexOptions.IgnoreCase);
                    if (yearMatch.Success)
                    {
                        current.DurationInMonths = int.Parse(yearMatch.Groups[1].Value) * 12;
                    }
                }

                // Technologies
                var techList = ExtractTechnologies(line);
                if (techList.Any())
                {
                    var existingTechs = current.Technologies.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(t => t.Trim()).ToList();
                    existingTechs.AddRange(techList);
                    current.Technologies = string.Join(", ", existingTechs.Distinct());
                }

                // Description - Only append if it looks like a task description
                bool isDescription = line != current.Position && !line.Contains(current.CompanyName) &&
                                     (line.StartsWith("-") || line.StartsWith("•") || line.StartsWith("*") ||
                                      normalized.Contains("built") || normalized.Contains("developed") || normalized.Contains("managed") ||
                                      normalized.Contains("designed") || normalized.Contains("implemented") || normalized.Contains("worked") ||
                                      normalized.Contains("responsible") || normalized.Contains("yaptim") || normalized.Contains("gelistirdim") ||
                                      normalized.Contains("kullandim") || normalized.Contains("tasarladim") || normalized.Contains("yonettim"));

                if (isDescription)
                {
                    current.Description = (current.Description + "\n" + line).Trim();
                }
            }

            if (current != null)
            {
                if (current.DurationInMonths <= 0)
                {
                    current.DurationInMonths = 1;
                }
                current.Description = SummarizeText(current.Description, 300);
                list.Add(current);
            }
            return list.Where(x => !string.IsNullOrEmpty(x.CompanyName) || !string.IsNullOrEmpty(x.Position)).ToList();
        }

        private List<ParsedProjectDto> ParseProjects(List<string> lines)
        {
            var list = new List<ParsedProjectDto>();
            ParsedProjectDto? current = null;

            string[] projectStartKeywords = new[] { "github.com", "project:", "proje:" };
            string[] projectKeywords = new[] {
                "application", "system", "app", "website", "web sitesi", "platform", "yazilim", "kutuhane", "kutuphane",
                "uygulama", "proje", "kütüphane", "repository", "repo"
            };

            foreach (var line in lines)
            {
                bool isNewEntry = false;
                string normalized = NormalizeForHeaderCheck(line);

                if (ContainsFuzzyKeyword(line, projectStartKeywords))
                {
                    isNewEntry = true;
                }
                else if (ContainsFuzzyKeyword(line, projectKeywords))
                {
                    if (current == null || line.Length < 40) isNewEntry = true;
                }

                if (isNewEntry)
                {
                    if (current != null)
                    {
                        current.Description = SummarizeText(current.Description, 300);
                        list.Add(current);
                    }
                    current = new ParsedProjectDto();
                }

                if (current == null) current = new ParsedProjectDto();

                // Title
                if (string.IsNullOrEmpty(current.Title))
                {
                    current.Title = ExtractProjectTitle(line);
                }

                // Project Type
                if (string.IsNullOrEmpty(current.ProjectType))
                {
                    if (normalized.Contains("web")) current.ProjectType = "Web Application";
                    else if (normalized.Contains("mobile") || normalized.Contains("android") || normalized.Contains("ios")) current.ProjectType = "Mobile Application";
                    else if (normalized.Contains("desktop") || normalized.Contains("winforms") || normalized.Contains("wpf")) current.ProjectType = "Desktop Application";
                    else if (normalized.Contains("api") || normalized.Contains("backend")) current.ProjectType = "Backend Service";
                    else if (normalized.Contains("frontend")) current.ProjectType = "Frontend UI";
                }

                // Github
                var gitMatch = Regex.Match(line, @"(github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)", RegexOptions.IgnoreCase);
                if (gitMatch.Success)
                {
                    current.GithubUrl = "https://" + gitMatch.Value;
                }

                // Live Demo
                var urlMatch = Regex.Match(line, @"https?://[A-Za-z0-9\.-]+(?!github)", RegexOptions.IgnoreCase);
                if (urlMatch.Success && !urlMatch.Value.Contains("github.com"))
                {
                    current.LiveDemoUrl = urlMatch.Value;
                }

                // Technologies
                var techList = ExtractTechnologies(line);
                if (techList.Any())
                {
                    var existingTechs = current.Technologies.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(t => t.Trim()).ToList();
                    existingTechs.AddRange(techList);
                    current.Technologies = string.Join(", ", existingTechs.Distinct());
                }

                // Description - Only append if it starts with bullet, or contains project/action verbs
                bool isDescription = line != current.Title && !line.Contains("github.com") &&
                                     (line.StartsWith("-") || line.StartsWith("•") || line.StartsWith("*") ||
                                      normalized.Contains("built") || normalized.Contains("developed") || normalized.Contains("created") ||
                                      normalized.Contains("designed") || normalized.Contains("implemented") || normalized.Contains("gelistirdim") ||
                                      normalized.Contains("kullandim") || normalized.Contains("tasarladim") || normalized.Contains("yazdim"));

                if (isDescription)
                {
                    current.Description = (current.Description + "\n" + line).Trim();
                }
            }

            if (current != null)
            {
                current.Description = SummarizeText(current.Description, 300);
                list.Add(current);
            }
            return list.Where(x => !string.IsNullOrEmpty(x.Title)).ToList();
        }

        private List<string> ExtractTechnologies(string line)
        {
            var result = new List<string>();
            string[] knownTechs = new[]
            {
                "C#", "C++", "C", "Java", "Python", "JavaScript", "TypeScript", "React", "Angular", "Vue", "Next.js", 
                "ASP.NET", ".NET", "Express", "Node.js", "Django", "Flask", "Spring", "Spring Boot", "Laravel", "PHP", 
                "Ruby", "Rails", "Go", "Golang", "Rust", "Swift", "Kotlin", "Flutter", "React Native", "SQL", "SQL Server", 
                "MySQL", "PostgreSQL", "MongoDB", "Redis", "Firebase", "SQLite", "Oracle", "HTML", "CSS", "Tailwind", 
                "Bootstrap", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Git", "GitHub", "GitLab"
            };

            foreach (var tech in knownTechs)
            {
                string escaped = Regex.Escape(tech);
                string pattern = @"\b" + escaped + @"\b";
                if (tech.Contains("#") || tech.Contains("+") || tech.Contains("."))
                {
                    pattern = @"(?<=^|\s|[.,;:])" + escaped + @"(?=$|\s|[.,;:])";
                }

                if (Regex.IsMatch(line, pattern, RegexOptions.IgnoreCase))
                {
                    result.Add(tech);
                }
            }

            return result;
        }
    }
}
