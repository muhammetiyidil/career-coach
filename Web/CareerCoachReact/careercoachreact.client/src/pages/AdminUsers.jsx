import { useEffect, useState } from 'react'
import MainLayout from '../layout/MainLayout'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

function AdminUsers() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    const [showForm, setShowForm] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [viewMode, setViewMode] = useState(false)
    const [photoPreview, setPhotoPreview] = useState('')

    const emptyForm = {
        id: null,
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        country: '',
        city: '',
        role: 'User',
        password: '',
        profilePhotoUrl: '',
        cvSummary: '',
        isProfileCompleted: false,
    }

    const emptyPasswordForm = {
        newPassword: '',
        confirmNewPassword: '',
    }

    const emptyEducationForm = {
        school: '',
        degree: '',
        department: '',
        startYear: '',
        endYear: '',
        gpa: '',
        description: '',
    }

    const emptyExperienceForm = {
        position: '',
        company: '',
        duration: '',
        technologies: '',
        description: '',
    }

    const emptyProjectForm = {
        title: '',
        technologies: '',
        githubLink: '',
        liveDemoUrl: '',
        projectType: '',
        description: '',
    }

    const [form, setForm] = useState(emptyForm)
    const [passwordForm, setPasswordForm] = useState(emptyPasswordForm)

    const [educationForm, setEducationForm] = useState(emptyEducationForm)
    const [experienceForm, setExperienceForm] = useState(emptyExperienceForm)
    const [projectForm, setProjectForm] = useState(emptyProjectForm)

    const [educations, setEducations] = useState([])
    const [experiences, setExperiences] = useState([])
    const [projects, setProjects] = useState([])

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await api.get('/Users')
            setUsers(response.data || [])
        } catch (err) {
            console.log(err)
            setMessage('Users could not be loaded.')
        } finally {
            setLoading(false)
        }
    }

    const getPhotoUrl = (url) => {
        if (!url) return ''

        if (url.startsWith('http')) {
            return url
        }

        return `https://localhost:7127${url}`
    }

    const fetchSelectedUserProfile = async (userId, selectedUser) => {
        try {
            const [educationResponse, experienceResponse, projectResponse] =
                await Promise.all([
                    api.get(`/Educations/user/${userId}`),
                    api.get(`/Experiences/user/${userId}`),
                    api.get(`/Projects/user/${userId}`),
                ])

            setForm({
                id: selectedUser.id,
                firstName: selectedUser.firstName || '',
                lastName: selectedUser.lastName || '',
                email: selectedUser.email || '',
                phone: selectedUser.phone || '',
                country: selectedUser.country || '',
                city: selectedUser.city || '',
                role: selectedUser.role || 'User',
                password: '',
                profilePhotoUrl: selectedUser.profilePhotoUrl || '',
                cvSummary: selectedUser.cvSummary || '',
                isProfileCompleted: selectedUser.isProfileCompleted || false,
            })

            setEducations(
                educationResponse.data.map((item) => ({
                    id: item.id,
                    school: item.schoolName || '',
                    degree: item.degreeLevel || '',
                    department: item.department || '',
                    startYear: item.startYear || '',
                    endYear: item.endYear || '',
                    gpa: item.gpa || '',
                    description: item.description || '',
                }))
            )

            setExperiences(
                experienceResponse.data.map((item) => ({
                    id: item.id,
                    company: item.companyName || '',
                    position: item.position || '',
                    duration: item.durationInMonths || '',
                    technologies: item.technologies || '',
                    description: item.description || '',
                }))
            )

            setProjects(
                projectResponse.data.map((item) => ({
                    id: item.id,
                    title: item.title || '',
                    technologies: item.technologies || '',
                    githubLink: item.githubUrl || '',
                    liveDemoUrl: item.liveDemoUrl || '',
                    projectType: item.projectType || '',
                    description: item.description || '',
                }))
            )
        } catch (err) {
            console.log(err.response?.data || err)
            setMessage('User profile data could not be loaded.')
        }
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
        setMessage('')
    }

    const handlePasswordChange = (e) => {
        setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value })
        setMessage('')
    }

    const handleEducationChange = (e) => {
        setEducationForm({ ...educationForm, [e.target.name]: e.target.value })
        setMessage('')
    }

    const handleExperienceChange = (e) => {
        setExperienceForm({ ...experienceForm, [e.target.name]: e.target.value })
        setMessage('')
    }

    const handleProjectChange = (e) => {
        setProjectForm({ ...projectForm, [e.target.name]: e.target.value })
        setMessage('')
    }

    const resetForms = () => {
        setForm(emptyForm)
        setPasswordForm(emptyPasswordForm)
        setEducationForm(emptyEducationForm)
        setExperienceForm(emptyExperienceForm)
        setProjectForm(emptyProjectForm)
        setEducations([])
        setExperiences([])
        setProjects([])
        setPhotoPreview('')
    }

    const openAddForm = () => {
        setEditingUser(null)
        setViewMode(false)
        resetForms()
        setShowForm(true)
    }

    const openEditForm = async (user) => {
        setEditingUser(user)
        setViewMode(false)
        resetForms()
        setShowForm(true)
        await fetchSelectedUserProfile(user.id, user)
    }

    const openViewForm = async (user) => {
        setEditingUser(user)
        setViewMode(true)
        resetForms()
        setShowForm(true)
        await fetchSelectedUserProfile(user.id, user)
    }

    const closeForm = () => {
        setShowForm(false)
        setEditingUser(null)
        setViewMode(false)
        resetForms()
    }

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0]

        if (!file) return

        if (!editingUser) {
            setMessage('Please create the user first, then upload a profile photo.')
            return
        }

        try {
            setSaving(true)
            setMessage('')
            setPhotoPreview(URL.createObjectURL(file))

            const formData = new FormData()
            formData.append('file', file)

            const response = await api.post(
                `/Users/${editingUser.id}/upload-profile-photo`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            )

            setForm((prev) => ({
                ...prev,
                profilePhotoUrl: response.data.profilePhotoUrl || '',
            }))

            setEditingUser(response.data)
            setMessage('Profile photo uploaded successfully.')
            await fetchUsers()
        } catch (err) {
            console.log(err.response?.data || err)
            setMessage(err.response?.data || 'Profile photo could not be uploaded.')
        } finally {
            setSaving(false)
        }
    }

    const handleRemovePhoto = async () => {
        if (!editingUser) return

        try {
            setSaving(true)
            setMessage('')
            setPhotoPreview('')

            const response = await api.delete(`/Users/${editingUser.id}/remove-profile-photo`)

            setForm((prev) => ({
                ...prev,
                profilePhotoUrl: '',
            }))

            setEditingUser(response.data)
            setMessage('Profile photo removed successfully.')
            await fetchUsers()
        } catch (err) {
            console.log(err.response?.data || err)
            setMessage(err.response?.data || 'Profile photo could not be removed.')
        } finally {
            setSaving(false)
        }
    }

    const addEducation = () => {
        if (!educationForm.school || !educationForm.degree || !educationForm.department) {
            setMessage('Please fill school, degree, and department.')
            return
        }

        setEducations([...educations, educationForm])
        setEducationForm(emptyEducationForm)
    }

    const addExperience = () => {
        if (!experienceForm.position || !experienceForm.company) {
            setMessage('Please fill position and company.')
            return
        }

        setExperiences([...experiences, experienceForm])
        setExperienceForm(emptyExperienceForm)
    }

    const addProject = () => {
        if (!projectForm.title || !projectForm.technologies) {
            setMessage('Please fill project title and technologies.')
            return
        }

        setProjects([...projects, projectForm])
        setProjectForm(emptyProjectForm)
    }

    const removeEducation = async (index) => {
        const item = educations[index]

        if (item?.id) {
            await api.delete(`/Educations/${item.id}`)
        }

        setEducations(educations.filter((_, i) => i !== index))
    }

    const removeExperience = async (index) => {
        const item = experiences[index]

        if (item?.id) {
            await api.delete(`/Experiences/${item.id}`)
        }

        setExperiences(experiences.filter((_, i) => i !== index))
    }

    const removeProject = async (index) => {
        const item = projects[index]

        if (item?.id) {
            await api.delete(`/Projects/${item.id}`)
        }

        setProjects(projects.filter((_, i) => i !== index))
    }

    const validateForm = () => {
        if (!form.firstName.trim()) {
            setMessage('First name is required.')
            return false
        }

        if (!form.lastName.trim()) {
            setMessage('Last name is required.')
            return false
        }

        if (!form.email.trim()) {
            setMessage('Email is required.')
            return false
        }

        if (!form.country.trim()) {
            setMessage('Country is required.')
            return false
        }

        if (!form.city.trim()) {
            setMessage('City is required.')
            return false
        }

        if (!form.role.trim()) {
            setMessage('Role is required.')
            return false
        }

        if (!editingUser && !form.password.trim()) {
            setMessage('Password is required for new user.')
            return false
        }

        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) return

        try {
            setSaving(true)
            setMessage('')

            const educationText = educations
                .map(
                    (item) =>
                        `${item.degree} in ${item.department} at ${item.school} (${item.startYear}-${item.endYear}). GPA: ${item.gpa}. ${item.description}`
                )
                .join('\n')

            const experienceText = experiences
                .map(
                    (item) =>
                        `${item.position} at ${item.company} for ${item.duration} months. Technologies: ${item.technologies}. ${item.description}`
                )
                .join('\n')

            const projectText = projects
                .map(
                    (item) =>
                        `${item.title}. Type: ${item.projectType}. Technologies: ${item.technologies}. GitHub: ${item.githubLink}. Live Demo: ${item.liveDemoUrl}. ${item.description}`
                )
                .join('\n')

            const payload = {
                ...editingUser,
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                phone: form.phone,
                country: form.country,
                city: form.city,
                role: form.role,
                profilePhotoUrl: form.profilePhotoUrl,
                cvSummary: form.cvSummary,
                educationLevel: educationText,
                experienceText,
                projectText,
                
            }

            let savedUser

            if (!editingUser) {
                payload.password = form.password
                const response = await api.post('/Users', payload)
                savedUser = response.data
                setMessage('User added successfully.')
            } else {
                const response = await api.put(`/Users/${editingUser.id}`, payload)
                savedUser = response.data
                setMessage('User updated successfully.')
            }

            const targetUserId = savedUser.id

            for (const education of educations) {
                const educationPayload = {
                    userId: targetUserId,
                    schoolName: education.school,
                    department: education.department,
                    degreeLevel: education.degree,
                    startYear: Number(education.startYear || 0),
                    endYear: Number(education.endYear || 0),
                    gpa: education.gpa || '',
                    description: education.description || '',
                }

                if (education.id) {
                    await api.put(`/Educations/${education.id}`, educationPayload)
                } else {
                    await api.post('/Educations', educationPayload)
                }
            }

            for (const experience of experiences) {
                const experiencePayload = {
                    userId: targetUserId,
                    companyName: experience.company,
                    position: experience.position,
                    durationInMonths: Number(experience.duration || 0),
                    technologies: experience.technologies || '',
                    description: experience.description || '',
                }

                if (experience.id) {
                    await api.put(`/Experiences/${experience.id}`, experiencePayload)
                } else {
                    await api.post('/Experiences', experiencePayload)
                }
            }
            for (const project of projects) {
                const projectPayload = {
                    userId: targetUserId,
                    title: project.title,
                    technologies: project.technologies,
                    githubUrl: project.githubLink || '',
                    liveDemoUrl: project.liveDemoUrl || '',
                    projectType: project.projectType || '',
                    description: project.description || '',
                }

                if (project.id) {
                    await api.put(`/Projects/${project.id}`, projectPayload)
                } else {
                    await api.post('/Projects', projectPayload)
                }
            }

            if (editingUser) {
                const refreshResponse = await api.put(`/Users/${targetUserId}`, {
                    ...payload,
                    id: targetUserId,
                })

                savedUser = refreshResponse.data
            }

            await fetchUsers()

            if (!editingUser) {
                closeForm()
            } else {
                setEditingUser(savedUser)
                await fetchSelectedUserProfile(targetUserId, savedUser)
            }
        } catch (err) {
            console.log(err.response?.data || err)
            setMessage(err.response?.data || 'Operation failed.')
        } finally {
            setSaving(false)
        }
    }

    const handleAdminChangePassword = async (e) => {
        e.preventDefault()

        if (!editingUser) {
            setMessage('Please select a user first.')
            return
        }

        if (!passwordForm.newPassword.trim()) {
            setMessage('New password is required.')
            return
        }

        if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
            setMessage('New passwords do not match.')
            return
        }

        try {
            setSaving(true)
            setMessage('')

            await api.put(`/Users/${editingUser.id}/admin-change-password`, {
                newPassword: passwordForm.newPassword,
                confirmNewPassword: passwordForm.confirmNewPassword,
            })

            setPasswordForm(emptyPasswordForm)
            setMessage('Password changed successfully.')
        } catch (err) {
            console.log(err.response?.data || err)
            setMessage(err.response?.data || 'Password could not be changed.')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (userId) => {
        const confirmed = window.confirm('Are you sure you want to delete this user?')

        if (!confirmed) return

        try {
            setSaving(true)
            setMessage('')

            await api.delete(`/Users/${userId}`)

            setMessage('User deleted successfully.')
            await fetchUsers()
        } catch (err) {
            console.log(err.response?.data || err)
            setMessage(err.response?.data || 'User could not be deleted.')
        } finally {
            setSaving(false)
        }
    }

    const imageSource = photoPreview || getPhotoUrl(form.profilePhotoUrl)

    return (
        <MainLayout
            title="Users Management"
            subtitle="View, add, edit and delete registered users."
        >
            {message && (
                <div className="alert alert-info rounded-4 border-0">
                    {message}
                </div>
            )}

            {loading && users.length === 0 ? (
                <LoadingSpinner />
            ) : (
                <>
                    <div className="modern-card mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h3 className="fw-bold mb-1">Registered Users</h3>
                                <p className="text-muted mb-0">
                                    Admin can manage user account and profile information.
                                </p>
                            </div>

                            <button
                                className="btn btn-primary rounded-4 px-4"
                                onClick={openAddForm}
                            >
                                Add User
                            </button>
                        </div>

                        <div className="table-responsive">
                            <table className="table align-middle">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Surname</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Country</th>
                                        <th>City</th>
                                        <th>Profile</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.id}</td>
                                            <td>{user.firstName || '-'}</td>
                                            <td>{user.lastName || '-'}</td>
                                            <td>{user.email || '-'}</td>
                                            <td>
                                                <span className="badge text-bg-primary">
                                                    {user.role || 'User'}
                                                </span>
                                            </td>
                                            <td>{user.country || '-'}</td>
                                            <td>{user.city || '-'}</td>
                                            <td>
                                                {user.isProfileCompleted ? (
                                                    <span className="badge text-bg-success">
                                                        Completed
                                                    </span>
                                                ) : (
                                                    <span className="badge text-bg-warning">
                                                        Incomplete
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <button
                                                        className="btn btn-sm btn-outline-secondary rounded-pill"
                                                        onClick={() => openViewForm(user)}
                                                    >
                                                        View
                                                    </button>

                                                    <button
                                                        className="btn btn-sm btn-outline-primary rounded-pill"
                                                        onClick={() => openEditForm(user)}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="btn btn-sm btn-outline-danger rounded-pill"
                                                        onClick={() => handleDelete(user.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {showForm && (
                        <>
                            <div className="modern-card mb-4">
                                <form onSubmit={handleSubmit}>
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h3 className="fw-bold mb-0">
                                            {viewMode
                                                ? 'View User'
                                                : editingUser
                                                    ? 'Edit User'
                                                    : 'Add New User'}
                                        </h3>

                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary rounded-4"
                                            onClick={closeForm}
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                    <div className="text-center mb-4">
                                        <h5 className="fw-bold mb-3">Profile Photo</h5>

                                        {imageSource ? (
                                            <img
                                                src={imageSource}
                                                alt="Profile"
                                                style={{
                                                    width: 130,
                                                    height: 130,
                                                    objectFit: 'cover',
                                                    borderRadius: '50%',
                                                    border: '4px solid #eef2ff',
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className="mx-auto d-flex align-items-center justify-content-center"
                                                style={{
                                                    width: 130,
                                                    height: 130,
                                                    borderRadius: '50%',
                                                    background: '#eef2ff',
                                                    fontSize: 38,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {form.firstName?.charAt(0)}
                                                {form.lastName?.charAt(0)}
                                            </div>
                                        )}

                                        {!viewMode && (
                                            <div className="mt-4 d-flex justify-content-center gap-2 flex-wrap">
                                                <label className="btn btn-primary rounded-4 px-4">
                                                    Upload Photo
                                                    <input
                                                        type="file"
                                                        accept="image/png, image/jpeg, image/jpg, image/webp"
                                                        hidden
                                                        onChange={handlePhotoUpload}
                                                    />
                                                </label>

                                                {form.profilePhotoUrl && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger rounded-4 px-4"
                                                        onClick={handleRemovePhoto}
                                                        disabled={saving}
                                                    >
                                                        Remove Photo
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        <div className="text-muted small mt-2">
                                            JPG, PNG and WEBP supported
                                        </div>
                                    </div>

                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">
                                                First Name <span className="text-danger">*</span>
                                            </label>

                                            <input
                                                required
                                                disabled={viewMode}
                                                name="firstName"
                                                className="form-control rounded-4"
                                                value={form.firstName}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Last Name <span className="text-danger">*</span>
                                            </label>

                                            <input
                                                required
                                                disabled={viewMode}
                                                name="lastName"
                                                className="form-control rounded-4"
                                                value={form.lastName}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Email <span className="text-danger">*</span>
                                            </label>

                                            <input
                                                required
                                                disabled={viewMode}
                                                name="email"
                                                type="email"
                                                className="form-control rounded-4"
                                                value={form.email}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">Phone</label>

                                            <input
                                                disabled={viewMode}
                                                name="phone"
                                                className="form-control rounded-4"
                                                value={form.phone}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Country <span className="text-danger">*</span>
                                            </label>

                                            <input
                                                required
                                                disabled={viewMode}
                                                name="country"
                                                className="form-control rounded-4"
                                                value={form.country}
                                                onChange={handleChange}
                                                placeholder="Example: Turkey"
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                City <span className="text-danger">*</span>
                                            </label>

                                            <input
                                                required
                                                disabled={viewMode}
                                                name="city"
                                                className="form-control rounded-4"
                                                value={form.city}
                                                onChange={handleChange}
                                                placeholder="Example: Istanbul"
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Role <span className="text-danger">*</span>
                                            </label>

                                            <select
                                                required
                                                disabled={viewMode}
                                                name="role"
                                                className="form-select rounded-4"
                                                value={form.role}
                                                onChange={handleChange}
                                            >
                                                <option value="User">User</option>
                                                <option value="Admin">Admin</option>
                                            </select>
                                        </div>

                                        {!editingUser && !viewMode && (
                                            <div className="col-md-6">
                                                <label className="form-label">
                                                    Password <span className="text-danger">*</span>
                                                </label>

                                                <input
                                                    required
                                                    name="password"
                                                    type="password"
                                                    className="form-control rounded-4"
                                                    value={form.password}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        )}

                                        
                                    </div>

                                    {!viewMode && (
                                        <button
                                            className="btn btn-primary rounded-4 px-4 mt-4"
                                            disabled={saving}
                                        >
                                            {saving
                                                ? 'Saving...'
                                                : editingUser
                                                    ? 'Save Changes'
                                                    : 'Create User'}
                                        </button>
                                    )}
                                </form>
                            </div>

                            {editingUser && !viewMode && (
                                <div className="modern-card mb-4">
                                    <h4 className="fw-bold mb-3">Change Password</h4>

                                    <form onSubmit={handleAdminChangePassword}>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label">
                                                    New Password <span className="text-danger">*</span>
                                                </label>

                                                <input
                                                    required
                                                    name="newPassword"
                                                    type="password"
                                                    className="form-control rounded-4"
                                                    value={passwordForm.newPassword}
                                                    onChange={handlePasswordChange}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">
                                                    Confirm New Password <span className="text-danger">*</span>
                                                </label>

                                                <input
                                                    required
                                                    name="confirmNewPassword"
                                                    type="password"
                                                    className="form-control rounded-4"
                                                    value={passwordForm.confirmNewPassword}
                                                    onChange={handlePasswordChange}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            className="btn btn-outline-primary rounded-4 px-4 mt-4"
                                            disabled={saving}
                                        >
                                            {saving ? 'Changing...' : 'Change Password'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            <div className="modern-card mb-4">
                                <h3 className="fw-bold mb-3">CV Summary</h3>

                                <textarea
                                    disabled={viewMode}
                                    rows="4"
                                    className="form-control rounded-4"
                                    placeholder="Example: I am a computer engineering student interested in frontend development..."
                                    name="cvSummary"
                                    value={form.cvSummary}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="modern-card mb-4">
                                <h3 className="fw-bold mb-3">Education</h3>

                                {!viewMode && (
                                    <>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <input name="school" className="form-control rounded-4" placeholder="School / University" value={educationForm.school} onChange={handleEducationChange} />
                                            </div>

                                            <div className="col-md-6">
                                                <input name="degree" className="form-control rounded-4" placeholder="Degree" value={educationForm.degree} onChange={handleEducationChange} />
                                            </div>

                                            <div className="col-md-6">
                                                <input name="department" className="form-control rounded-4" placeholder="Department" value={educationForm.department} onChange={handleEducationChange} />
                                            </div>

                                            <div className="col-md-3">
                                                <input name="startYear" className="form-control rounded-4" placeholder="Start Year" value={educationForm.startYear} onChange={handleEducationChange} />
                                            </div>

                                            <div className="col-md-3">
                                                <input name="endYear" className="form-control rounded-4" placeholder="End Year" value={educationForm.endYear} onChange={handleEducationChange} />
                                            </div>

                                            <div className="col-md-4">
                                                <input name="gpa" className="form-control rounded-4" placeholder="GPA optional" value={educationForm.gpa} onChange={handleEducationChange} />
                                            </div>

                                            <div className="col-md-8">
                                                <input name="description" className="form-control rounded-4" placeholder="Description optional" value={educationForm.description} onChange={handleEducationChange} />
                                            </div>
                                        </div>

                                        <button type="button" className="btn btn-outline-primary rounded-4 mt-3" onClick={addEducation}>
                                            Add Education
                                        </button>
                                    </>
                                )}

                                <div className="row g-3 mt-3">
                                    {educations.map((item, index) => (
                                        <div className="col-md-6" key={index}>
                                            <div className="border rounded-4 p-3">
                                                <div className="d-flex justify-content-between">
                                                    <h5 className="fw-bold mb-1">{item.school}</h5>

                                                    {!viewMode && (
                                                        <button type="button" className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => removeEducation(index)}>
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>

                                                <p className="mb-1">{item.degree} - {item.department}</p>
                                                <p className="text-muted mb-1">{item.startYear} - {item.endYear}</p>
                                                <p className="text-muted mb-0">{item.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modern-card mb-4">
                                <h3 className="fw-bold mb-3">Experience</h3>

                                {!viewMode && (
                                    <>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <input name="position" className="form-control rounded-4" placeholder="Position" value={experienceForm.position} onChange={handleExperienceChange} />
                                            </div>

                                            <div className="col-md-6">
                                                <input name="company" className="form-control rounded-4" placeholder="Company" value={experienceForm.company} onChange={handleExperienceChange} />
                                            </div>

                                            <div className="col-md-6">
                                                <input name="duration" className="form-control rounded-4" placeholder="Duration in months" value={experienceForm.duration} onChange={handleExperienceChange} />
                                            </div>

                                            <div className="col-md-6">
                                                <input name="technologies" className="form-control rounded-4" placeholder="Technologies: React, SQL, API..." value={experienceForm.technologies} onChange={handleExperienceChange} />
                                            </div>

                                            <div className="col-12">
                                                <textarea name="description" rows="3" className="form-control rounded-4" placeholder="Experience description" value={experienceForm.description} onChange={handleExperienceChange} />
                                            </div>
                                        </div>

                                        <button type="button" className="btn btn-outline-primary rounded-4 mt-3" onClick={addExperience}>
                                            Add Experience
                                        </button>
                                    </>
                                )}

                                <div className="row g-3 mt-3">
                                    {experiences.map((item, index) => (
                                        <div className="col-md-6" key={index}>
                                            <div className="border rounded-4 p-3">
                                                <div className="d-flex justify-content-between">
                                                    <h5 className="fw-bold mb-1">{item.position}</h5>

                                                    {!viewMode && (
                                                        <button type="button" className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => removeExperience(index)}>
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>

                                                <p className="mb-1">{item.company} - {item.duration} months</p>
                                                <p className="text-muted mb-1">{item.technologies}</p>
                                                <p className="text-muted mb-0">{item.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modern-card mb-4">
                                <h3 className="fw-bold mb-3">Projects</h3>

                                {!viewMode && (
                                    <>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <input name="title" className="form-control rounded-4" placeholder="Project Title" value={projectForm.title} onChange={handleProjectChange} />
                                            </div>

                                            <div className="col-md-6">
                                                <input name="technologies" className="form-control rounded-4" placeholder="Technologies: React, Node.js..." value={projectForm.technologies} onChange={handleProjectChange} />
                                            </div>

                                            <div className="col-md-6">
                                                <input name="projectType" className="form-control rounded-4" placeholder="Project Type: Web App, API, AI..." value={projectForm.projectType} onChange={handleProjectChange} />
                                            </div>

                                            <div className="col-md-6">
                                                <input name="githubLink" className="form-control rounded-4" placeholder="GitHub Link optional" value={projectForm.githubLink} onChange={handleProjectChange} />
                                            </div>

                                            <div className="col-12">
                                                <input name="liveDemoUrl" className="form-control rounded-4" placeholder="Live Demo URL optional" value={projectForm.liveDemoUrl} onChange={handleProjectChange} />
                                            </div>

                                            <div className="col-12">
                                                <textarea name="description" rows="3" className="form-control rounded-4" placeholder="Project description" value={projectForm.description} onChange={handleProjectChange} />
                                            </div>
                                        </div>

                                        <button type="button" className="btn btn-outline-primary rounded-4 mt-3" onClick={addProject}>
                                            Add Project
                                        </button>
                                    </>
                                )}

                                <div className="row g-3 mt-3">
                                    {projects.map((item, index) => (
                                        <div className="col-md-6" key={index}>
                                            <div className="border rounded-4 p-3">
                                                <div className="d-flex justify-content-between">
                                                    <h5 className="fw-bold mb-1">{item.title}</h5>

                                                    {!viewMode && (
                                                        <button type="button" className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => removeProject(index)}>
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>

                                                <p className="text-muted mb-1">{item.projectType}</p>
                                                <p className="text-muted mb-1">{item.technologies}</p>
                                                <p className="mb-1">{item.description}</p>

                                                {item.githubLink && (
                                                    <a href={item.githubLink} target="_blank" rel="noopener noreferrer" className="me-3">
                                                        GitHub
                                                    </a>
                                                )}

                                                {item.liveDemoUrl && (
                                                    <a href={item.liveDemoUrl} target="_blank" rel="noopener noreferrer">
                                                        Live Demo
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </MainLayout>
    )
}

export default AdminUsers