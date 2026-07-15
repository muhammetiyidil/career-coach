import { useEffect, useState } from 'react'
import MainLayout from '../layout/MainLayout'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

function AdminCareers() {
    const [careers, setCareers] = useState([])
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [editingCareerId, setEditingCareerId] = useState(null)

    const [filters, setFilters] = useState({
        search: '',
        industry: '',
        careerCategory: '',
        demandLevel: '',
        workType: '',
    })

    const [form, setForm] = useState({
        title: '',
        description: '',
        industry: '',
        requiredEducation: '',
        demandLevel: '',
        averageSalary: '',
        workType: '',
        careerCategory: '',
    })

    useEffect(() => {
        fetchCareers()
    }, [])

    const fetchCareers = async () => {
        try {
            setLoading(true)

            const [careersResponse, departmentsResponse] = await Promise.all([
                api.get('/Careers'),
                api.get('/Departments'),
            ])

            setCareers(careersResponse.data || [])
            setDepartments(departmentsResponse.data || [])
        } catch (err) {
            console.log(err)
            setMessage('Careers could not be loaded.')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        })
    }

    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value,
        })
    }

    const clearFilters = () => {
        setFilters({
            search: '',
            industry: '',
            careerCategory: '',
            demandLevel: '',
            workType: '',
        })
    }

    const resetForm = () => {
        setForm({
            title: '',
            description: '',
            industry: '',
            requiredEducation: '',
            demandLevel: '',
            averageSalary: '',
            workType: '',
            careerCategory: '',
        })

        setEditingCareerId(null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const payload = {
                ...form,
                averageSalary: form.averageSalary ? Number(form.averageSalary) : null,
            }

            if (editingCareerId) {
                await api.put(`/Careers/${editingCareerId}`, payload)
                setMessage('Career updated successfully.')
            } else {
                await api.post('/Careers', payload)
                setMessage('Career added successfully.')
            }

            resetForm()
            await fetchCareers()
        } catch (err) {
            console.log(err)
            setMessage(
                editingCareerId
                    ? 'Career could not be updated.'
                    : 'Career could not be added.'
            )
        }
    }

    const editCareer = (career) => {
        setEditingCareerId(career.id || career.Id)

        setForm({
            title: career.title || career.Title || '',
            description: career.description || career.Description || '',
            industry: career.industry || career.Industry || '',
            requiredEducation: career.requiredEducation || career.RequiredEducation || '',
            demandLevel: career.demandLevel || career.DemandLevel || '',
            averageSalary: career.averageSalary || career.AverageSalary || '',
            workType: career.workType || career.WorkType || '',
            careerCategory: career.careerCategory || career.CareerCategory || '',
        })

        setMessage('')
    }

    const deleteCareer = async (id) => {
        try {
            await api.delete(`/Careers/${id}`)
            setMessage('Career deleted successfully.')

            if (editingCareerId === id) {
                resetForm()
            }

            await fetchCareers()
        } catch (err) {
            console.log(err)
            setMessage('Career could not be deleted.')
        }
    }

    const getUniqueValues = (fieldName, pascalFieldName) => {
        return [
            ...new Set(
                careers
                    .map((career) => career[fieldName] || career[pascalFieldName])
                    .filter(Boolean)
            ),
        ]
    }

    const filteredCareers = careers.filter((career) => {
        const id = career.id || career.Id
        const title = career.title || career.Title || ''
        const description = career.description || career.Description || ''
        const industry = career.industry || career.Industry || ''
        const requiredEducation =
            career.requiredEducation || career.RequiredEducation || ''
        const demandLevel = career.demandLevel || career.DemandLevel || ''
        const averageSalary = career.averageSalary || career.AverageSalary || ''
        const workType = career.workType || career.WorkType || ''
        const careerCategory = career.careerCategory || career.CareerCategory || ''

        const searchText = `
            ${id}
            ${title}
            ${description}
            ${industry}
            ${requiredEducation}
            ${demandLevel}
            ${averageSalary}
            ${workType}
            ${careerCategory}
        `.toLowerCase()

        const matchesSearch =
            filters.search.trim() === '' ||
            searchText.includes(filters.search.toLowerCase())

        const matchesIndustry =
            filters.industry === '' || industry === filters.industry

        const matchesCategory =
            filters.careerCategory === '' ||
            careerCategory === filters.careerCategory

        const matchesDemand =
            filters.demandLevel === '' || demandLevel === filters.demandLevel

        const matchesWorkType =
            filters.workType === '' || workType === filters.workType

        return (
            matchesSearch &&
            matchesIndustry &&
            matchesCategory &&
            matchesDemand &&
            matchesWorkType
        )
    })

    return (
        <MainLayout
            title="Manage Careers"
            subtitle="Add and manage career options for the recommendation system."
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
                            {editingCareerId ? 'Update Career' : 'Add New Career'}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Career Title</label>
                                <input
                                    name="title"
                                    className="form-control rounded-4"
                                    value={form.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Description</label>
                                <textarea
                                    name="description"
                                    className="form-control rounded-4"
                                    rows="4"
                                    value={form.description}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">Industry</label>
                                    <input
                                        name="industry"
                                        className="form-control rounded-4"
                                        value={form.industry}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">Career Category</label>
                                    <input
                                        name="careerCategory"
                                        className="form-control rounded-4"
                                        value={form.careerCategory}
                                        onChange={handleChange}
                                        placeholder="Technology, Design, Business..."
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">Required Department</label>
                                    <select
                                        name="requiredEducation"
                                        className="form-select rounded-4"
                                        value={form.requiredEducation}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Department</option>

                                        {departments.map((department) => {
                                            const id = department.id || department.Id
                                            const name = department.name || department.Name

                                            return (
                                                <option key={id} value={name}>
                                                    {name}
                                                </option>
                                            )
                                        })}
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">Demand Level</label>
                                    <select
                                        name="demandLevel"
                                        className="form-select rounded-4"
                                        value={form.demandLevel}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select</option>
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">Average Salary</label>
                                    <input
                                        name="averageSalary"
                                        type="number"
                                        className="form-control rounded-4"
                                        value={form.averageSalary}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">Work Type</label>
                                    <select
                                        name="workType"
                                        className="form-select rounded-4"
                                        value={form.workType}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select</option>
                                        <option value="Remote">Remote</option>
                                        <option value="Hybrid">Hybrid</option>
                                        <option value="On-site">On-site</option>
                                    </select>
                                </div>
                            </div>

                            <button className="btn btn-primary rounded-4 px-4 mt-4">
                                {editingCareerId ? 'Update Career' : 'Add Career'}
                            </button>

                            {editingCareerId && (
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary rounded-4 px-4 mt-4 ms-2"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </button>
                            )}
                        </form>
                    </div>
                </div>

                <div className="col-lg-7">
                    {loading ? (
                        <LoadingSpinner />
                    ) : (
                        <div className="modern-card">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h3 className="fw-bold mb-1">Careers List</h3>
                                    <div className="text-muted small">
                                        Showing {filteredCareers.length} of {careers.length} careers
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm rounded-4"
                                    onClick={clearFilters}
                                >
                                    Clear Filters
                                </button>
                            </div>

                            <div className="row g-3 mb-4">
                                <div className="col-md-12">
                                    <label className="form-label small text-muted">
                                        Search
                                    </label>
                                    <input
                                        name="search"
                                        className="form-control rounded-4"
                                        placeholder="Search by title, industry, category, department..."
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label small text-muted">
                                        Industry
                                    </label>
                                    <select
                                        name="industry"
                                        className="form-select rounded-4"
                                        value={filters.industry}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">All Industries</option>
                                        {getUniqueValues('industry', 'Industry').map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label small text-muted">
                                        Career Category
                                    </label>
                                    <select
                                        name="careerCategory"
                                        className="form-select rounded-4"
                                        value={filters.careerCategory}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">All Categories</option>
                                        {getUniqueValues('careerCategory', 'CareerCategory').map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label small text-muted">
                                        Demand Level
                                    </label>
                                    <select
                                        name="demandLevel"
                                        className="form-select rounded-4"
                                        value={filters.demandLevel}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">All Demand Levels</option>
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label small text-muted">
                                        Work Type
                                    </label>
                                    <select
                                        name="workType"
                                        className="form-select rounded-4"
                                        value={filters.workType}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">All Work Types</option>
                                        <option value="Remote">Remote</option>
                                        <option value="Hybrid">Hybrid</option>
                                        <option value="On-site">On-site</option>
                                    </select>
                                </div>
                            </div>

                            <div className="d-flex flex-column gap-3">
                                {filteredCareers.length > 0 ? (
                                    filteredCareers.map((career) => {
                                        const id = career.id || career.Id
                                        const title = career.title || career.Title || '-'
                                        const description =
                                            career.description || career.Description || '-'
                                        const industry = career.industry || career.Industry || '-'
                                        const category =
                                            career.careerCategory || career.CareerCategory || '-'
                                        const education =
                                            career.requiredEducation ||
                                            career.RequiredEducation ||
                                            '-'
                                        const salary =
                                            career.averageSalary ||
                                            career.AverageSalary ||
                                            '-'
                                        const workType =
                                            career.workType || career.WorkType || '-'
                                        const demand =
                                            career.demandLevel || career.DemandLevel || '-'

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

                                                        <h5 className="fw-bold mb-1">
                                                            {title}
                                                        </h5>

                                                        <p className="text-muted mb-2">
                                                            {description}
                                                        </p>
                                                    </div>

                                                    <div className="text-end">
                                                        <button
                                                            className="btn btn-outline-primary btn-sm rounded-4 me-2"
                                                            onClick={() => editCareer(career)}
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            className="btn btn-outline-danger btn-sm rounded-4"
                                                            onClick={() => deleteCareer(id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="row g-2 mt-2 small">
                                                    <div className="col-md-6">
                                                        <strong>Career Title:</strong> {title}
                                                    </div>

                                                    <div className="col-md-6">
                                                        <strong>Industry:</strong> {industry}
                                                    </div>

                                                    <div className="col-md-6">
                                                        <strong>Category:</strong> {category}
                                                    </div>

                                                    <div className="col-md-6">
                                                        <strong>Required Department:</strong> {education}
                                                    </div>

                                                    <div className="col-md-6">
                                                        <strong>Salary:</strong> {salary}
                                                    </div>

                                                    <div className="col-md-6">
                                                        <strong>Work Type:</strong> {workType}
                                                    </div>

                                                    <div className="col-md-6">
                                                        <strong>Demand:</strong>{' '}
                                                        <span className="badge text-bg-primary">
                                                            {demand}
                                                        </span>
                                                    </div>

                                                    <div className="col-md-12">
                                                        <strong>Description:</strong> {description}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-center text-muted py-4 border rounded-4 bg-white">
                                        No careers found.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    )
}

export default AdminCareers