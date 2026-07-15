import { useEffect, useState } from 'react'
import MainLayout from '../layout/MainLayout'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

function AdminLearningPlatforms() {
    const [platforms, setPlatforms] = useState([])
    const [roadmapStates, setRoadmapStates] = useState([])

    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [selectedAnalyticsPlatform, setSelectedAnalyticsPlatform] = useState(null)

    const emptyForm = {
        name: '',
        baseSearchUrl: '',
        querySuffix: '',
        isActive: true,
    }

    const [form, setForm] = useState(emptyForm)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)

            const [platformResponse, roadmapResponse] = await Promise.all([
                api.get('/LearningPlatforms'),
                api.get('/RoadmapState'),
            ])

            setPlatforms(platformResponse.data || [])
            setRoadmapStates(roadmapResponse.data || [])
        } catch (err) {
            console.log(err)
            setMessage('Platforms could not be loaded.')
        } finally {
            setLoading(false)
        }
    }

    const parseSelectedPlatforms = (value) => {
        if (!value) return []

        if (Array.isArray(value)) {
            return value
        }

        try {
            const parsed = JSON.parse(value)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    }

    const getPlatformUsageCount = (platformName) => {
        return roadmapStates.filter((state) => {
            const selectedPlatforms = parseSelectedPlatforms(
                state.selectedPlatforms || state.SelectedPlatforms
            )

            return [...new Set(selectedPlatforms)].includes(platformName)
        }).length
    }

    const getTotalUsageCount = () => {
        return roadmapStates.reduce((total, state) => {
            const selectedPlatforms = parseSelectedPlatforms(
                state.selectedPlatforms || state.SelectedPlatforms
            )

            return total + [...new Set(selectedPlatforms)].length
        }, 0)
    }

    const getUsagePercentage = (platformName) => {
        const total = getTotalUsageCount()

        if (total === 0) return 0

        return Math.round((getPlatformUsageCount(platformName) / total) * 100)
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target

        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value,
        })
    }

    const resetForm = () => {
        setForm(emptyForm)
        setEditingId(null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const payload = {
                name: form.name,
                baseSearchUrl: form.baseSearchUrl,
                querySuffix: form.querySuffix,
                isActive: form.isActive,
            }

            if (editingId) {
                await api.put(`/LearningPlatforms/${editingId}`, payload)
                setMessage('Platform updated successfully.')
            } else {
                await api.post('/LearningPlatforms', payload)
                setMessage('Platform added successfully.')
            }

            resetForm()
            await fetchData()
        } catch (err) {
            console.log(err)

            setMessage(
                err.response?.data ||
                'Operation failed.'
            )
        }
    }

    const editPlatform = (platform) => {
        setEditingId(platform.id || platform.Id)

        setForm({
            name: platform.name || platform.Name || '',
            baseSearchUrl:
                platform.baseSearchUrl ||
                platform.BaseSearchUrl ||
                '',
            querySuffix:
                platform.querySuffix ||
                platform.QuerySuffix ||
                '',
            isActive:
                platform.isActive ??
                platform.IsActive ??
                true,
        })

        setMessage('')
    }

    const deletePlatform = async (id) => {
        try {
            await api.delete(`/LearningPlatforms/${id}`)

            setMessage('Platform deleted successfully.')

            if (editingId === id) {
                resetForm()
            }

            await fetchData()
        } catch (err) {
            console.log(err)
            setMessage('Platform could not be deleted.')
        }
    }

    if (loading) {
        return (
            <MainLayout
                title="Admin Learning Platforms"
                subtitle="Manage dynamic learning platforms."
            >
                <LoadingSpinner />
            </MainLayout>
        )
    }

    return (
        <MainLayout
            title="Admin Learning Platforms"
            subtitle="Manage learning platform links dynamically."
        >
            {message && (
                <div className="alert alert-info rounded-4 border-0">
                    {message}
                </div>
            )}

            <div className="row g-4">
                <div className="col-lg-5">
                    <div className="modern-card">
                        <h3 className="fw-bold mb-4">
                            {editingId
                                ? 'Update Learning Platform'
                                : 'Add Learning Platform'}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">
                                    Platform Name
                                </label>

                                <input
                                    name="name"
                                    className="form-control rounded-4"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="YouTube"
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">
                                    Base Search URL
                                </label>

                                <input
                                    name="baseSearchUrl"
                                    className="form-control rounded-4"
                                    value={form.baseSearchUrl}
                                    onChange={handleChange}
                                    placeholder="https://www.youtube.com/results?search_query="
                                    required
                                />

                                <div className="text-muted small mt-1">
                                    Skill name and level will automatically be added to the URL.
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">
                                    Query Suffix
                                </label>

                                <input
                                    name="querySuffix"
                                    className="form-control rounded-4"
                                    value={form.querySuffix}
                                    onChange={handleChange}
                                    placeholder="tutorial"
                                />

                                <div className="text-muted small mt-1">
                                    Example: tutorial, course, training
                                </div>
                            </div>

                            <div className="form-check mb-4">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="isActive"
                                    name="isActive"
                                    checked={form.isActive}
                                    onChange={handleChange}
                                />

                                <label
                                    htmlFor="isActive"
                                    className="form-check-label"
                                >
                                    Active
                                </label>
                            </div>

                            <button className="btn btn-primary rounded-4 px-4">
                                {editingId
                                    ? 'Update Platform'
                                    : 'Add Platform'}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary rounded-4 px-4 ms-2"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </button>
                            )}
                        </form>
                    </div>
                </div>

                <div className="col-lg-7">
                    <div className="modern-card">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h3 className="fw-bold mb-1">
                                    Learning Platforms
                                </h3>

                                <div className="text-muted small">
                                    Total: {platforms.length}
                                </div>
                            </div>
                        </div>

                        <div className="d-flex flex-column gap-3">
                            {platforms.length > 0 ? (
                                platforms.map((platform) => {
                                    const id = platform.id || platform.Id

                                    const name =
                                        platform.name ||
                                        platform.Name ||
                                        '-'

                                    const baseSearchUrl =
                                        platform.baseSearchUrl ||
                                        platform.BaseSearchUrl ||
                                        '-'

                                    const querySuffix =
                                        platform.querySuffix ||
                                        platform.QuerySuffix ||
                                        '-'

                                    const isActive =
                                        platform.isActive ??
                                        platform.IsActive

                                    const usageCount = getPlatformUsageCount(name)
                                    const usagePercentage = getUsagePercentage(name)

                                    return (
                                        <div
                                            key={id}
                                            className="border rounded-4 p-3 bg-white"
                                        >
                                            <div className="d-flex justify-content-between align-items-start gap-3">
                                                <div>
                                                    <div className="small text-muted mb-1">
                                                        ID: {id}
                                                    </div>

                                                    <h5 className="fw-bold mb-2">
                                                        {name}
                                                    </h5>

                                                    <div className="text-muted small mb-1">
                                                        {baseSearchUrl}
                                                    </div>

                                                    <div className="text-muted small mb-2">
                                                        Query Suffix: {querySuffix}
                                                    </div>

                                                    <div className="d-flex flex-wrap gap-2">
                                                        <span
                                                            className={`badge ${isActive
                                                                    ? 'text-bg-success'
                                                                    : 'text-bg-secondary'
                                                                }`}
                                                        >
                                                            {isActive
                                                                ? 'Active'
                                                                : 'Passive'}
                                                        </span>

                                                        <span className="badge text-bg-primary">
                                                            Usage Count: {usageCount}
                                                        </span>

                                                        <span className="badge text-bg-light border">
                                                            Usage Share: {usagePercentage}%
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-end">
                                                    <button
                                                        className="btn btn-outline-info btn-sm rounded-4 me-2"
                                                        onClick={() =>
                                                            setSelectedAnalyticsPlatform(platform)
                                                        }
                                                    >
                                                        View Analytics
                                                    </button>

                                                    <button
                                                        className="btn btn-outline-primary btn-sm rounded-4 me-2"
                                                        onClick={() =>
                                                            editPlatform(platform)
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="btn btn-outline-danger btn-sm rounded-4"
                                                        onClick={() =>
                                                            deletePlatform(id)
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="text-center text-muted py-4 border rounded-4 bg-white">
                                    No learning platforms found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {selectedAnalyticsPlatform && (
                <AnalyticsModal
                    platform={selectedAnalyticsPlatform}
                    usageCount={getPlatformUsageCount(
                        selectedAnalyticsPlatform.name ||
                        selectedAnalyticsPlatform.Name
                    )}
                    usagePercentage={getUsagePercentage(
                        selectedAnalyticsPlatform.name ||
                        selectedAnalyticsPlatform.Name
                    )}
                    totalUsage={getTotalUsageCount()}
                    onClose={() => setSelectedAnalyticsPlatform(null)}
                />
            )}
        </MainLayout>
    )
}

function AnalyticsModal({
    platform,
    usageCount,
    usagePercentage,
    totalUsage,
    onClose,
}) {
    const name = platform.name || platform.Name || '-'

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{
                background: 'rgba(15, 23, 42, 0.55)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
            }}
        >
            <div
                className="bg-white rounded-4 shadow-lg p-4"
                style={{
                    width: '520px',
                    maxWidth: '100%',
                }}
            >
                <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                        <h4 className="fw-bold mb-1">
                            {name} Analytics
                        </h4>

                        <div className="text-muted small">
                            Platform usage based on users’ selected roadmap platforms.
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm rounded-4"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>

                <div className="row g-3 mb-4">
                    <div className="col-md-4">
                        <div className="border rounded-4 p-3 text-center">
                            <div className="text-muted small mb-1">
                                Usage
                            </div>

                            <div className="fw-bold fs-3">
                                {usageCount}
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="border rounded-4 p-3 text-center">
                            <div className="text-muted small mb-1">
                                Share
                            </div>

                            <div className="fw-bold fs-3">
                                {usagePercentage}%
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="border rounded-4 p-3 text-center">
                            <div className="text-muted small mb-1">
                                Total Usage
                            </div>

                            <div className="fw-bold fs-3">
                                {totalUsage}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-2 fw-bold">
                    Usage Share
                </div>

                <div
                    className="progress rounded-4"
                    style={{ height: '18px' }}
                >
                    <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${usagePercentage}%` }}
                    >
                        {usagePercentage}%
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminLearningPlatforms