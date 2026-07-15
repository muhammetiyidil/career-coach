import { useEffect, useState } from 'react'
import MainLayout from '../layout/MainLayout'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

function AdminAnalytics() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [stats, setStats] = useState({
        users: [],
        skills: [],
        careers: [],
        userSkills: [],
        userCareers: [],
        learningPlatforms: [],
        jobPlatforms: [],
        skillCategories: [],
        roadmapStates: [],
    })

    useEffect(() => {
        fetchAnalytics()
    }, [])

    const safeGet = async (url) => {
        try {
            const response = await api.get(url)
            return Array.isArray(response.data) ? response.data : []
        } catch (err) {
            console.log(`${url} could not be loaded:`, err)
            return []
        }
    }

    const fetchAnalytics = async () => {
        try {
            setLoading(true)
            setError('')

            const [
                users,
                skills,
                careers,
                userSkills,
                userCareers,
                learningPlatforms,
                jobPlatforms,
                skillCategories,
            ] = await Promise.all([
                safeGet('/Users'),
                safeGet('/Skills'),
                safeGet('/Careers'),
                safeGet('/UserSkills'),
                safeGet('/UserCareers'),
                safeGet('/LearningPlatforms'),
                safeGet('/JobPlatforms'),
                safeGet('/SkillCategories'),
            ])

            setStats({
                users,
                skills,
                careers,
                userSkills,
                userCareers,
                learningPlatforms,
                jobPlatforms,
                skillCategories,
                roadmapStates: [],
            })
        } catch (err) {
            console.log(err)
            setError('Analytics data could not be loaded.')
        } finally {
            setLoading(false)
        }
    }

    const completedProfiles = stats.users.filter((user) =>
        user.isProfileCompleted || user.IsProfileCompleted
    ).length

    const technicalSkills = stats.skills.filter((skill) => {
        const skillType = skill.skillType || skill.SkillType || ''
        const category = skill.category || skill.Category || ''

        return (
            skillType.toLowerCase() === 'technical' ||
            category.toLowerCase() === 'technical'
        )
    }).length

    const personalSkills = stats.skills.filter((skill) => {
        const skillType = skill.skillType || skill.SkillType || ''
        const category = skill.category || skill.Category || ''

        return (
            skillType.toLowerCase() === 'personal' ||
            category.toLowerCase() === 'personal'
        )
    }).length

    const activeLearningPlatforms = stats.learningPlatforms.filter((platform) =>
        platform.isActive ?? platform.IsActive
    ).length

    const activeJobPlatforms = stats.jobPlatforms.filter((platform) =>
        platform.isActive ?? platform.IsActive
    ).length

    const technicalCategories = stats.skillCategories.filter((category) => {
        const type = category.skillType || category.SkillType || ''
        return type.toLowerCase() === 'technical'
    }).length

    const averageSkillLevel =
        stats.userSkills.length > 0
            ? (
                stats.userSkills.reduce((sum, item) => {
                    const level = item.level ?? item.Level ?? 0
                    return sum + Number(level)
                }, 0) / stats.userSkills.length
            ).toFixed(1)
            : 0

    return (
        <MainLayout
            title="Analytics"
            subtitle="View platform usage, skill distribution, and career recommendation data."
        >
            {loading ? (
                <LoadingSpinner />
            ) : (
                <>
                    {error && (
                        <div className="alert alert-danger rounded-4 border-0">
                            {error}
                        </div>
                    )}

                    <div className="row g-4 mb-4">
                        <AnalyticsCard title="Total Users" value={stats.users.length} />
                        <AnalyticsCard title="Completed Profiles" value={completedProfiles} />
                        <AnalyticsCard title="Total Careers" value={stats.careers.length} />
                        <AnalyticsCard title="Technical Categories" value={technicalCategories} />
                    </div>

                    <div className="row g-4 mb-4">
                        <AnalyticsCard title="Technical Skills" value={technicalSkills} />
                        <AnalyticsCard title="Personal Skills" value={personalSkills} />
                        <AnalyticsCard title="User Skill Records" value={stats.userSkills.length} />
                        <AnalyticsCard title="Average Skill Level" value={averageSkillLevel} />
                    </div>

                    <div className="row g-4 mb-4">
                        <AnalyticsCard title="Learning Platforms" value={stats.learningPlatforms.length} />
                        <AnalyticsCard title="Active Learning Platforms" value={activeLearningPlatforms} />
                        <AnalyticsCard title="Job Platforms" value={stats.jobPlatforms.length} />
                        <AnalyticsCard title="Active Job Platforms" value={activeJobPlatforms} />
                    </div>

                    <div className="modern-card">
                        <h3 className="fw-bold mb-4">System Summary</h3>

                        <div className="row g-3">
                            <SummaryItem
                                title="Career Selection Records"
                                value={stats.userCareers.length}
                            />

                            <SummaryItem
                                title="Skills Available"
                                value={stats.skills.length}
                            />

                            <SummaryItem
                                title="Careers Available"
                                value={stats.careers.length}
                            />

                            <SummaryItem
                                title="Skill Categories"
                                value={stats.skillCategories.length}
                            />
                        </div>
                    </div>
                </>
            )}
        </MainLayout>
    )
}

function AnalyticsCard({ title, value }) {
    return (
        <div className="col-md-3">
            <div className="modern-card text-center">
                <h6 className="text-muted mb-2">{title}</h6>
                <h2 className="fw-bold">{value}</h2>
            </div>
        </div>
    )
}

function SummaryItem({ title, value }) {
    return (
        <div className="col-md-3">
            <div className="border rounded-4 p-4 text-center bg-light">
                <div className="text-muted small mb-2">{title}</div>
                <div className="fw-bold fs-3">{value}</div>
            </div>
        </div>
    )
}

export default AdminAnalytics