import { useEffect, useState } from 'react'
import MainLayout from '../layout/MainLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../services/api'

function AdminLearningProgress() {
    const [progress, setProgress] = useState([])
    const [platforms, setPlatforms] = useState([])
    const [loading, setLoading] = useState(true)

    const [search, setSearch] = useState('')
    const [userFilter, setUserFilter] = useState('All')
    const [skillTypeFilter, setSkillTypeFilter] = useState('All')
    const [platformFilter, setPlatformFilter] = useState('All')
    const [statusFilter, setStatusFilter] = useState('All')
    const [sortOrder, setSortOrder] = useState('Newest')

    useEffect(() => {
        fetchProgress()
    }, [])

    const fetchProgress = async () => {
        try {
            setLoading(true)

            const [progressResponse, platformResponse] = await Promise.all([
                api.get('/LearningProgress'),
                api.get('/LearningPlatforms/active'),
            ])

            setProgress(progressResponse.data || [])
            setPlatforms(platformResponse.data || [])
        } catch (err) {
            console.log(err)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (date) => {
        if (!date) return '-'
        return new Date(date).toLocaleString()
    }

    const parseSelectedPlatforms = (value) => {
        if (!value) return []

        if (Array.isArray(value)) return value

        try {
            const parsed = JSON.parse(value)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    }

    const getPlatforms = (item) => {
        const value =
            item.selectedPlatforms ||
            item.SelectedPlatforms ||
            item.learningPlatforms ||
            item.LearningPlatforms

        return parseSelectedPlatforms(value)
    }

    const isPersonalSkill = (item) => {
        const skillType = item.skillType || item.SkillType || ''
        const skillCategory = item.skillCategory || item.SkillCategory || ''

        return (
            skillType.toLowerCase() === 'personal' ||
            skillCategory.toLowerCase() === 'personal'
        )
    }

    const isCompletedStatus = (item) => {
        return (
            item.isCompleted ||
            item.IsCompleted ||
            item.isPracticeTaskCompleted ||
            item.IsPracticeTaskCompleted ||
            item.isCaseStudyCompleted ||
            item.IsCaseStudyCompleted ||
            item.isProjectCompleted ||
            item.IsProjectCompleted
        )
    }

    const getBooleanValue = (item, camelName, pascalName) => {
        return item[camelName] === true || item[pascalName] === true
    }

    const users = [
        ...new Set(
            progress
                .map((item) => item.userName || item.UserName)
                .filter(Boolean)
        ),
    ]

    const skillTypes = [
        ...new Set(
            progress
                .map((item) => item.skillType || item.SkillType)
                .filter(Boolean)
        ),
    ]

    const platformOptions = [
        ...new Set([
            ...platforms
                .map((platform) => platform.name || platform.Name)
                .filter(Boolean),

            ...progress
                .flatMap((item) => getPlatforms(item))
                .filter(Boolean),
        ]),
    ]

    const filteredProgress = progress
        .filter((item) => {
            const platforms = getPlatforms(item)

            const text = `
                ${item.userName || item.UserName || ''}
                ${item.userEmail || item.UserEmail || ''}
                ${item.skillName || item.SkillName || ''}
                ${item.skillType || item.SkillType || ''}
                ${item.skillCategory || item.SkillCategory || ''}
                ${item.taskTitle || item.TaskTitle || ''}
            `.toLowerCase()

            const matchesSearch = text.includes(search.toLowerCase())

            const matchesUser =
                userFilter === 'All' ||
                item.userName === userFilter ||
                item.UserName === userFilter

            const itemSkillType = item.skillType || item.SkillType || ''

            const matchesSkillType =
                skillTypeFilter === 'All' || itemSkillType === skillTypeFilter

            const matchesPlatform =
                platformFilter === 'All' ||
                platforms.includes(platformFilter) ||
                (platformFilter === 'No Platform' && platforms.length === 0)

            const matchesStatus =
                statusFilter === 'All' ||
                (statusFilter === 'Completed' && isCompletedStatus(item)) ||
                (statusFilter === 'Not Completed' && !isCompletedStatus(item))

            return (
                matchesSearch &&
                matchesUser &&
                matchesSkillType &&
                matchesPlatform &&
                matchesStatus
            )
        })
        .sort((a, b) => {
            const dateA = new Date(a.completedAt || a.CompletedAt || 0)
            const dateB = new Date(b.completedAt || b.CompletedAt || 0)

            if (sortOrder === 'Newest') return dateB - dateA
            return dateA - dateB
        })

    const clearFilters = () => {
        setSearch('')
        setUserFilter('All')
        setSkillTypeFilter('All')
        setPlatformFilter('All')
        setStatusFilter('All')
        setSortOrder('Newest')
    }

    const renderStatusBadge = (completed, completedText, pendingText = '-') => {
        if (completed) {
            return (
                <span className="badge text-bg-success">
                    {completedText}
                </span>
            )
        }

        return (
            <span className="badge text-bg-secondary">
                {pendingText}
            </span>
        )
    }

    return (
        <MainLayout
            title="Admin Learning Progress"
            subtitle="View users’ completed learning activities, selected platforms, task progress, reflections and level changes."
        >
            {loading ? (
                <LoadingSpinner />
            ) : (
                <div className="modern-card">
                    <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
                        <div>
                            <h3 className="fw-bold mb-1">
                                Learning Progress Records
                            </h3>

                            <p className="text-muted mb-0">
                                Total records: {filteredProgress.length}
                            </p>
                        </div>

                        <input
                            type="text"
                            className="form-control rounded-4"
                            style={{ maxWidth: '320px' }}
                            placeholder="Search user, skill, category..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-md-2">
                            <label className="form-label small fw-semibold">
                                User
                            </label>

                            <select
                                className="form-select rounded-4"
                                value={userFilter}
                                onChange={(e) => setUserFilter(e.target.value)}
                            >
                                <option value="All">All Users</option>

                                {users.map((user) => (
                                    <option key={user} value={user}>
                                        {user}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-2">
                            <label className="form-label small fw-semibold">
                                Skill Type
                            </label>

                            <select
                                className="form-select rounded-4"
                                value={skillTypeFilter}
                                onChange={(e) =>
                                    setSkillTypeFilter(e.target.value)
                                }
                            >
                                <option value="All">All Types</option>

                                    {skillTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type === 'Technical'
                                                ? 'Technical / Domain'
                                                : type}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div className="col-md-2">
                            <label className="form-label small fw-semibold">
                                Platform
                            </label>

                            <select
                                className="form-select rounded-4"
                                value={platformFilter}
                                onChange={(e) =>
                                    setPlatformFilter(e.target.value)
                                }
                            >
                                <option value="All">All Platforms</option>

                                {platformOptions.map((platform) => (
                                    <option key={platform} value={platform}>
                                        {platform}
                                    </option>
                                ))}

                                <option value="No Platform">No Platform</option>
                            </select>
                        </div>

                        <div className="col-md-2">
                            <label className="form-label small fw-semibold">
                                Status
                            </label>

                            <select
                                className="form-select rounded-4"
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value)
                                }
                            >
                                <option value="All">All Status</option>
                                <option value="Completed">Completed</option>
                                <option value="Not Completed">
                                    Not Completed
                                </option>
                            </select>
                        </div>

                        <div className="col-md-2">
                            <label className="form-label small fw-semibold">
                                Date
                            </label>

                            <select
                                className="form-select rounded-4"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                            >
                                <option value="Newest">Newest First</option>
                                <option value="Oldest">Oldest First</option>
                            </select>
                        </div>

                        <div className="col-md-2 d-flex align-items-end">
                            <button
                                type="button"
                                className="btn btn-outline-secondary rounded-4 w-100"
                                onClick={clearFilters}
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    {filteredProgress.length === 0 ? (
                        <div className="alert alert-light border rounded-4">
                            No learning progress record found.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table align-middle">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Skill</th>
                                        <th>Level</th>
                                        <th>Platforms</th>
                                        <th>Activity / Practice</th>
                                        <th>Reflection / Case Study</th>
                                        <th>Plan / Project</th>
                                        <th>Completed At</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredProgress.map((item) => {
                                        const platforms = getPlatforms(item)
                                        const personal = isPersonalSkill(item)

                                        const practiceCompleted = getBooleanValue(
                                            item,
                                            'isPracticeTaskCompleted',
                                            'IsPracticeTaskCompleted'
                                        )

                                        const caseStudyCompleted = getBooleanValue(
                                            item,
                                            'isCaseStudyCompleted',
                                            'IsCaseStudyCompleted'
                                        )

                                        const projectCompleted = getBooleanValue(
                                            item,
                                            'isProjectCompleted',
                                            'IsProjectCompleted'
                                        )

                                        const userName = item.userName || item.UserName || '-'
                                        const userEmail = item.userEmail || item.UserEmail || '-'
                                        const skillName = item.skillName || item.SkillName || '-'
                                        const skillType = item.skillType || item.SkillType || '-'
                                        const skillCategory = item.skillCategory || item.SkillCategory || '-'
                                        const fromLevel = item.fromLevel ?? item.FromLevel ?? 0
                                        const toLevel = item.toLevel ?? item.ToLevel ?? 0
                                        const completedAt = item.completedAt || item.CompletedAt

                                        return (
                                            <tr key={item.id || item.Id}>
                                                <td>
                                                    <div className="fw-bold">
                                                        {userName}
                                                    </div>

                                                    <div className="text-muted small">
                                                        {userEmail}
                                                    </div>
                                                </td>

                                                <td>
                                                    <div className="fw-bold">
                                                        {skillName}
                                                    </div>

                                                    <div className="text-muted small">
                                                        {skillType === 'Personal'
                                                            ? 'Personal'
                                                            : 'Technical / Domain'}
                                                    </div>
                                                </td>

                                                <td>
                                                    {personal ? (
                                                        <span className="badge text-bg-light border rounded-pill px-3 py-2">
                                                            No Level
                                                        </span>
                                                    ) : (
                                                        <span className="badge text-bg-primary rounded-pill px-3 py-2">
                                                            {fromLevel} → {toLevel}
                                                        </span>
                                                    )}
                                                </td>

                                                <td>
                                                    {platforms.length === 0 ? (
                                                        <span className="text-muted small">
                                                            No platform
                                                        </span>
                                                    ) : (
                                                        <div className="d-flex flex-wrap gap-1">
                                                            {platforms.map((platform) => (
                                                                <span
                                                                    key={platform}
                                                                    className="badge text-bg-info rounded-pill"
                                                                >
                                                                    {platform}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>

                                                <td>
                                                    {renderStatusBadge(
                                                        practiceCompleted,
                                                        personal ? 'Activity Done' : 'Completed'
                                                    )}
                                                </td>

                                                <td>
                                                    {renderStatusBadge(
                                                        caseStudyCompleted,
                                                        personal ? 'Reflection Done' : 'Completed'
                                                    )}
                                                </td>

                                                <td>
                                                    {renderStatusBadge(
                                                        projectCompleted,
                                                        personal ? 'Plan Done' : 'Completed',
                                                        personal ? 'Plan Pending' : 'Optional'
                                                    )}
                                                </td>

                                                <td>
                                                    <span className="text-muted small">
                                                        {formatDate(completedAt)}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </MainLayout>
    )
}

export default AdminLearningProgress