import { useEffect, useState } from 'react'
import MainLayout from '../layout/MainLayout'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

function AdminSkills() {
    const [skills, setSkills] = useState([])
    const [skillTypes, setSkillTypes] = useState([])
    const [skillCategories, setSkillCategories] = useState([])

    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [editingSkillId, setEditingSkillId] = useState(null)

    const [filters, setFilters] = useState({
        search: '',
        skillType: '',
        category: '',
    })

    const emptyForm = {
        name: '',
        skillType: '',
        category: '',
        description: '',
        personalDevelopmentActivityTemplate: '',
        personalReflectionTemplate: '',
        personalFeedbackTemplate: '',
        personalRealLifeExerciseTemplate: '',
    }

    const [form, setForm] = useState(emptyForm)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)

            const [skillsResponse, typesResponse, categoriesResponse] =
                await Promise.all([
                    api.get('/Skills'),
                    api.get('/SkillTypes'),
                    api.get('/SkillCategories'),
                ])

            const types = typesResponse.data || []
            const categories = categoriesResponse.data || []

            setSkills(skillsResponse.data || [])
            setSkillTypes(types)
            setSkillCategories(categories)

            if (types.length > 0) {
                const defaultType = types[0].name || types[0].Name
                const defaultCategory = getFirstCategoryForType(defaultType, categories)

                setForm((prev) => ({
                    ...prev,
                    skillType: prev.skillType || defaultType,
                    category:
                        defaultType === 'Personal'
                            ? 'Personal'
                            : prev.category || defaultCategory,
                }))
            }
        } catch (err) {
            console.log(err)
            setMessage('Skills data could not be loaded.')
        } finally {
            setLoading(false)
        }
    }

    const getFirstCategoryForType = (type, categories = skillCategories) => {
        const found = categories.find((category) => {
            const categoryType = category.skillType || category.SkillType || ''
            return categoryType === type
        })

        return found ? found.name || found.Name : ''
    }

    const getCategoriesForType = (type) => {
        return skillCategories.filter((category) => {
            const categoryType = category.skillType || category.SkillType || ''
            return categoryType === type
        })
    }

    const handleChange = (e) => {
        const { name, value } = e.target

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSkillTypeChange = (e) => {
        const selectedType = e.target.value

        setForm((prev) => ({
            ...prev,
            skillType: selectedType,
            category:
                selectedType === 'Personal'
                    ? 'Personal'
                    : getFirstCategoryForType(selectedType),

            personalDevelopmentActivityTemplate:
                selectedType === 'Personal'
                    ? prev.personalDevelopmentActivityTemplate
                    : '',

            personalReflectionTemplate:
                selectedType === 'Personal'
                    ? prev.personalReflectionTemplate
                    : '',

            personalFeedbackTemplate:
                selectedType === 'Personal'
                    ? prev.personalFeedbackTemplate
                    : '',

            personalRealLifeExerciseTemplate:
                selectedType === 'Personal'
                    ? prev.personalRealLifeExerciseTemplate
                    : '',
        }))
    }

    const handleFilterChange = (e) => {
        const { name, value } = e.target

        setFilters((prev) => ({
            ...prev,
            [name]: value,
            ...(name === 'skillType' ? { category: '' } : {}),
        }))
    }

    const clearFilters = () => {
        setFilters({
            search: '',
            skillType: '',
            category: '',
        })
    }

    const resetForm = () => {
        const defaultType =
            skillTypes.length > 0
                ? skillTypes[0].name || skillTypes[0].Name
                : ''

        setForm({
            ...emptyForm,
            skillType: defaultType,
            category:
                defaultType === 'Personal'
                    ? 'Personal'
                    : getFirstCategoryForType(defaultType),
        })

        setEditingSkillId(null)
    }

    const buildPayload = () => ({
        name: form.name,
        skillType: form.skillType,
        category: form.skillType === 'Personal' ? 'Personal' : form.category,
        description: form.description,

        personalDevelopmentActivityTemplate:
            form.skillType === 'Personal'
                ? form.personalDevelopmentActivityTemplate
                : '',

        personalReflectionTemplate:
            form.skillType === 'Personal'
                ? form.personalReflectionTemplate
                : '',

        personalFeedbackTemplate:
            form.skillType === 'Personal'
                ? form.personalFeedbackTemplate
                : '',

        personalRealLifeExerciseTemplate:
            form.skillType === 'Personal'
                ? form.personalRealLifeExerciseTemplate
                : '',
    })

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const payload = buildPayload()

            if (editingSkillId) {
                await api.put(`/Skills/${editingSkillId}`, payload)
                setMessage('Skill updated successfully.')
            } else {
                await api.post('/Skills', payload)
                setMessage('Skill added successfully.')
            }

            resetForm()
            await fetchData()
        } catch (err) {
            console.log(err)
            setMessage(
                editingSkillId
                    ? 'Skill could not be updated.'
                    : 'Skill could not be added.'
            )
        }
    }

    const editSkill = (skill) => {
        const currentSkillType =
            skill.skillType ||
            skill.SkillType ||
            (skill.category === 'Personal' ? 'Personal' : 'Technical') ||
            ''

        const currentCategory =
            currentSkillType === 'Personal'
                ? 'Personal'
                : skill.category || skill.Category || getFirstCategoryForType(currentSkillType)

        setEditingSkillId(skill.id || skill.Id)

        setForm({
            name: skill.name || skill.Name || '',
            skillType: currentSkillType,
            category: currentCategory,
            description: skill.description || skill.Description || '',

            personalDevelopmentActivityTemplate:
                skill.personalDevelopmentActivityTemplate ||
                skill.PersonalDevelopmentActivityTemplate ||
                '',

            personalReflectionTemplate:
                skill.personalReflectionTemplate ||
                skill.PersonalReflectionTemplate ||
                '',

            personalFeedbackTemplate:
                skill.personalFeedbackTemplate ||
                skill.PersonalFeedbackTemplate ||
                '',

            personalRealLifeExerciseTemplate:
                skill.personalRealLifeExerciseTemplate ||
                skill.PersonalRealLifeExerciseTemplate ||
                '',
        })

        setMessage('')
    }

    const deleteSkill = async (id) => {
        try {
            await api.delete(`/Skills/${id}`)
            setMessage('Skill deleted successfully.')

            if (editingSkillId === id) {
                resetForm()
            }

            await fetchData()
        } catch (err) {
            console.log(err)
            setMessage('Skill could not be deleted.')
        }
    }

    const technicalCategories = getCategoriesForType(form.skillType)

    const filterCategoryOptions =
        filters.skillType === ''
            ? skillCategories
            : getCategoriesForType(filters.skillType)

    const filteredSkills = skills.filter((skill) => {
        const id = skill.id || skill.Id
        const name = skill.name || skill.Name || ''

        const skillType =
            skill.skillType ||
            skill.SkillType ||
            (skill.category === 'Personal' || skill.Category === 'Personal'
                ? 'Personal'
                : 'Technical')

        const category = skill.category || skill.Category || ''
        const description = skill.description || skill.Description || ''

        const searchText = `${id} ${name} ${skillType} ${category} ${description}`.toLowerCase()

        const matchesSearch =
            filters.search.trim() === '' ||
            searchText.includes(filters.search.toLowerCase())

        const matchesType =
            filters.skillType === '' || skillType === filters.skillType

        const matchesCategory =
            filters.category === '' || category === filters.category

        return matchesSearch && matchesType && matchesCategory
    })

    return (
        <MainLayout
            title="Manage Skills"
            subtitle="Add technical and personal skills used by the AI recommendation system."
        >
            {message && (
                <div className="alert alert-info rounded-4 border-0">
                    {message}
                </div>
            )}

            <div className="row g-4">
                <div className="col-lg-4">
                    <div className="modern-card">
                        <h3 className="fw-bold mb-4">
                            {editingSkillId ? 'Update Skill' : 'Add New Skill'}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Skill Name</label>
                                <input
                                    name="name"
                                    className="form-control rounded-4"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Skill Type</label>
                                <select
                                    name="skillType"
                                    className="form-select rounded-4"
                                    value={form.skillType}
                                    onChange={handleSkillTypeChange}
                                    required
                                >
                                    <option value="">Select skill type</option>

                                    {skillTypes.map((type) => {
                                        const value = type.name || type.Name

                                        return (
                                            <option key={type.id || type.Id || value} value={value}>
                                                {value === 'Technical'
                                                    ? 'Technical / Domain'
                                                    : value}
                                            </option>
                                        )
                                    })}
                                </select>
                            </div>

                            {form.skillType === 'Technical' && (
                                <div className="mb-3">
                                    <label className="form-label">Category</label>
                                    <select
                                        name="category"
                                        className="form-select rounded-4"
                                        value={form.category}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select category</option>

                                        {technicalCategories.map((category) => {
                                            const value = category.name || category.Name

                                            return (
                                                <option
                                                    key={category.id || category.Id || value}
                                                    value={value}
                                                >
                                                    {value}
                                                </option>
                                            )
                                        })}
                                    </select>
                                </div>
                            )}

                            {form.skillType === 'Personal' && (
                                <>
                                    <div className="mb-3">
                                        <label className="form-label">Category</label>
                                        <div className="alert alert-light rounded-4 border mb-0">
                                            Personal skills will be saved as <strong>Personal</strong>.
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">
                                            Development Activity Template
                                        </label>
                                        <textarea
                                            name="personalDevelopmentActivityTemplate"
                                            className="form-control rounded-4"
                                            rows="3"
                                            value={form.personalDevelopmentActivityTemplate}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">
                                            Reflection Template
                                        </label>
                                        <textarea
                                            name="personalReflectionTemplate"
                                            className="form-control rounded-4"
                                            rows="3"
                                            value={form.personalReflectionTemplate}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">
                                            Feedback Template
                                        </label>
                                        <textarea
                                            name="personalFeedbackTemplate"
                                            className="form-control rounded-4"
                                            rows="3"
                                            value={form.personalFeedbackTemplate}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">
                                            Real-Life Exercise Template
                                        </label>
                                        <textarea
                                            name="personalRealLifeExerciseTemplate"
                                            className="form-control rounded-4"
                                            rows="3"
                                            value={form.personalRealLifeExerciseTemplate}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </>
                            )}

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

                            <button className="btn btn-primary rounded-4 px-4">
                                {editingSkillId ? 'Update Skill' : 'Add Skill'}
                            </button>

                            {editingSkillId && (
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

                <div className="col-lg-8">
                    {loading ? (
                        <LoadingSpinner />
                    ) : (
                        <div className="modern-card">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h3 className="fw-bold mb-1">Skills List</h3>
                                    <div className="text-muted small">
                                        Showing {filteredSkills.length} of {skills.length} skills
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
                                <div className="col-md-5">
                                    <label className="form-label small text-muted">
                                        Search
                                    </label>
                                    <input
                                        name="search"
                                        className="form-control rounded-4"
                                        placeholder="Search by name, description, id..."
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label small text-muted">
                                        Type
                                    </label>
                                    <select
                                        name="skillType"
                                        className="form-select rounded-4"
                                        value={filters.skillType}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">All Types</option>

                                        {skillTypes.map((type) => {
                                            const value = type.name || type.Name

                                            return (
                                                <option key={type.id || type.Id || value} value={value}>
                                                    {value === 'Technical'
                                                        ? 'Technical / Domain'
                                                        : value}
                                                </option>
                                            )
                                        })}
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label small text-muted">
                                        Category
                                    </label>
                                    <select
                                        name="category"
                                        className="form-select rounded-4"
                                        value={filters.category}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">All Categories</option>

                                        {filters.skillType === 'Personal' && (
                                            <option value="Personal">Personal</option>
                                        )}

                                        {filterCategoryOptions.map((category) => {
                                            const value = category.name || category.Name

                                            return (
                                                <option
                                                    key={category.id || category.Id || value}
                                                    value={value}
                                                >
                                                    {value}
                                                </option>
                                            )
                                        })}
                                    </select>
                                </div>
                            </div>

                            <div className="table-responsive admin-table-wrapper">
                                <table className="table align-middle admin-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Type</th>
                                            <th>Category</th>
                                            <th>Description</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredSkills.length > 0 ? (
                                            filteredSkills.map((skill) => {
                                                const id = skill.id || skill.Id

                                                const skillType =
                                                    skill.skillType ||
                                                    skill.SkillType ||
                                                    (skill.category === 'Personal' || skill.Category === 'Personal'
                                                        ? 'Personal'
                                                        : 'Technical')

                                                const category =
                                                    skill.category ||
                                                    skill.Category ||
                                                    '-'

                                                return (
                                                    <tr key={id}>
                                                        <td>{id}</td>

                                                        <td className="fw-semibold">
                                                            {skill.name || skill.Name}
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`badge ${skillType === 'Personal'
                                                                    ? 'text-bg-info'
                                                                    : 'text-bg-primary'
                                                                    }`}
                                                            >
                                                                {skillType === 'Personal'
                                                                    ? 'Personal'
                                                                    : 'Technical / Domain'}
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span className="badge text-bg-light border">
                                                                {category}
                                                            </span>
                                                        </td>

                                                        <td>
                                                            {skill.description || skill.Description || '-'}
                                                        </td>

                                                        <td>
                                                            <div className="d-flex flex-column gap-2">
                                                                <button
                                                                    className="btn btn-outline-primary btn-sm rounded-4"
                                                                    onClick={() => editSkill(skill)}
                                                                >
                                                                    Edit
                                                                </button>

                                                                <button
                                                                    className="btn btn-outline-danger btn-sm rounded-4"
                                                                    onClick={() => deleteSkill(id)}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center text-muted py-4">
                                                    No skills found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    )
}

export default AdminSkills