import { useEffect, useState } from 'react'
import MainLayout from '../layout/MainLayout'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

function AdminJobPlatforms() {

    const [platforms, setPlatforms] = useState([])

    const [loading, setLoading] = useState(true)

    const [message, setMessage] = useState('')

    const [editingId, setEditingId] = useState(null)

    const emptyForm = {
        name: '',
        baseSearchUrl: '',
        isActive: true,
    }

    const [form, setForm] = useState(emptyForm)

    useEffect(() => {
        fetchPlatforms()
    }, [])

    const fetchPlatforms = async () => {
        try {
            setLoading(true)

            const response = await api.get('/JobPlatforms')

            setPlatforms(response.data || [])
        }
        catch (err) {
            console.log(err)

            setMessage('Platforms could not be loaded.')
        }
        finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {

        const { name, value, type, checked } = e.target

        setForm({
            ...form,
            [name]: type === 'checkbox'
                ? checked
                : value,
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
                isActive: form.isActive,
            }

            if (editingId) {

                await api.put(`/JobPlatforms/${editingId}`, payload)

                setMessage('Platform updated successfully.')
            }
            else {

                await api.post('/JobPlatforms', payload)

                setMessage('Platform added successfully.')
            }

            resetForm()

            await fetchPlatforms()
        }
        catch (err) {

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
            isActive:
                platform.isActive ??
                platform.IsActive ??
                true,
        })

        setMessage('')
    }

    const deletePlatform = async (id) => {

        try {

            await api.delete(`/JobPlatforms/${id}`)

            setMessage('Platform deleted successfully.')

            if (editingId === id) {
                resetForm()
            }

            await fetchPlatforms()
        }
        catch (err) {

            console.log(err)

            setMessage('Platform could not be deleted.')
        }
    }

    if (loading) {
        return (
            <MainLayout
                title="Admin Job Platforms"
                subtitle="Manage dynamic job search platforms."
            >
                <LoadingSpinner />
            </MainLayout>
        )
    }

    return (
        <MainLayout
            title="Admin Job Platforms"
            subtitle="Manage job platform links dynamically."
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
                                ? 'Update Job Platform'
                                : 'Add Job Platform'
                            }

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
                                    placeholder="LinkedIn"
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
                                    placeholder="https://www.linkedin.com/jobs/search/?keywords="
                                    required
                                />

                                <div className="text-muted small mt-1">
                                    Career title will automatically be added to the URL.
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
                                    : 'Add Platform'
                                }

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
                                    Job Platforms
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

                                    const isActive =
                                        platform.isActive ??
                                        platform.IsActive

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

                                                    <div className="text-muted small mb-2">
                                                        {baseSearchUrl}
                                                    </div>

                                                    <span
                                                        className={`badge ${isActive
                                                                ? 'text-bg-success'
                                                                : 'text-bg-secondary'
                                                            }`}
                                                    >
                                                        {isActive
                                                            ? 'Active'
                                                            : 'Passive'
                                                        }
                                                    </span>

                                                </div>

                                                <div className="text-end">

                                                    <button
                                                        className="btn btn-outline-primary btn-sm rounded-4 me-2"
                                                        onClick={() => editPlatform(platform)}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="btn btn-outline-danger btn-sm rounded-4"
                                                        onClick={() => deletePlatform(id)}
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
                                    No job platforms found.
                                </div>

                            )}

                        </div>

                    </div>

                </div>

            </div>

        </MainLayout>
    )
}

export default AdminJobPlatforms