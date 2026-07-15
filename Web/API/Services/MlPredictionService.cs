using Microsoft.ML;
using Microsoft.ML.Data;
using CareerCoachAPI.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CareerCoachAPI.Services
{
    public class CareerMatchInput
    {
        [VectorType(5)]
        public float[] Features { get; set; } = null!;

        public float Label { get; set; }
    }

    public class CareerMatchPrediction
    {
        [ColumnName("Score")]
        public float MatchScore { get; set; }
    }

    public class MlPredictionService
    {
        public class MlMatchResult
        {
            public int CareerId { get; set; }
            public double MatchPercentage { get; set; }
        }

        public async Task<List<MlMatchResult>> PredictMatchesAsync(
            AppDbContext context,
            List<UserSkill> userSkills,
            List<UserPersonalSkillProgress> personalProgresses,
            List<Education> userEducations)
        {
            try
            {
                var careers = await context.Careers
                    .Include(c => c.CareerSkills)
                        .ThenInclude(cs => cs.Skill)
                    .ToListAsync();

                if (!careers.Any())
                {
                    return new List<MlMatchResult>();
                }

                // 1. Generate stable synthetic training data representing general matching behavior
                var trainingData = new List<CareerMatchInput>();
                var random = new Random(42);

                for (int i = 0; i < 200; i++)
                {
                    // Generate realistic feature combinations
                    float weightedMatchRatio = (float)random.NextDouble(); // 0.0 to 1.0
                    float matchedRatio = weightedMatchRatio * (float)(0.6 + random.NextDouble() * 0.4); // slightly less or equal
                    float missingRatio = 1.0f - matchedRatio;
                    float averageGap = (1.0f - weightedMatchRatio) * 5.0f * (float)(0.4 + random.NextDouble() * 0.6);
                    float educationMatchFlag = random.NextDouble() > 0.5 ? 1.0f : 0.0f;

                    // Calculate mathematically appropriate label (90% weight on skills match, 10% on education)
                    double baseScore = (weightedMatchRatio * 90.0) + (educationMatchFlag * 10.0);
                    
                    // Deduct slightly for large gaps
                    baseScore -= averageGap * 2.0;

                    // Add small random noise for variance
                    double noise = (random.NextDouble() - 0.5) * 4.0;
                    float label = (float)Math.Clamp(baseScore + noise, 0.0, 100.0);

                    trainingData.Add(new CareerMatchInput
                    {
                        Features = new float[] { weightedMatchRatio, matchedRatio, missingRatio, averageGap, educationMatchFlag },
                        Label = label
                    });
                }

                // 2. Train ML.NET Regression Model
                var mlContext = new MLContext(seed: 42);
                var trainDataView = mlContext.Data.LoadFromEnumerable(trainingData);

                var pipeline = mlContext.Transforms.CopyColumns("Features", nameof(CareerMatchInput.Features))
                    .Append(mlContext.Regression.Trainers.Sdca(labelColumnName: nameof(CareerMatchInput.Label)));

                var model = pipeline.Fit(trainDataView);

                // 3. Predict matches for the current user
                var predictionEngine = mlContext.Model.CreatePredictionEngine<CareerMatchInput, CareerMatchPrediction>(model);
                var resultsList = new List<MlMatchResult>();

                foreach (var career in careers)
                {
                    if (career.CareerSkills == null || !career.CareerSkills.Any())
                    {
                        resultsList.Add(new MlMatchResult
                        {
                            CareerId = career.Id,
                            MatchPercentage = 0
                        });
                        continue;
                    }

                    // Extract aggregated matching features for this career
                    float[] features = CalculateAggregatedFeatures(career, userSkills, personalProgresses, userEducations);

                    var input = new CareerMatchInput
                    {
                        Features = features
                    };

                    var prediction = predictionEngine.Predict(input);
                    double score = Math.Clamp(Math.Round(prediction.MatchScore, 0), 0, 100);

                    resultsList.Add(new MlMatchResult
                    {
                        CareerId = career.Id,
                        MatchPercentage = score
                    });
                }

                return resultsList.OrderByDescending(r => r.MatchPercentage).ToList();
            }
            catch (Exception ex)
            {
                // Fallback to rule-based calculation in case of any system/library level issues
                Console.WriteLine($"[ML.NET Error] {ex.Message}. Falling back to rule-based computation.");
                return await FallbackRuleBasedMatching(context, userSkills, personalProgresses, userEducations);
            }
        }

        private float[] CalculateAggregatedFeatures(
            Career career,
            List<UserSkill> userSkills,
            List<UserPersonalSkillProgress> personalProgresses,
            List<Education> userEducations)
        {
            if (career.CareerSkills == null || !career.CareerSkills.Any())
            {
                return new float[] { 0f, 0f, 0f, 0f, 0f };
            }

            double totalWeight = 0;
            double weightedScore = 0;
            int matchedSkillsCount = 0;
            int missingSkillsCount = 0;
            double totalGap = 0;

            foreach (var required in career.CareerSkills)
            {
                var userSkill = userSkills.FirstOrDefault(us => us.SkillId == required.SkillId);
                var personalProgressRecord = personalProgresses.FirstOrDefault(x => x.SkillId == required.SkillId);

                int userLevel = userSkill?.Level ?? 0;
                int requiredLevel = required.RequiredLevel <= 0 ? 1 : required.RequiredLevel;
                int importance = required.ImportanceScore <= 0 ? 3 : required.ImportanceScore;

                bool isPersonalSkill = required.Skill?.SkillType?.Equals("Personal", StringComparison.OrdinalIgnoreCase) == true ||
                                       required.Skill?.Category?.Equals("Personal", StringComparison.OrdinalIgnoreCase) == true;

                int personalProgressPercentage = 0;
                if (isPersonalSkill)
                {
                    if (personalProgressRecord != null)
                    {
                        personalProgressPercentage = personalProgressRecord.ProgressPercentage;
                        userLevel = personalProgressPercentage switch
                        {
                            >= 100 => 3,
                            >= 66 => 2,
                            >= 33 => 1,
                            _ => 0
                        };
                    }
                    else
                    {
                        userLevel = userLevel switch
                        {
                            <= 0 => 0,
                            1 => 33,
                            2 => 66,
                            >= 3 => 100
                        };
                    }
                }

                double skillScore = isPersonalSkill
                    ? personalProgressPercentage / 100.0
                    : Math.Min(userLevel, requiredLevel) / (double)requiredLevel;

                weightedScore += skillScore * importance;
                totalWeight += importance;

                bool isMatched = isPersonalSkill
                    ? personalProgressPercentage >= 100
                    : userLevel >= requiredLevel;

                if (isMatched)
                {
                    matchedSkillsCount++;
                }
                else
                {
                    missingSkillsCount++;
                    totalGap += isPersonalSkill
                        ? (100 - personalProgressPercentage) / 100.0
                        : (requiredLevel - userLevel);
                }
            }

            // Education Match check
            bool eduMatch = false;
            if (userEducations != null && userEducations.Count > 0 && !string.IsNullOrWhiteSpace(career.RequiredEducation))
            {
                var requiredDepartments = career.RequiredEducation
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => x.Trim().ToLower())
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .ToList();

                foreach (var edu in userEducations)
                {
                    string userDept = (edu.Department?.Name ?? edu.CustomDepartmentName ?? "").Trim().ToLower();
                    foreach (var req in requiredDepartments)
                    {
                        if (req.Contains(userDept) || userDept.Contains(req))
                        {
                            eduMatch = true;
                            break;
                        }
                    }
                    if (eduMatch) break;
                }
            }

            float weightedMatchRatio = totalWeight > 0 ? (float)(weightedScore / totalWeight) : 0f;
            float matchedRatio = (float)matchedSkillsCount / career.CareerSkills.Count;
            float missingRatio = (float)missingSkillsCount / career.CareerSkills.Count;
            float averageGap = career.CareerSkills.Count > 0 ? (float)(totalGap / career.CareerSkills.Count) : 0f;
            float educationMatchFlag = eduMatch ? 1.0f : 0.0f;

            return new float[]
            {
                weightedMatchRatio,
                matchedRatio,
                missingRatio,
                averageGap,
                educationMatchFlag
            };
        }

        private async Task<List<MlMatchResult>> FallbackRuleBasedMatching(
            AppDbContext context,
            List<UserSkill> userSkills,
            List<UserPersonalSkillProgress> personalProgresses,
            List<Education> userEducations)
        {
            var careers = await context.Careers
                .Include(c => c.CareerSkills)
                    .ThenInclude(cs => cs.Skill)
                .ToListAsync();

            var resultsList = new List<MlMatchResult>();

            foreach (var career in careers)
            {
                if (career.CareerSkills == null || !career.CareerSkills.Any())
                {
                    resultsList.Add(new MlMatchResult { CareerId = career.Id, MatchPercentage = 0 });
                    continue;
                }

                double weightedScore = 0;
                double totalWeight = 0;

                foreach (var required in career.CareerSkills)
                {
                    if (required.Skill == null) continue;

                    var userSkill = userSkills.FirstOrDefault(us => us.SkillId == required.SkillId);
                    var personalProgressRecord = personalProgresses.FirstOrDefault(x => x.SkillId == required.SkillId);

                    int userLevel = userSkill?.Level ?? 0;
                    int requiredLevel = required.RequiredLevel <= 0 ? 1 : required.RequiredLevel;
                    int importance = required.ImportanceScore <= 0 ? 3 : required.ImportanceScore;

                    bool isPersonalSkill = required.Skill.SkillType?.Equals("Personal", StringComparison.OrdinalIgnoreCase) == true ||
                                           required.Skill.Category?.Equals("Personal", StringComparison.OrdinalIgnoreCase) == true;

                    int personalProgressPercentage = 0;
                    if (isPersonalSkill)
                    {
                        if (personalProgressRecord != null)
                        {
                            personalProgressPercentage = personalProgressRecord.ProgressPercentage;
                            userLevel = personalProgressPercentage switch
                            {
                                >= 100 => 3,
                                >= 66 => 2,
                                >= 33 => 1,
                                _ => 0
                            };
                        }
                        else
                        {
                            userLevel = userLevel switch
                            {
                                <= 0 => 0,
                                1 => 33,
                                2 => 66,
                                >= 3 => 100
                            };
                        }
                    }

                    double skillScore = isPersonalSkill
                        ? personalProgressPercentage / 100.0
                        : Math.Min(userLevel, requiredLevel) / (double)requiredLevel;

                    weightedScore += skillScore * importance;
                    totalWeight += importance;
                }

                int skillMatchPercentage = totalWeight > 0 ? (int)Math.Round((weightedScore / totalWeight) * 100) : 0;
                
                int educationBonus = 0;
                if (userEducations != null && userEducations.Count > 0 && !string.IsNullOrWhiteSpace(career.RequiredEducation))
                {
                    var depts = career.RequiredEducation.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(x => x.Trim().ToLower()).ToList();
                    foreach (var edu in userEducations)
                    {
                        string userDept = (edu.Department?.Name ?? edu.CustomDepartmentName ?? "").Trim().ToLower();
                        if (depts.Any(d => d.Contains(userDept) || userDept.Contains(d)))
                        {
                            educationBonus = 10;
                            break;
                        }
                    }
                }

                int ruleBasedScore = Math.Min(skillMatchPercentage + educationBonus, 100);

                resultsList.Add(new MlMatchResult
                {
                    CareerId = career.Id,
                    MatchPercentage = ruleBasedScore
                });
            }

            return resultsList.OrderByDescending(r => r.MatchPercentage).ToList();
        }
    }
}
