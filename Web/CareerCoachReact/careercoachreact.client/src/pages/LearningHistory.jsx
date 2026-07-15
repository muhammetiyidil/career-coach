import { useEffect, useState } from 'react'
import MainLayout from '../layout/MainLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

function LearningHistory() {
    const { user } = useAuth()

    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    const [searchText, setSearchText] = useState('')
    const [skillTypeFilter, setSkillTypeFilter] = useState('All')
    const [resourceFilter, setResourceFilter] = useState('All')

    useEffect(() => {
        if (user?.id) {
            fetchHistory()
        }
    }, [user])

    const fetchHistory = async () => {
        try {
            setLoading(true)

            const response = await api.get(`/LearningProgress/user/${user.id}`)
            setHistory(response.data || [])
        } catch (err) {
            console.log(err)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (date) => {
        if (!date) return '-'

        return new Date(date).toLocaleString('tr-TR', {
            timeZone: 'Europe/Istanbul',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const getUsedResources = (item) => {
        const value = item.selectedPlatforms || item.SelectedPlatforms

        if (!value) return []
        if (Array.isArray(value)) return value

        try {
            const parsed = JSON.parse(value)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    }

    const isPersonalSkill = (item) => {
        const type = item.skillType || item.SkillType || ''
        const category = item.skillCategory || item.SkillCategory || ''

        return (
            type.toLowerCase() === 'personal' ||
            category.toLowerCase() === 'personal'
        )
    }

    const personalLevelToPercent = (level) => {
        const value = Number(level || 0)

        if (value <= 0) return 0
        if (value === 1) return 33
        if (value === 2) return 66
        return 100
    }

    const getSkillTypeValue = (item) => {
        return isPersonalSkill(item) ? 'Personal' : 'Technical'
    }

    const resourceOptions = [
        ...new Set(history.flatMap((item) => getUsedResources(item))),
    ]

    const filteredHistory = history.filter((item) => {
        const search = searchText.toLowerCase()

        const skillName = item.skillName || item.SkillName || ''
        const taskTitle = item.taskTitle || item.TaskTitle || ''
        const skillType = getSkillTypeValue(item)

        const matchesSearch =
            search === '' ||
            skillName.toLowerCase().includes(search) ||
            taskTitle.toLowerCase().includes(search)

        const matchesSkillType =
            skillTypeFilter === 'All' ||
            skillType === skillTypeFilter

        const usedResources = getUsedResources(item)

        const matchesResource =
            resourceFilter === 'All' ||
            usedResources.includes(resourceFilter)

        return matchesSearch && matchesSkillType && matchesResource
    })

    const clearFilters = () => {
        setSearchText('')
        setSkillTypeFilter('All')
        setResourceFilter('All')
    }

    if (loading) {
        return (
            <MainLayout>
                <LoadingSpinner />
            </MainLayout>
        )
    }

    return (
        <MainLayout
            title="Learning History"
            subtitle="Track your completed learning steps, projects, case studies and skill improvements."
        >
            {history.length > 0 && (
                <div className="modern-card mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h5 className="fw-bold mb-1">Filters</h5>
                            <div className="text-muted small">
                                Showing {filteredHistory.length} of {history.length} records
                            </div>
                        </div>

                        <button
                            className="btn btn-outline-secondary rounded-4"
                            onClick={clearFilters}
                        >
                            Clear Filters
                        </button>
                    </div>

                    <div className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label fw-bold">Search</label>

                            <input
                                type="text"
                                className="form-control rounded-4"
                                placeholder="Search skill or task..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label fw-bold">Skill Type</label>

                            <select
                                className="form-select rounded-4"
                                value={skillTypeFilter}
                                onChange={(e) => setSkillTypeFilter(e.target.value)}
                            >
                                <option value="All">All</option>
                                <option value="Technical">Technical / Domain</option>
                                <option value="Personal">Personal</option>
                            </select>
                        </div>

                        <div className="col-md-4">
                            <label className="form-label fw-bold">Resource</label>

                            <select
                                className="form-select rounded-4"
                                value={resourceFilter}
                                onChange={(e) => setResourceFilter(e.target.value)}
                            >
                                <option value="All">All</option>

                                {resourceOptions.map((platform) => (
                                    <option key={platform} value={platform}>
                                        {platform}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {history.length === 0 ? (
                <div className="modern-card">
                    <h3 className="fw-bold">No learning history found</h3>

                    <p className="text-muted mb-0">
                        Complete roadmap tasks to start building your learning history.
                    </p>
                </div>
            ) : filteredHistory.length === 0 ? (
                <div className="modern-card">
                    <h3 className="fw-bold">No matching history found</h3>

                    <p className="text-muted mb-0">
                        Try changing or clearing the filters.
                    </p>
                </div>
            ) : (
                <div className="row g-4">
                    {filteredHistory.map((item) => {
                        const usedResources = getUsedResources(item)
                        const personal = isPersonalSkill(item)

                        const id = item.id || item.Id
                        const skillName = item.skillName || item.SkillName || '-'
                        const taskTitle = item.taskTitle || item.TaskTitle || '-'

                        const fromLevel = Number(item.fromLevel ?? item.FromLevel ?? 0)
                        const toLevel = Number(item.toLevel ?? item.ToLevel ?? 0)

                        const completedAt = item.completedAt || item.CompletedAt

                        const isPracticeTaskCompleted =
                            item.isPracticeTaskCompleted ||
                            item.IsPracticeTaskCompleted

                        const isCaseStudyCompleted =
                            item.isCaseStudyCompleted ||
                            item.IsCaseStudyCompleted

                        const isProjectCompleted =
                            item.isProjectCompleted ||
                            item.IsProjectCompleted

                        const practiceTaskDescription =
                            item.practiceTaskDescription ||
                            item.PracticeTaskDescription

                        const caseStudyDescription =
                            item.caseStudyDescription ||
                            item.CaseStudyDescription

                        const projectDescription =
                            item.projectDescription ||
                            item.ProjectDescription

                        const reflectionText =
                            item.reflectionText ||
                            item.ReflectionText

                        return (
                            <div className="col-12" key={id}>
                                <div className="modern-card">
                                    <div className="d-flex justify-content-between align-items-start mb-4">
                                        <div>
                                            <span className="career-badge">
                                                {personal ? 'Personal' : 'Technical / Domain'}
                                            </span>

                                            <h3 className="fw-bold mb-2">
                                                {skillName}
                                            </h3>

                                            <div className="text-muted">
                                                {taskTitle}
                                            </div>
                                        </div>

                                        <div className="match-circle">
                                            {personal
                                                ? `${personalLevelToPercent(fromLevel)}→${personalLevelToPercent(toLevel)}%`
                                                : `${fromLevel}→${toLevel}`}
                                        </div>
                                    </div>

                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <div className="border rounded-4 p-3 h-100">
                                                <div className="fw-bold mb-2">
                                                    Learning Resources
                                                </div>

                                                {usedResources.length === 0 ? (
                                                    <div className="text-muted">
                                                        {personal
                                                            ? 'No resource required'
                                                            : 'No resource selected'}
                                                    </div>
                                                ) : (
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {usedResources.map((resource) => (
                                                            <span
                                                                key={resource}
                                                                className="badge text-bg-primary rounded-pill px-3 py-2"
                                                            >
                                                                {resource}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="border rounded-4 p-3 h-100">
                                                <div className="fw-bold mb-2">
                                                    Completion Date
                                                </div>

                                                <div className="text-muted">
                                                    {formatDate(completedAt)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div className="border rounded-4 p-3 h-100">
                                                <div className="fw-bold mb-2">
                                                    {personal ? 'Development Activities' : 'Practice Task'}
                                                </div>

                                                <div className="mb-2">
                                                    {isPracticeTaskCompleted
                                                        ? '✅ Completed'
                                                        : '❌ Not completed'}
                                                </div>

                                                {practiceTaskDescription && (
                                                    <div className="text-muted small">
                                                        {practiceTaskDescription}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div className="border rounded-4 p-3 h-100">
                                                <div className="fw-bold mb-2">
                                                    {personal ? 'Reflection Task' : 'Case Study'}
                                                </div>

                                                <div className="mb-2">
                                                    {isCaseStudyCompleted
                                                        ? '✅ Completed'
                                                        : '❌ Not completed'}
                                                </div>

                                                {caseStudyDescription && (
                                                    <div className="text-muted small">
                                                        {caseStudyDescription}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div className="border rounded-4 p-3 h-100">
                                                <div className="fw-bold mb-2">
                                                    {personal ? 'Personal Development Plan' : 'Project'}
                                                </div>

                                                <div className="mb-2">
                                                    {isProjectCompleted
                                                        ? '✅ Completed'
                                                        : '❌ Not completed'}
                                                </div>

                                                {projectDescription && (
                                                    <div className="text-muted small">
                                                        {projectDescription}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {reflectionText && (
                                            <div className="col-12">
                                                <div className="border rounded-4 p-3">
                                                    <div className="fw-bold mb-2">
                                                        Overall Reflection
                                                    </div>

                                                    <div className="text-muted">
                                                        {reflectionText}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </MainLayout>
    )
}

export default LearningHistory