import { useEffect, useState } from 'react'
import MainLayout from '../layout/MainLayout'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

function AdminSkillCategories() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [editingCategoryId, setEditingCategoryId] = useState(null)

    const emptyForm = {
        name: '',
        skillType: 'Technical',

        practiceTask01: '',
        practiceTask12: '',
        practiceTask23: '',
        practiceTask34: '',
        practiceTask45: '',

        caseStudy01: '',
        caseStudy12: '',
        caseStudy23: '',
        caseStudy34: '',
        caseStudy45: '',

        projectSuggestion01: '',
        projectSuggestion12: '',
        projectSuggestion23: '',
        projectSuggestion34: '',
        projectSuggestion45: '',

        projectDescription01: '',
        projectDescription12: '',
        projectDescription23: '',
        projectDescription34: '',
        projectDescription45: '',
    }

    const [form, setForm] = useState(emptyForm)

    const [filters, setFilters] = useState({
        search: '',
    })

    const levelSteps = [
        { key: '01', label: 'Level 0 → 1', projectOptional: true },
        { key: '12', label: 'Level 1 → 2', projectOptional: true },
        { key: '23', label: 'Level 2 → 3', projectOptional: false },
        { key: '34', label: 'Level 3 → 4', projectOptional: false },
        { key: '45', label: 'Level 4 → 5', projectOptional: false },
    ]

    useEffect(() => {
        fetchData()
    }, [])

    const getValue = (obj, camel, pascal) => {
        return obj?.[camel] ?? obj?.[pascal] ?? ''
    }

    const fetchData = async () => {
        try {
            setLoading(true)

            const categoryResponse = await api.get('/SkillCategories')

            const technicalCategories = (categoryResponse.data || []).filter((category) => {
                const type = category.skillType || category.SkillType || ''
                return type === 'Technical'
            })

            setCategories(technicalCategories)
        } catch (err) {
            console.log(err)
            setMessage('Categories could not be loaded.')
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
        })
    }

    const resetForm = () => {
        setForm(emptyForm)
        setEditingCategoryId(null)
    }

    const buildPayload = () => ({
        name: form.name,
        skillType: 'Technical',

        practiceTask01: form.practiceTask01,
        practiceTask12: form.practiceTask12,
        practiceTask23: form.practiceTask23,
        practiceTask34: form.practiceTask34,
        practiceTask45: form.practiceTask45,

        caseStudy01: form.caseStudy01,
        caseStudy12: form.caseStudy12,
        caseStudy23: form.caseStudy23,
        caseStudy34: form.caseStudy34,
        caseStudy45: form.caseStudy45,

        projectSuggestion01: form.projectSuggestion01,
        projectSuggestion12: form.projectSuggestion12,
        projectSuggestion23: form.projectSuggestion23,
        projectSuggestion34: form.projectSuggestion34,
        projectSuggestion45: form.projectSuggestion45,

        projectDescription01: form.projectDescription01,
        projectDescription12: form.projectDescription12,
        projectDescription23: form.projectDescription23,
        projectDescription34: form.projectDescription34,
        projectDescription45: form.projectDescription45,
    })

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const payload = buildPayload()

            if (editingCategoryId) {
                await api.put(`/SkillCategories/${editingCategoryId}`, payload)
                setMessage('Category updated successfully.')
            } else {
                await api.post('/SkillCategories', payload)
                setMessage('Category added successfully.')
            }

            resetForm()
            await fetchData()
        } catch (err) {
            console.log(err)
            setMessage(
                err.response?.data ||
                (editingCategoryId
                    ? 'Category could not be updated.'
                    : 'Category could not be added.')
            )
        }
    }

    const editCategory = (category) => {
        setEditingCategoryId(category.id || category.Id)

        setForm({
            name: category.name || category.Name || '',
            skillType: 'Technical',

            practiceTask01: getValue(category, 'practiceTask01', 'PracticeTask01'),
            practiceTask12: getValue(category, 'practiceTask12', 'PracticeTask12'),
            practiceTask23: getValue(category, 'practiceTask23', 'PracticeTask23'),
            practiceTask34: getValue(category, 'practiceTask34', 'PracticeTask34'),
            practiceTask45: getValue(category, 'practiceTask45', 'PracticeTask45'),

            caseStudy01: getValue(category, 'caseStudy01', 'CaseStudy01'),
            caseStudy12: getValue(category, 'caseStudy12', 'CaseStudy12'),
            caseStudy23: getValue(category, 'caseStudy23', 'CaseStudy23'),
            caseStudy34: getValue(category, 'caseStudy34', 'CaseStudy34'),
            caseStudy45: getValue(category, 'caseStudy45', 'CaseStudy45'),

            projectSuggestion01: getValue(category, 'projectSuggestion01', 'ProjectSuggestion01'),
            projectSuggestion12: getValue(category, 'projectSuggestion12', 'ProjectSuggestion12'),
            projectSuggestion23: getValue(category, 'projectSuggestion23', 'ProjectSuggestion23'),
            projectSuggestion34: getValue(category, 'projectSuggestion34', 'ProjectSuggestion34'),
            projectSuggestion45: getValue(category, 'projectSuggestion45', 'ProjectSuggestion45'),

            projectDescription01: getValue(category, 'projectDescription01', 'ProjectDescription01'),
            projectDescription12: getValue(category, 'projectDescription12', 'ProjectDescription12'),
            projectDescription23: getValue(category, 'projectDescription23', 'ProjectDescription23'),
            projectDescription34: getValue(category, 'projectDescription34', 'ProjectDescription34'),
            projectDescription45: getValue(category, 'projectDescription45', 'ProjectDescription45'),
        })

        setMessage('')
    }

    const deleteCategory = async (id) => {
        try {
            await api.delete(`/SkillCategories/${id}`)
            setMessage('Category deleted successfully.')

            if (editingCategoryId === id) {
                resetForm()
            }

            await fetchData()
        } catch (err) {
            console.log(err)
            setMessage('Category could not be deleted.')
        }
    }

    const getAllTemplateText = (category) => {
        const values = []

        levelSteps.forEach((step) => {
            values.push(getValue(category, `practiceTask${step.key}`, `PracticeTask${step.key}`))
            values.push(getValue(category, `caseStudy${step.key}`, `CaseStudy${step.key}`))
            values.push(getValue(category, `projectSuggestion${step.key}`, `ProjectSuggestion${step.key}`))
            values.push(getValue(category, `projectDescription${step.key}`, `ProjectDescription${step.key}`))
        })

        return values.join(' ')
    }

    const filteredCategories = categories.filter((category) => {
        const id = category.id || category.Id
        const name = category.name || category.Name || ''
        const skillType = category.skillType || category.SkillType || ''
        const allTemplates = getAllTemplateText(category)

        const searchText = `
            ${id}
            ${name}
            ${skillType}
            ${allTemplates}
        `.toLowerCase()

        return (
            filters.search.trim() === '' ||
            searchText.includes(filters.search.toLowerCase())
        )
    })

    if (loading) {
        return (
            <MainLayout
                title="Skill Categories"
                subtitle="Manage technical skill categories and level-based task templates."
            >
                <LoadingSpinner />
            </MainLayout>
        )
    }

    return (
        <MainLayout
            title="Skill Categories"
            subtitle="Manage level-based category templates for technical skills."
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
                            {editingCategoryId ? 'Update Technical Category' : 'Add Technical Category'}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Category Name</label>
                                <input
                                    name="name"
                                    className="form-control rounded-4"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Web Development, Database, Cyber Security..."
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Skill Type</label>
                                <input
                                    name="skillType"
                                    className="form-control rounded-4"
                                    value="Technical / Domain"
                                    readOnly
                                />

                                <div className="text-muted small mt-1">
                                    Category templates are used only for technical skills.
                                </div>
                            </div>

                            <div className="alert alert-light border rounded-4 small">
                                Write general templates for each level range. Project is optional for Level 0 → 1 and Level 1 → 2.
                            </div>

                            {levelSteps.map((step) => (
                                <div key={step.key} className="border rounded-4 p-3 mb-3 bg-light">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="fw-bold mb-0">{step.label}</h5>

                                        {step.projectOptional ? (
                                            <span className="badge text-bg-warning">
                                                Project Optional
                                            </span>
                                        ) : (
                                            <span className="badge text-bg-primary">
                                                Project Required
                                            </span>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Practice Task</label>
                                        <textarea
                                            name={`practiceTask${step.key}`}
                                            className="form-control rounded-4"
                                            rows="2"
                                            value={form[`practiceTask${step.key}`]}
                                            onChange={handleChange}
                                            placeholder={`Practice task for ${step.label}`}
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Case Study</label>
                                        <textarea
                                            name={`caseStudy${step.key}`}
                                            className="form-control rounded-4"
                                            rows="2"
                                            value={form[`caseStudy${step.key}`]}
                                            onChange={handleChange}
                                            placeholder={`Case study for ${step.label}`}
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">
                                            Project Suggestion {step.projectOptional && '(Optional)'}
                                        </label>
                                        <textarea
                                            name={`projectSuggestion${step.key}`}
                                            className="form-control rounded-4"
                                            rows="2"
                                            value={form[`projectSuggestion${step.key}`]}
                                            onChange={handleChange}
                                            placeholder={`Project suggestion for ${step.label}`}
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            Project Description {step.projectOptional && '(Optional)'}
                                        </label>
                                        <textarea
                                            name={`projectDescription${step.key}`}
                                            className="form-control rounded-4"
                                            rows="2"
                                            value={form[`projectDescription${step.key}`]}
                                            onChange={handleChange}
                                            placeholder={`Project description for ${step.label}`}
                                        />
                                    </div>
                                </div>
                            ))}

                            <button className="btn btn-primary rounded-4 px-4">
                                {editingCategoryId ? 'Update Category' : 'Add Category'}
                            </button>

                            {editingCategoryId && (
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
                                <h3 className="fw-bold mb-1">Technical Category List</h3>
                                <div className="text-muted small">
                                    Showing {filteredCategories.length} of {categories.length} categories
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
                                    value={filters.search}
                                    onChange={handleFilterChange}
                                    placeholder="Search category or templates..."
                                />
                            </div>
                        </div>

                        <div className="d-flex flex-column gap-3">
                            {filteredCategories.length > 0 ? (
                                filteredCategories.map((category) => {
                                    const id = category.id || category.Id
                                    const name = category.name || category.Name || '-'
                                    const skillType = category.skillType || category.SkillType || '-'

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
                                                        {name}
                                                    </h5>

                                                    <span className="badge text-bg-primary">
                                                        {skillType}
                                                    </span>
                                                </div>

                                                <div className="text-end">
                                                    <button
                                                        className="btn btn-outline-primary btn-sm rounded-4 me-2"
                                                        onClick={() => editCategory(category)}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="btn btn-outline-danger btn-sm rounded-4"
                                                        onClick={() => deleteCategory(id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-3 small">
                                                {levelSteps.map((step) => (
                                                    <div key={step.key} className="border-top pt-2 mt-2">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <strong>{step.label}</strong>

                                                            {step.projectOptional ? (
                                                                <span className="badge text-bg-warning">
                                                                    Project Optional
                                                                </span>
                                                            ) : (
                                                                <span className="badge text-bg-primary">
                                                                    Project Required
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="text-muted mt-1">
                                                            <div>
                                                                <strong>Practice:</strong>{' '}
                                                                {getValue(category, `practiceTask${step.key}`, `PracticeTask${step.key}`) || '-'}
                                                            </div>

                                                            <div>
                                                                <strong>Case:</strong>{' '}
                                                                {getValue(category, `caseStudy${step.key}`, `CaseStudy${step.key}`) || '-'}
                                                            </div>

                                                            <div>
                                                                <strong>Project:</strong>{' '}
                                                                {getValue(category, `projectSuggestion${step.key}`, `ProjectSuggestion${step.key}`) || '-'}
                                                            </div>

                                                            <div>
                                                                <strong>Description:</strong>{' '}
                                                                {getValue(category, `projectDescription${step.key}`, `ProjectDescription${step.key}`) || '-'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="text-center text-muted py-4 border rounded-4 bg-white">
                                    No technical categories found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}

export default AdminSkillCategories