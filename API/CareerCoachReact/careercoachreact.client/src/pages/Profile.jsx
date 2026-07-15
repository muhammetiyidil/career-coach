import { useEffect, useState } from 'react'
import MainLayout from '../layout/MainLayout'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Profile() {
    const { user, login } = useAuth()

    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [editingEducationIndex, setEditingEducationIndex] = useState(null)
    const [editingExperienceIndex, setEditingExperienceIndex] = useState(null)
    const [editingProjectIndex, setEditingProjectIndex] = useState(null)

    const [cvSummary, setCvSummary] = useState(user?.cvSummary || '')
    const [cvFile, setCvFile] = useState(null)
    const [analyzing, setAnalyzing] = useState(false)
    const [cvError, setCvError] = useState('')

    const [educationForm, setEducationForm] = useState({
        school: '',
        degree: '',
        departmentId: '',
        customDepartmentName: '',
        startYear: '',
        endYear: '',
        gpa: '',
        description: '',
    })

    const [experienceForm, setExperienceForm] = useState({
        position: '',
        company: '',
        duration: '',
        technologies: '',
        description: '',
    })

    const [projectForm, setProjectForm] = useState({
        title: '',
        technologies: '',
        githubLink: '',
        liveDemoUrl: '',
        projectType: '',
        description: '',
    })

    const [departments, setDepartments] = useState([])
    const [educations, setEducations] = useState([])
    const [experiences, setExperiences] = useState([])
    const [projects, setProjects] = useState([])
    const [skills, setSkills] = useState([])

    const [originalEducationIds, setOriginalEducationIds] = useState([])
    const [originalExperienceIds, setOriginalExperienceIds] = useState([])
    const [originalProjectIds, setOriginalProjectIds] = useState([])

    useEffect(() => {
        if (user?.id) {
            fetchProfileData()
        }
    }, [user])

    const fetchProfileData = async () => {
        try {
            setLoading(true)

            const [
                educationResponse,
                experienceResponse,
                projectResponse,
                departmentResponse,
                skillsResponse,
            ] = await Promise.all([
                api.get(`/Educations/user/${user.id}`),
                api.get(`/Experiences/user/${user.id}`),
                api.get(`/Projects/user/${user.id}`),
                api.get('/Departments'),
                api.get('/Skills'),
            ])

            const mappedEducations = educationResponse.data.map((item) => ({
                id: item.id,
                school: item.schoolName || '',
                degree: item.degreeLevel || '',
                departmentId: item.departmentId || '',
                customDepartmentName: item.customDepartmentName || '',
                departmentName: item.departmentName || item.customDepartmentName || '',
                startYear: item.startYear || '',
                endYear: item.endYear || '',
                gpa: item.gpa || '',
                description: item.description || '',
            }))

            const mappedExperiences = experienceResponse.data.map((item) => ({
                id: item.id,
                company: item.companyName || '',
                position: item.position || '',
                duration: item.durationInMonths || '',
                technologies: item.technologies || '',
                description: item.description || '',
            }))

            const mappedProjects = projectResponse.data.map((item) => ({
                id: item.id,
                title: item.title || '',
                technologies: item.technologies || '',
                githubLink: item.githubUrl || '',
                liveDemoUrl: item.liveDemoUrl || '',
                projectType: item.projectType || '',
                description: item.description || '',
            }))

            setCvSummary(user?.cvSummary || '')
            setEducations(mappedEducations)
            setExperiences(mappedExperiences)
            setProjects(mappedProjects)
            setDepartments(departmentResponse.data || [])
            setSkills(skillsResponse.data || [])

            setOriginalEducationIds(mappedEducations.map(x => x.id).filter(Boolean))
            setOriginalExperienceIds(mappedExperiences.map(x => x.id).filter(Boolean))
            setOriginalProjectIds(mappedProjects.map(x => x.id).filter(Boolean))
        } catch (err) {
            console.log(err.response?.data || err)
            setMessage('Profile data could not be loaded.')
        } finally {
            setLoading(false)
        }
    }

    const handleEducationChange = (e) => {
        setEducationForm({
            ...educationForm,
            [e.target.name]: e.target.value,
        })

        setMessage('')
    }

    const handleExperienceChange = (e) => {
        setExperienceForm({
            ...experienceForm,
            [e.target.name]: e.target.value,
        })

        setMessage('')
    }

    const handleProjectChange = (e) => {
        setProjectForm({
            ...projectForm,
            [e.target.name]: e.target.value,
        })

        setMessage('')
    }

    const addEducation = () => {
        if (
            !educationForm.school ||
            !educationForm.degree ||
            (!educationForm.departmentId && !educationForm.customDepartmentName)
        ) {
            setMessage('Please fill school, degree, and department.')
            return
        }

        const selectedDepartment = departments.find(
            (department) =>
                String(department.id || department.Id) ===
                String(educationForm.departmentId)
        )

        const educationItem = {
            ...educationForm,
            departmentName:
                educationForm.departmentId === 'other'
                    ? educationForm.customDepartmentName
                    : selectedDepartment?.name ||
                      selectedDepartment?.Name ||
                      '',
        }

        if (editingEducationIndex !== null) {
            const updatedEducations = [...educations]

            updatedEducations[editingEducationIndex] = {
                ...updatedEducations[editingEducationIndex],
                ...educationItem,
            }

            setEducations(updatedEducations)
            setEditingEducationIndex(null)
        } else {
            setEducations([...educations, educationItem])
        }

        setEducationForm({
            school: '',
            degree: '',
            departmentId: '',
            customDepartmentName: '',
            startYear: '',
            endYear: '',
            gpa: '',
            description: '',
        })

        setMessage('')
    }

    const editEducation = (index) => {
        const item = educations[index]

        setEducationForm({
            school: item.school || '',
            degree: item.degree || '',
            departmentId: item.departmentId || '',
            customDepartmentName: item.customDepartmentName || '',
            startYear: item.startYear || '',
            endYear: item.endYear || '',
            gpa: item.gpa || '',
            description: item.description || '',
        })

        setEditingEducationIndex(index)
        setMessage('')
    }

    const addExperience = () => {
        if (!experienceForm.position || !experienceForm.company) {
            setMessage('Please fill position and company.')
            return
        }

        if (editingExperienceIndex !== null) {
            const updatedExperiences = [...experiences]

            updatedExperiences[editingExperienceIndex] = {
                ...updatedExperiences[editingExperienceIndex],
                ...experienceForm,
            }

            setExperiences(updatedExperiences)
            setEditingExperienceIndex(null)
        } else {
            setExperiences([...experiences, experienceForm])
        }

        setExperienceForm({
            position: '',
            company: '',
            duration: '',
            technologies: '',
            description: '',
        })


        setMessage('')
    }

    const editExperience = (index) => {
        const item = experiences[index]

        setExperienceForm({
            position: item.position || '',
            company: item.company || '',
            duration: item.duration || '',
            technologies: item.technologies || '',
            description: item.description || '',
        })

        setEditingExperienceIndex(index)
        setMessage('')
    }

    const addProject = () => {
        if (!projectForm.title || !projectForm.technologies) {
            setMessage('Please fill project title and technologies.')
            return
        }

        if (editingProjectIndex !== null) {
            const updatedProjects = [...projects]

            updatedProjects[editingProjectIndex] = {
                ...updatedProjects[editingProjectIndex],
                ...projectForm,
            }

            setProjects(updatedProjects)
            setEditingProjectIndex(null)
        } else {
            setProjects([...projects, projectForm])
        }

        setProjectForm({
            title: '',
            technologies: '',
            githubLink: '',
            liveDemoUrl: '',
            projectType: '',
            description: '',
        })


        setMessage('')
    }

    const editProject = (index) => {
        const item = projects[index]

        setProjectForm({
            title: item.title || '',
            technologies: item.technologies || '',
            githubLink: item.githubLink || '',
            liveDemoUrl: item.liveDemoUrl || '',
            projectType: item.projectType || '',
            description: item.description || '',
        })

        setEditingProjectIndex(index)
        setMessage('')
    }

    const removeEducation = async (index) => {
        const item = educations[index]

        if (item?.id) {
            await api.delete(`/Educations/${item.id}`)
        }

        setEducations(educations.filter((_, i) => i !== index))

        if (editingEducationIndex === index) {
            setEditingEducationIndex(null)
        }
    }

    const removeExperience = async (index) => {
        const item = experiences[index]

        if (item?.id) {
            await api.delete(`/Experiences/${item.id}`)
        }

        setExperiences(experiences.filter((_, i) => i !== index))

        if (editingExperienceIndex === index) {
            setEditingExperienceIndex(null)
        }
    }

    const removeProject = async (index) => {
        const item = projects[index]

        if (item?.id) {
            await api.delete(`/Projects/${item.id}`)
        }

        setProjects(projects.filter((_, i) => i !== index))

        if (editingProjectIndex === index) {
            setEditingProjectIndex(null)
        }
    }

    const handleCvUpload = async () => {
        if (!cvFile) return

        try {
            setAnalyzing(true)
            setCvError('')
            setMessage('')

            const startTime = Date.now()

            const formData = new FormData()
            formData.append('file', cvFile)

            const response = await api.post(`/Users/${user.id}/upload-cv`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })

            const elapsedTime = Date.now() - startTime
            if (elapsedTime < 2000) {
                await new Promise((resolve) => setTimeout(resolve, 2000 - elapsedTime))
            }

            const parsedData = response.data

            if (parsedData.cvSummary) {
                setCvSummary(parsedData.cvSummary)
            }

            if (parsedData.educations && parsedData.educations.length > 0) {
                const newEducations = parsedData.educations.map((edu) => {
                    const deptId = edu.departmentId ? String(edu.departmentId) : 'other'
                    return {
                        school: edu.schoolName || '',
                        degree: edu.degreeLevel || '',
                        departmentId: deptId,
                        customDepartmentName: deptId === 'other' ? edu.departmentName || edu.customDepartmentName || '' : '',
                        departmentName: edu.departmentName || '',
                        startYear: edu.startYear && edu.startYear !== 0 ? String(edu.startYear) : '',
                        endYear: edu.endYear && edu.endYear !== 0 ? String(edu.endYear) : '',
                        gpa: edu.gpa || '',
                        description: edu.description || '',
                    }
                })
                setEducations(newEducations)
            } else {
                setEducations([])
            }

            if (parsedData.experiences && parsedData.experiences.length > 0) {
                const newExperiences = parsedData.experiences.map((exp) => ({
                    company: exp.companyName || '',
                    position: exp.position || '',
                    duration: exp.durationInMonths ? String(exp.durationInMonths) : '',
                    technologies: exp.technologies || '',
                    description: exp.description || '',
                }))
                setExperiences(newExperiences)
            } else {
                setExperiences([])
            }

            if (parsedData.projects && parsedData.projects.length > 0) {
                const newProjects = parsedData.projects.map((proj) => ({
                    title: proj.title || '',
                    projectType: proj.projectType || '',
                    technologies: proj.technologies || '',
                    githubLink: proj.githubUrl || '',
                    liveDemoUrl: proj.liveDemoUrl || '',
                    description: proj.description || '',
                }))
                setProjects(newProjects)
            } else {
                setProjects([])
            }

            setMessage('CV analyzed successfully! The fields below have been auto-populated. Please review and save your profile.')
            setCvFile(null)
        } catch (err) {
            console.error(err)
            setCvError(err.response?.data || 'Failed to analyze CV. Please check file format and connection.')
        } finally {
            setAnalyzing(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            setMessage('')

            // Delete removed/overwritten items from database
            const currentEduIds = educations.map((x) => x.id).filter(Boolean)
            const edusToDelete = originalEducationIds.filter((id) => !currentEduIds.includes(id))
            for (const id of edusToDelete) {
                await api.delete(`/Educations/${id}`)
            }

            const currentExpIds = experiences.map((x) => x.id).filter(Boolean)
            const expsToDelete = originalExperienceIds.filter((id) => !currentExpIds.includes(id))
            for (const id of expsToDelete) {
                await api.delete(`/Experiences/${id}`)
            }

            const currentProjIds = projects.map((x) => x.id).filter(Boolean)
            const projsToDelete = originalProjectIds.filter((id) => !currentProjIds.includes(id))
            for (const id of projsToDelete) {
                await api.delete(`/Projects/${id}`)
            }

            const educationText = educations
                .map(
                    (item) =>
                        `${item.degree} in ${item.departmentName || item.customDepartmentName || 'Unknown Department'} at ${item.school} (${item.startYear}-${item.endYear}). GPA: ${item.gpa}. ${item.description}`
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

            const updatedUser = {
                ...user,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                country: user.country || '',
                city: user.city || '',
                cvSummary,
                educationLevel: educationText,
                experienceText,
                projectText,
            }

            const userResponse = await api.put(`/Users/${user.id}`, updatedUser)

            for (const education of educations) {
                const payload = {
                    userId: user.id,
                    schoolName: education.school,
                    departmentId:
                        education.departmentId && education.departmentId !== 'other'
                            ? Number(education.departmentId)
                            : null,
                    customDepartmentName:
                        education.departmentId === 'other'
                            ? education.customDepartmentName
                            : '',
                    degreeLevel: education.degree,
                    startYear: Number(education.startYear || 0),
                    endYear: Number(education.endYear || 0),
                    gpa: education.gpa || '',
                    description: education.description || '',
                }

                if (education.id) {
                    await api.put(`/Educations/${education.id}`, payload)
                } else {
                    await api.post('/Educations', payload)
                }
            }

            for (const experience of experiences) {
                const payload = {
                    userId: user.id,
                    companyName: experience.company,
                    position: experience.position,
                    durationInMonths: Number(experience.duration || 0),
                    technologies: experience.technologies || '',
                    description: experience.description || '',
                }

                if (experience.id) {
                    await api.put(`/Experiences/${experience.id}`, payload)
                } else {
                    await api.post('/Experiences', payload)
                }
            }

            for (const project of projects) {
                const payload = {
                    userId: user.id,
                    title: project.title,
                    technologies: project.technologies,
                    githubUrl: project.githubLink || '',
                    liveDemoUrl: project.liveDemoUrl || '',
                    projectType: project.projectType || '',
                    description: project.description || '',
                }

                if (project.id) {
                    await api.put(`/Projects/${project.id}`, payload)
                } else {
                    await api.post('/Projects', payload)
                }
            }

            login(userResponse.data, localStorage.getItem('careercoach-token'))

            setEditingEducationIndex(null)
            setEditingExperienceIndex(null)
            setEditingProjectIndex(null)

            setMessage('Profile information saved to database successfully.')
            await fetchProfileData()
        } catch (err) {
            console.log(err.response?.data || err)
            setMessage(err.response?.data || 'Profile information could not be saved.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <MainLayout>
                <div className="modern-card">Loading profile...</div>
            </MainLayout>
        )
    }

    return (
        <MainLayout
            title="Profile & CV Information"
            subtitle="Manage your education, experience, projects and CV summary."
        >
            <style>{`
                @keyframes pulse-radar {
                    0% {
                        transform: scale(0.9);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1.4);
                        opacity: 0;
                    }
                }
                @keyframes laser-scan {
                    0% {
                        top: 10%;
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    90% {
                        opacity: 1;
                    }
                    100% {
                        top: 90%;
                        opacity: 0;
                    }
                }
            `}</style>

            {analyzing && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(6px)',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <div className="text-center p-5 rounded-4 bg-white shadow-lg border" style={{ maxWidth: '450px', width: '90%' }}>
                        <div className="mb-4 position-relative d-inline-block" style={{ width: '100px', height: '100px' }}>
                            <div
                                className="position-absolute rounded-circle border border-primary border-3 w-100 h-100"
                                style={{
                                    animation: 'pulse-radar 2s infinite ease-in-out',
                                    opacity: 0.8
                                }}
                            ></div>
                            <div
                                className="position-absolute rounded-circle border border-primary border-3 w-100 h-100"
                                style={{
                                    animation: 'pulse-radar 2s infinite ease-in-out',
                                    animationDelay: '1s',
                                    opacity: 0.4
                                }}
                            ></div>
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle">
                                <i className="bi bi-file-earmark-text text-primary fs-1"></i>
                            </div>
                            <div
                                className="position-absolute bg-primary bg-opacity-70 w-100"
                                style={{
                                    height: '4px',
                                    top: 0,
                                    boxShadow: '0 0 10px #2563eb',
                                    animation: 'laser-scan 2.5s infinite linear'
                                }}
                            ></div>
                        </div>

                        <h4 className="fw-bold text-dark mb-2">Analyzing Resume</h4>
                        <p className="text-muted mb-4 small">
                            Our AI is scanning your document to extract structured profile information...
                        </p>
                        
                        <div className="d-flex align-items-center justify-content-center gap-2 text-primary fw-semibold">
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                            <span>Parsing sections...</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="modern-card mb-4">
                {message && (
                    <div className="alert alert-info rounded-4">
                        {message}
                    </div>
                )}
                {cvError && (
                    <div className="alert alert-danger rounded-4">
                        {cvError}
                    </div>
                )}

                <h3 className="fw-bold mb-1">CV Upload & Summary</h3>
                <p className="text-muted small mb-4">
                    Upload your CV (.pdf, .docx, .doc) to automatically extract and populate your education, experience, and projects.
                </p>

                <div className="border border-dashed rounded-4 p-4 text-center bg-light mb-4" style={{ borderColor: '#2563eb', borderStyle: 'dashed', borderWidth: '2px' }}>
                    <div className="mb-3">
                        <i className="bi bi-file-earmark-arrow-up fs-1 text-primary"></i>
                    </div>
                    
                    {!cvFile ? (
                        <div>
                            <label className="btn btn-outline-primary rounded-pill px-4 py-2 cursor-pointer mb-2" style={{ cursor: 'pointer' }}>
                                Choose CV File
                                <input
                                    type="file"
                                    accept=".pdf,.docx,.doc"
                                    className="d-none"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setCvFile(e.target.files[0])
                                            setCvError('')
                                        }
                                    }}
                                />
                            </label>
                            <div className="text-muted small">Supports PDF, DOCX, and DOC (Max 5MB)</div>
                        </div>
                    ) : (
                        <div className="d-flex align-items-center justify-content-center gap-3">
                            <div className="text-start">
                                <div className="fw-semibold text-truncate" style={{ maxWidth: '300px' }}>
                                    {cvFile.name}
                                </div>
                                <div className="text-muted small">
                                    {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn btn-outline-danger btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center"
                                onClick={() => setCvFile(null)}
                                style={{ width: '32px', height: '32px', lineHeight: '1' }}
                            >
                                <span className="fw-bold">×</span>
                            </button>
                        </div>
                    )}
                </div>

                {cvFile && (
                    <button
                        type="button"
                        className="btn btn-primary w-100 rounded-4 py-2 mb-4 d-flex align-items-center justify-content-center gap-2"
                        onClick={handleCvUpload}
                        disabled={analyzing}
                    >
                        {analyzing ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                Analyzing CV & Auto-populating...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-magic"></i>
                                Analyze & Populate Profile
                            </>
                        )}
                    </button>
                )}

                <h5 className="fw-bold mb-2">Extracted CV Summary</h5>
                <textarea
                    rows="4"
                    className="form-control rounded-4"
                    placeholder="Extract your CV or write a short intro..."
                    value={cvSummary}
                    onChange={(e) => setCvSummary(e.target.value)}
                />
            </div>

            <div className="modern-card mb-4">
                <h3 className="fw-bold mb-3">Education</h3>

                <div className="row g-3">
                    <div className="col-md-6">
                        <input
                            name="school"
                            className="form-control rounded-4"
                            placeholder="School / University"
                            value={educationForm.school}
                            onChange={handleEducationChange}
                        />
                    </div>

                    <div className="col-md-6">
                        <input
                            name="degree"
                            className="form-control rounded-4"
                            placeholder="Degree"
                            value={educationForm.degree}
                            onChange={handleEducationChange}
                        />
                    </div>

                    <div className="col-md-6">
                        <select
                            name="departmentId"
                            className="form-select rounded-4"
                            value={educationForm.departmentId}
                            onChange={handleEducationChange}
                        >
                            <option value="">Select Department</option>

                            {departments.map((department) => (
                                <option
                                    key={department.id || department.Id}
                                    value={department.id || department.Id}
                                >
                                    {department.name || department.Name}
                                </option>
                            ))}

                            <option value="other">Other</option>
                        </select>

                        {educationForm.departmentId === 'other' && (
                            <input
                                name="customDepartmentName"
                                className="form-control rounded-4 mt-2"
                                placeholder="Write your department"
                                value={educationForm.customDepartmentName}
                                onChange={handleEducationChange}
                            />
                        )}
                    </div>

                    <div className="col-md-3">
                        <input
                            name="startYear"
                            className="form-control rounded-4"
                            placeholder="Start Year"
                            value={educationForm.startYear}
                            onChange={handleEducationChange}
                        />
                    </div>

                    <div className="col-md-3">
                        <input
                            name="endYear"
                            className="form-control rounded-4"
                            placeholder="End Year"
                            value={educationForm.endYear}
                            onChange={handleEducationChange}
                        />
                    </div>

                    <div className="col-md-4">
                        <input
                            name="gpa"
                            className="form-control rounded-4"
                            placeholder="GPA optional"
                            value={educationForm.gpa}
                            onChange={handleEducationChange}
                        />
                    </div>

                    <div className="col-md-8">
                        <input
                            name="description"
                            className="form-control rounded-4"
                            placeholder="Description optional"
                            value={educationForm.description}
                            onChange={handleEducationChange}
                        />
                    </div>
                </div>

                <button
                    type="button"
                    className="btn btn-outline-primary rounded-4 mt-3"
                    onClick={addEducation}
                >
                    {editingEducationIndex !== null
                        ? 'Update Education'
                        : 'Add Education'}
                </button>

                <div className="row g-3 mt-3">
                    {educations.map((item, index) => (
                        <div className="col-md-6" key={index}>
                            <div className="border rounded-4 p-3">
                                <div className="d-flex justify-content-between align-items-start">
                                    <h5 className="fw-bold mb-1">
                                        {item.school}
                                    </h5>

                                    <div className="d-flex gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary rounded-pill"
                                            onClick={() => editEducation(index)}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger rounded-pill"
                                            onClick={() => removeEducation(index)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>

                                <p className="mb-1">
                                    {item.degree} -{' '}
                                    {item.departmentName ||
                                        item.customDepartmentName}
                                </p>

                                <p className="text-muted mb-1">
                                    {item.startYear} - {item.endYear}
                                </p>

                                <p className="text-muted mb-0">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="modern-card mb-4">
                <h3 className="fw-bold mb-3">Experience</h3>

                <div className="row g-3">
                    <div className="col-md-6">
                        <input
                            name="position"
                            className="form-control rounded-4"
                            placeholder="Position"
                            value={experienceForm.position}
                            onChange={handleExperienceChange}
                        />
                    </div>

                    <div className="col-md-6">
                        <input
                            name="company"
                            className="form-control rounded-4"
                            placeholder="Company"
                            value={experienceForm.company}
                            onChange={handleExperienceChange}
                        />
                    </div>

                    <div className="col-md-6">
                        <input
                            name="duration"
                            className="form-control rounded-4"
                            placeholder="Duration in months"
                            value={experienceForm.duration}
                            onChange={handleExperienceChange}
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label fw-semibold mb-1">Technologies Used</label>
                        <select
                            className="form-select rounded-4"
                            value=""
                            onChange={(e) => {
                                const selected = e.target.value;
                                if (selected) {
                                    const current = experienceForm.technologies
                                        ? experienceForm.technologies.split(',').map(t => t.trim()).filter(Boolean)
                                        : [];
                                    if (!current.includes(selected)) {
                                        const newVal = [...current, selected].join(', ');
                                        setExperienceForm({ ...experienceForm, technologies: newVal });
                                    }
                                    e.target.value = "";
                                }
                            }}
                        >
                            <option value="">Select from list...</option>
                            {skills.filter(s => s.skillType === "Technical" || s.SkillType === "Technical").map(s => (
                                <option key={s.id || s.Id} value={s.name || s.Name}>
                                    {s.name || s.Name}
                                </option>
                            ))}
                        </select>
                        
                        <div className="d-flex flex-wrap gap-2 mt-2">
                            {(experienceForm.technologies || "").split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                                <span key={tag} className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-2 d-flex align-items-center gap-2">
                                    {tag}
                                    <button
                                        type="button"
                                        className="btn-close"
                                        style={{ fontSize: '0.6rem' }}
                                        onClick={() => {
                                            const current = experienceForm.technologies.split(',').map(t => t.trim()).filter(Boolean);
                                            const newVal = current.filter(t => t !== tag).join(', ');
                                            setExperienceForm({ ...experienceForm, technologies: newVal });
                                        }}
                                    ></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="col-12">
                        <textarea
                            name="description"
                            rows="3"
                            className="form-control rounded-4"
                            placeholder="Experience description"
                            value={experienceForm.description}
                            onChange={handleExperienceChange}
                        />
                    </div>
                </div>

                <button
                    type="button"
                    className="btn btn-outline-primary rounded-4 mt-3"
                    onClick={addExperience}
                >
                    {editingExperienceIndex !== null
                        ? 'Update Experience'
                        : 'Add Experience'}
                </button>

                <div className="row g-3 mt-3">
                    {experiences.map((item, index) => (
                        <div className="col-md-6" key={index}>
                            <div className="border rounded-4 p-3">
                                <div className="d-flex justify-content-between align-items-start">
                                    <h5 className="fw-bold mb-1">
                                        {item.position}
                                    </h5>

                                    <div className="d-flex gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary rounded-pill"
                                            onClick={() => editExperience(index)}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger rounded-pill"
                                            onClick={() => removeExperience(index)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>

                                <p className="mb-1">
                                    {item.company} - {item.duration} months
                                </p>

                                <p className="text-muted mb-1">
                                    {item.technologies}
                                </p>

                                <p className="text-muted mb-0">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="modern-card mb-4">
                <h3 className="fw-bold mb-3">Projects</h3>

                <div className="row g-3">
                    <div className="col-md-6">
                        <input
                            name="title"
                            className="form-control rounded-4"
                            placeholder="Project Title"
                            value={projectForm.title}
                            onChange={handleProjectChange}
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label fw-semibold mb-1">Technologies Used</label>
                        <select
                            className="form-select rounded-4"
                            value=""
                            onChange={(e) => {
                                const selected = e.target.value;
                                if (selected) {
                                    const current = projectForm.technologies
                                        ? projectForm.technologies.split(',').map(t => t.trim()).filter(Boolean)
                                        : [];
                                    if (!current.includes(selected)) {
                                        const newVal = [...current, selected].join(', ');
                                        setProjectForm({ ...projectForm, technologies: newVal });
                                    }
                                    e.target.value = "";
                                }
                            }}
                        >
                            <option value="">Select from list...</option>
                            {skills.filter(s => s.skillType === "Technical" || s.SkillType === "Technical").map(s => (
                                <option key={s.id || s.Id} value={s.name || s.Name}>
                                    {s.name || s.Name}
                                </option>
                            ))}
                        </select>
                        
                        <div className="d-flex flex-wrap gap-2 mt-2">
                            {(projectForm.technologies || "").split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                                <span key={tag} className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-2 d-flex align-items-center gap-2">
                                    {tag}
                                    <button
                                        type="button"
                                        className="btn-close"
                                        style={{ fontSize: '0.6rem' }}
                                        onClick={() => {
                                            const current = projectForm.technologies.split(',').map(t => t.trim()).filter(Boolean);
                                            const newVal = current.filter(t => t !== tag).join(', ');
                                            setProjectForm({ ...projectForm, technologies: newVal });
                                        }}
                                    ></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="col-md-6">
                        <input
                            name="projectType"
                            className="form-control rounded-4"
                            placeholder="Project Type: Web App, API, AI..."
                            value={projectForm.projectType}
                            onChange={handleProjectChange}
                        />
                    </div>

                    <div className="col-md-6">
                        <input
                            name="githubLink"
                            className="form-control rounded-4"
                            placeholder="GitHub Link optional"
                            value={projectForm.githubLink}
                            onChange={handleProjectChange}
                        />
                    </div>

                    <div className="col-12">
                        <input
                            name="liveDemoUrl"
                            className="form-control rounded-4"
                            placeholder="Live Demo URL optional"
                            value={projectForm.liveDemoUrl}
                            onChange={handleProjectChange}
                        />
                    </div>

                    <div className="col-12">
                        <textarea
                            name="description"
                            rows="3"
                            className="form-control rounded-4"
                            placeholder="Project description"
                            value={projectForm.description}
                            onChange={handleProjectChange}
                        />
                    </div>
                </div>

                <button
                    type="button"
                    className="btn btn-outline-primary rounded-4 mt-3"
                    onClick={addProject}
                >
                    {editingProjectIndex !== null
                        ? 'Update Project'
                        : 'Add Project'}
                </button>

                <div className="row g-3 mt-3">
                    {projects.map((item, index) => (
                        <div className="col-md-6" key={index}>
                            <div className="border rounded-4 p-3">
                                <div className="d-flex justify-content-between align-items-start">
                                    <h5 className="fw-bold mb-1">
                                        {item.title}
                                    </h5>

                                    <div className="d-flex gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary rounded-pill"
                                            onClick={() => editProject(index)}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger rounded-pill"
                                            onClick={() => removeProject(index)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>

                                <p className="text-muted mb-1">
                                    {item.projectType}
                                </p>

                                <p className="text-muted mb-1">
                                    {item.technologies}
                                </p>

                                <p className="mb-1">
                                    {item.description}
                                </p>

                                {item.githubLink && (
                                    <a
                                        href={item.githubLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="me-3"
                                    >
                                        GitHub
                                    </a>
                                )}

                                {item.liveDemoUrl && (
                                    <a
                                        href={item.liveDemoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Live Demo
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button
                className="btn btn-primary rounded-4 px-5 py-3"
                onClick={handleSave}
                disabled={saving}
            >
                {saving ? 'Saving...' : 'Save Profile Info'}
            </button>
        </MainLayout>
    )
}

export default Profile