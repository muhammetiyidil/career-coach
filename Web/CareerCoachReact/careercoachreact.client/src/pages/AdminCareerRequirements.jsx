import { useEffect, useMemo, useState } from 'react'
import MainLayout from '../layout/MainLayout'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

function AdminCareerRequirements() {
    const [careers, setCareers] = useState([])
    const [skills, setSkills] = useState([])
    const [requirements, setRequirements] = useState([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [editingRequirementId, setEditingRequirementId] = useState(null)

    const [skillSearch, setSkillSearch] = useState('')
    const [skillCategoryFilter, setSkillCategoryFilter] = useState('all')

    const [filters, setFilters] = useState({
        search: '',
        careerId: '',
        skillId: '',
        requiredLevel: '',
        importanceScore: '',
    })

    const [form, setForm] = useState({
        careerId: '',
        selectedSkillIds: [],
        requiredLevel: 1,
        importanceScore: 3,
    })

    useEffect(() => {
        fetchData()
    }, [])

    const getSkillId = (skill) => Number(skill.id || skill.Id)

    const getSkillName = (skill) =>
        skill?.name || skill?.Name || ''

    const getSkillType = (skill) =>
        skill?.skillType || skill?.SkillType || ''

    const getSkillCategory = (skill) =>
        skill?.category || skill?.Category || ''

    const isPersonalSkill = (skill) => {
        return getSkillType(skill).toLowerCase() === 'personal'
    }

    const isTechnicalSkill = (skill) => {
        return getSkillType(skill).toLowerCase() === 'technical'
    }

    const selectedSkills = skills.filter((skill) =>
        form.selectedSkillIds.includes(getSkillId(skill))
    )

    const hasTechnicalSkill = selectedSkills.some((skill) =>
        isTechnicalSkill(skill)
    )

    const skillCategories = useMemo(() => {
        const categories = skills
            .map((skill) => getSkillCategory(skill))
            .filter((category) => category && category.trim() !== '')

        return [...new Set(categories)].sort()
    }, [skills])

    const filteredSkillsForForm = useMemo(() => {
        return skills.filter((skill) => {
            const name = getSkillName(skill).toLowerCase()
            const type = getSkillType(skill).toLowerCase()
            const category = getSkillCategory(skill)

            const search = skillSearch.toLowerCase()

            const matchesSearch =
                skillSearch.trim() === '' ||
                name.includes(search) ||
                type.includes(search) ||
                category.toLowerCase().includes(search)

            const matchesCategory =
                skillCategoryFilter === 'all' ||
                category === skillCategoryFilter

            return matchesSearch && matchesCategory
        })
    }, [skills, skillSearch, skillCategoryFilter])

    const fetchData = async () => {
        try {
            setLoading(true)

            const careerResponse = await api.get('/Careers')
            const skillResponse = await api.get('/Skills')

            const careerList = careerResponse.data || []
            const skillList = skillResponse.data || []

            setCareers(careerList)
            setSkills(skillList)

            try {
                const requirementResponse = await api.get('/CareerSkills')

                const formattedRequirements = (requirementResponse.data || []).map((item) => {
                    const career = careerList.find(
                        (c) => Number(c.id || c.Id) === Number(item.careerId || item.CareerId)
                    )

                    const skill = skillList.find(
                        (s) => Number(s.id || s.Id) === Number(item.skillId || item.SkillId)
                    )

                    return {
                        ...item,
                        career,
                        skill,
                    }
                })

                setRequirements(formattedRequirements)
            } catch (err) {
                console.log('CareerSkills could not be loaded:', err)
                setRequirements([])
            }

            setMessage('')
        } catch (err) {
            console.log(err)
            setMessage('Data could not be loaded.')
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
            careerId: '',
            skillId: '',
            requiredLevel: '',
            importanceScore: '',
        })
    }

    const clearSkillFilters = () => {
        setSkillSearch('')
        setSkillCategoryFilter('all')
    }

    const toggleSkill = (skillId) => {
        const id = Number(skillId)

        if (editingRequirementId) {
            setForm({
                ...form,
                selectedSkillIds: [id],
            })
            return
        }

        const exists = form.selectedSkillIds.includes(id)

        setForm({
            ...form,
            selectedSkillIds: exists
                ? form.selectedSkillIds.filter((selectedId) => selectedId !== id)
                : [...form.selectedSkillIds, id],
        })
    }

    const resetForm = () => {
        setForm({
            careerId: '',
            selectedSkillIds: [],
            requiredLevel: 1,
            importanceScore: 3,
        })

        setEditingRequirementId(null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!form.careerId) {
            setMessage('Please select a career.')
            return
        }

        if (form.selectedSkillIds.length === 0) {
            setMessage('Please select at least one skill.')
            return
        }

        try {
            if (editingRequirementId) {
                const selectedSkill = skills.find(
                    (skill) => getSkillId(skill) === Number(form.selectedSkillIds[0])
                )

                await api.put(`/CareerSkills/${editingRequirementId}`, {
                    careerId: Number(form.careerId),
                    skillId: Number(form.selectedSkillIds[0]),
                    requiredLevel: isPersonalSkill(selectedSkill)
                        ? 100
                        : Number(form.requiredLevel),
                    importanceScore: Number(form.importanceScore),
                })

                setMessage('Career requirement updated successfully.')
            } else {
                for (const skillId of form.selectedSkillIds) {
                    const selectedSkill = skills.find(
                        (skill) => getSkillId(skill) === Number(skillId)
                    )

                    await api.post('/CareerSkills', {
                        careerId: Number(form.careerId),
                        skillId: Number(skillId),
                        requiredLevel: isPersonalSkill(selectedSkill)
                            ? 100
                            : Number(form.requiredLevel),
                        importanceScore: Number(form.importanceScore),
                    })
                }

                setMessage('Career requirements added successfully.')
            }

            resetForm()
            await fetchData()
        } catch (err) {
            console.log(err)
            setMessage(
                err.response?.data ||
                (editingRequirementId
                    ? 'Career requirement could not be updated.'
                    : 'Career requirement could not be added.')
            )
        }
    }

    const editRequirement = (item) => {
        setEditingRequirementId(item.id || item.Id)

        const skill = item.skill

        setForm({
            careerId: item.careerId || item.CareerId || '',
            selectedSkillIds: item.skillId || item.SkillId ? [Number(item.skillId || item.SkillId)] : [],
            requiredLevel: isPersonalSkill(skill)
                ? 1
                : item.requiredLevel || item.RequiredLevel || 1,
            importanceScore: item.importanceScore || item.ImportanceScore || 3,
        })

        setMessage('')
    }

    const deleteRequirement = async (id) => {
        try {
            await api.delete(`/CareerSkills/${id}`)
            setMessage('Career requirement deleted successfully.')

            if (editingRequirementId === id) {
                resetForm()
            }

            await fetchData()
        } catch (err) {
            console.log(err)
            setMessage('Career requirement could not be deleted.')
        }
    }

    const filteredRequirements = requirements.filter((item) => {
        const careerId = item.careerId || item.CareerId
        const skillId = item.skillId || item.SkillId

        const careerTitle =
            item.career?.title ||
            item.career?.Title ||
            careerId ||
            ''

        const skillName =
            getSkillName(item.skill) ||
            skillId ||
            ''

        const skillType = getSkillType(item.skill)
        const skillCategory = getSkillCategory(item.skill)

        const requiredLevel =
            item.requiredLevel ||
            item.RequiredLevel ||
            ''

        const importanceScore =
            item.importanceScore ??
            item.ImportanceScore ??
            3

        const searchText = `
            ${item.id || item.Id}
            ${careerTitle}
            ${skillName}
            ${skillType}
            ${skillCategory}
            ${requiredLevel}
            ${importanceScore}
        `.toLowerCase()

        const matchesSearch =
            filters.search.trim() === '' ||
            searchText.includes(filters.search.toLowerCase())

        const matchesCareer =
            filters.careerId === '' ||
            Number(filters.careerId) === Number(careerId)

        const matchesSkill =
            filters.skillId === '' ||
            Number(filters.skillId) === Number(skillId)

        const matchesRequiredLevel =
            filters.requiredLevel === '' ||
            Number(filters.requiredLevel) === Number(requiredLevel)

        const matchesImportance =
            filters.importanceScore === '' ||
            Number(filters.importanceScore) === Number(importanceScore)

        return (
            matchesSearch &&
            matchesCareer &&
            matchesSkill &&
            matchesRequiredLevel &&
            matchesImportance
        )
    })

    if (loading) {
        return (
            <MainLayout
                title="Career Requirements"
                subtitle="Define multiple required skills for each career and set their level and importance."
            >
                <LoadingSpinner />
            </MainLayout>
        )
    }

    return (
        <MainLayout
            title="Career Requirements"
            subtitle="Define multiple required skills for each career and set their level and importance."
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
                            {editingRequirementId ? 'Update Requirement' : 'Add Requirements'}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Career</label>
                                <select
                                    name="careerId"
                                    className="form-select rounded-4"
                                    value={form.careerId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Career</option>

                                    {careers.map((career) => (
                                        <option
                                            key={career.id || career.Id}
                                            value={career.id || career.Id}
                                        >
                                            {career.title || career.Title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="form-label mb-0">Skills</label>

                                    <span className="badge text-bg-primary rounded-pill">
                                        {form.selectedSkillIds.length} selected
                                    </span>
                                </div>

                                {editingRequirementId && (
                                    <div className="alert alert-light border rounded-4 small">
                                        Edit mode allows selecting only one skill for this requirement.
                                    </div>
                                )}

                                <div className="row g-2 mb-3">
                                    <div className="col-md-7">
                                        <input
                                            type="text"
                                            className="form-control rounded-4"
                                            placeholder="Search skill..."
                                            value={skillSearch}
                                            onChange={(e) => setSkillSearch(e.target.value)}
                                        />
                                    </div>

                                    <div className="col-md-5">
                                        <select
                                            className="form-select rounded-4"
                                            value={skillCategoryFilter}
                                            onChange={(e) => setSkillCategoryFilter(e.target.value)}
                                        >
                                            <option value="all">All Categories</option>

                                            {skillCategories.map((category) => (
                                                <option key={category} value={category}>
                                                    {category}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-12">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm rounded-4"
                                            onClick={clearSkillFilters}
                                        >
                                            Clear Skill Filters
                                        </button>
                                    </div>
                                </div>

                                <div className="row g-2">
                                    {filteredSkillsForForm.length > 0 ? (
                                        filteredSkillsForForm.map((skill) => {
                                            const skillId = getSkillId(skill)
                                            const selected = form.selectedSkillIds.includes(skillId)

                                            return (
                                                <div className="col-md-6" key={skillId}>
                                                    <button
                                                        type="button"
                                                        className={`btn rounded-4 w-100 text-start ${selected ? 'btn-primary' : 'btn-outline-primary'
                                                            }`}
                                                        onClick={() => toggleSkill(skillId)}
                                                    >
                                                        <div className="fw-semibold">
                                                            {getSkillName(skill)}
                                                        </div>

                                                        <div className="small">
                                                            {getSkillType(skill)}
                                                        </div>

                                                        <div className="small opacity-75">
                                                            {getSkillCategory(skill) || '-'}
                                                        </div>
                                                    </button>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="col-12">
                                            <div className="alert alert-light border rounded-4 mb-0">
                                                No skills found for selected filters.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="row g-3">
                                {hasTechnicalSkill && (
                                    <div className="col-md-6">
                                        <label className="form-label">Required Level</label>

                                        <select
                                            name="requiredLevel"
                                            className="form-select rounded-4"
                                            value={form.requiredLevel}
                                            onChange={handleChange}
                                        >
                                            <option value="1">Level 1</option>
                                            <option value="2">Level 2</option>
                                            <option value="3">Level 3</option>
                                            <option value="4">Level 4</option>
                                            <option value="5">Level 5</option>
                                        </select>
                                    </div>
                                )}

                                <div className={hasTechnicalSkill ? 'col-md-6' : 'col-md-12'}>
                                    <label className="form-label">Importance</label>

                                    <select
                                        name="importanceScore"
                                        className="form-select rounded-4"
                                        value={form.importanceScore}
                                        onChange={handleChange}
                                    >
                                        <option value="1">1 - Low</option>
                                        <option value="2">2</option>
                                        <option value="3">3 - Medium</option>
                                        <option value="4">4</option>
                                        <option value="5">5 - Critical</option>
                                    </select>
                                </div>
                            </div>

                            {!hasTechnicalSkill && form.selectedSkillIds.length > 0 && (
                                <div className="alert alert-light border rounded-4 small mt-3 mb-0">
                                    Personal skills do not use level progression. They are tracked through activities and reflections.
                                </div>
                            )}

                            <button className="btn btn-primary rounded-4 px-4 mt-4">
                                {editingRequirementId ? 'Update Requirement' : 'Add Requirements'}
                            </button>

                            {editingRequirementId && (
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
                    <div className="modern-card">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h3 className="fw-bold mb-1">Requirement List</h3>

                                <div className="text-muted small">
                                    Showing {filteredRequirements.length} of {requirements.length} requirements
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
                                    placeholder="Search career, skill, type..."
                                    value={filters.search}
                                    onChange={handleFilterChange}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label small text-muted">
                                    Career
                                </label>

                                <select
                                    name="careerId"
                                    className="form-select rounded-4"
                                    value={filters.careerId}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Careers</option>

                                    {careers.map((career) => (
                                        <option
                                            key={career.id || career.Id}
                                            value={career.id || career.Id}
                                        >
                                            {career.title || career.Title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label small text-muted">
                                    Skill
                                </label>

                                <select
                                    name="skillId"
                                    className="form-select rounded-4"
                                    value={filters.skillId}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Skills</option>

                                    {skills.map((skill) => (
                                        <option
                                            key={getSkillId(skill)}
                                            value={getSkillId(skill)}
                                        >
                                            {getSkillName(skill)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label small text-muted">
                                    Required Level
                                </label>

                                <select
                                    name="requiredLevel"
                                    className="form-select rounded-4"
                                    value={filters.requiredLevel}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Levels</option>
                                    <option value="1">Level 1</option>
                                    <option value="2">Level 2</option>
                                    <option value="3">Level 3</option>
                                    <option value="4">Level 4</option>
                                    <option value="5">Level 5</option>
                                </select>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label small text-muted">
                                    Importance
                                </label>

                                <select
                                    name="importanceScore"
                                    className="form-select rounded-4"
                                    value={filters.importanceScore}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Importance Scores</option>
                                    <option value="1">1 - Low</option>
                                    <option value="2">2</option>
                                    <option value="3">3 - Medium</option>
                                    <option value="4">4</option>
                                    <option value="5">5 - Critical</option>
                                </select>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="table align-middle">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Career</th>
                                        <th>Skill</th>
                                        <th>Required</th>
                                        <th>Importance</th>
                                        <th></th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredRequirements.length > 0 ? (
                                        filteredRequirements.map((item) => {
                                            const itemId = item.id || item.Id
                                            const careerTitle =
                                                item.career?.title ||
                                                item.career?.Title ||
                                                item.careerId ||
                                                item.CareerId

                                            const skillName =
                                                getSkillName(item.skill) ||
                                                item.skillId ||
                                                item.SkillId

                                            const skillType = getSkillType(item.skill)

                                            const requiredLevel =
                                                item.requiredLevel ||
                                                item.RequiredLevel

                                            const importanceScore =
                                                item.importanceScore ??
                                                item.ImportanceScore ??
                                                3

                                            return (
                                                <tr key={itemId}>
                                                    <td>{itemId}</td>

                                                    <td>{careerTitle}</td>

                                                    <td>
                                                        <div className="fw-semibold">
                                                            {skillName}
                                                        </div>

                                                        <div className="small text-muted">
                                                            {skillType || '-'}
                                                        </div>

                                                        <div className="small text-muted">
                                                            {getSkillCategory(item.skill) || '-'}
                                                        </div>
                                                    </td>

                                                    <td>
                                                        {skillType.toLowerCase() === 'personal'
                                                            ? 'No level'
                                                            : `Level ${requiredLevel}`}
                                                    </td>

                                                    <td>
                                                        <span className="badge text-bg-primary">
                                                            {importanceScore}/5
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <div className="d-flex flex-column gap-2">
                                                            <button
                                                                className="btn btn-outline-primary btn-sm rounded-4"
                                                                onClick={() => editRequirement(item)}
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                className="btn btn-outline-danger btn-sm rounded-4"
                                                                onClick={() => deleteRequirement(itemId)}
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
                                                No requirements found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}

export default AdminCareerRequirements