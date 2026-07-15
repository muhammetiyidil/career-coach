import { useEffect, useMemo, useState } from 'react'
import MainLayout from '../layout/MainLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import {
    getCareerRecommendations,
    completeLearningTask,
    getRoadmapStates,
    saveRoadmapState,
} from '../services/aiService'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function LearningRoadmap() {
    const { user } = useAuth()

    const [roadmapMode, setRoadmapMode] = useState('career')
    const [selectedCareers, setSelectedCareers] = useState([])
    const [selectedUserSkills, setSelectedUserSkills] = useState([])
    const [platforms, setPlatforms] = useState([])
    const [jobPlatforms, setJobPlatforms] = useState([])

    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [warningMessage, setWarningMessage] = useState('')

    const [reflectionTexts, setReflectionTexts] = useState({})
    const [roadmapForms, setRoadmapForms] = useState({})

    const [searchText, setSearchText] = useState('')
    const [careerFilter, setCareerFilter] = useState('all')
    const [skillTypeFilter, setSkillTypeFilter] = useState('all')
    const [completionFilter, setCompletionFilter] = useState('notCompleted')

    useEffect(() => {
        if (user?.id) {
            fetchAllData()
        }
    }, [user])

    const fetchAllData = async () => {
        setLoading(true)

        await fetchRoadmap()

        await Promise.all([
            fetchSelectedUserSkills(),
            fetchRoadmapStates(),
            fetchPlatforms(),
            fetchJobPlatforms(),
        ])

        setLoading(false)
    }

    const fetchRoadmap = async () => {
        try {
            const allMatches = await getCareerRecommendations(user.id)

            const personalResponse = await api.get(`/UserPersonalSkillProgress/user/${user.id}`)
            const personalProgresses = personalResponse.data || []

            const enrichPersonalSkill = (skill) => {
                const skillId = Number(skill.skillId || skill.SkillId || skill.id || skill.Id)

                const personalProgress = personalProgresses.find((item) =>
                    Number(item.skillId || item.SkillId) === skillId
                )

                if (!personalProgress) {
                    return skill
                }

                const progressPercent = Number(
                    personalProgress.progressPercentage ??
                    personalProgress.ProgressPercentage ??
                    0
                )

                return {
                    ...skill,
                    personalPercent: progressPercent,
                    userLevel:
                        progressPercent >= 100
                            ? 3
                            : progressPercent >= 66
                                ? 2
                                : progressPercent >= 33
                                    ? 1
                                    : 0,
                    personalTask1Completed: Boolean(
                        personalProgress.task1Completed ??
                        personalProgress.Task1Completed ??
                        false
                    ),
                    personalTask2Completed: Boolean(
                        personalProgress.task2Completed ??
                        personalProgress.Task2Completed ??
                        false
                    ),
                    personalTask3Completed: Boolean(
                        personalProgress.task3Completed ??
                        personalProgress.Task3Completed ??
                        false
                    ),
                }
            }

            const dbSelections = await api
                .get(`/UserCareers/user/${user.id}`)
                .then((r) => r.data || [])
                .catch(() => [])

            const savedCareersFromStorage =
                JSON.parse(localStorage.getItem('careercoach-selected-careers') || 'null') || []

            const savedCareerIds = [
                ...new Set([
                    ...dbSelections.map((c) => Number(c.careerId || c.CareerId)),
                    ...savedCareersFromStorage.map((c) => Number(c.careerId || c.CareerId)),
                ]),
            ].filter(Boolean)

            const filteredCareers = allMatches
                .filter((match) =>
                    savedCareerIds.includes(Number(match.careerId || match.CareerId))
                )
                .map((career) => ({
                    ...career,
                    missingSkills: (career.missingSkills || []).map(enrichPersonalSkill),
                    matchedSkills: (career.matchedSkills || []).map(enrichPersonalSkill),
                }))

            if (filteredCareers.length) {
                localStorage.setItem(
                    'careercoach-selected-careers',
                    JSON.stringify(filteredCareers)
                )
            }

            const requiredSkillIds = [
                ...new Set(
                    filteredCareers.flatMap((career) =>
                        (career.missingSkills || [])
                            .map((skill) =>
                                Number(skill.skillId || skill.SkillId || skill.id || skill.Id)
                            )
                            .filter(Boolean)
                    )
                ),
            ]

            try {
                const userSkillResponse = await api.get(`/UserSkills/user/${user.id}`)

                const existingUserSkillIds =
                    (userSkillResponse.data || []).map((item) =>
                        Number(item.skillId || item.SkillId)
                    )

                for (const skillId of requiredSkillIds) {
                    if (!existingUserSkillIds.includes(skillId)) {
                        await api.post('/UserSkills', {
                            userId: Number(user.id),
                            skillId: Number(skillId),
                            level: 1,
                        })
                    }
                }
            } catch (err) {
                console.log('Career required skills could not be synced:', err)
            }

            setSelectedCareers(filteredCareers)
        } catch (err) {
            console.log(err)
            setMessage('Career based roadmap could not be loaded.')
        }
    }

    const fetchSelectedUserSkills = async () => {
        try {
            const [userSkillResponse, personalResponse, skillResponse] = await Promise.all([
                api.get(`/UserSkills/user/${user.id}`),
                api.get(`/UserPersonalSkillProgress/user/${user.id}`),
                api.get('/Skills'),
            ])

            const userSkills = userSkillResponse.data || []
            const personalProgresses = personalResponse.data || []
            const allSkills = skillResponse.data || []

            const selectedIds = [
                ...new Set([
                    ...userSkills.map((x) => Number(x.skillId || x.SkillId)),
                    ...personalProgresses.map((x) => Number(x.skillId || x.SkillId)),
                ]),
            ]

            const mappedSkills = selectedIds
                .map((skillId) => {
                    const skill = allSkills.find((s) => Number(s.id || s.Id) === skillId)
                    if (!skill) return null

                    const userSkill = userSkills.find(
                        (x) => Number(x.skillId || x.SkillId) === skillId
                    )

                    const personalProgress = personalProgresses.find(
                        (x) => Number(x.skillId || x.SkillId) === skillId
                    )

                    const skillType = skill.skillType || skill.SkillType || ''
                    const skillCategory = skill.category || skill.Category || ''

                    const isPersonal =
                        skillType === 'Personal' || skillCategory === 'Personal'

                    const progressPercent = Number(
                        personalProgress?.progressPercentage ??
                        personalProgress?.ProgressPercentage ??
                        0
                    )

                    const currentLevel = isPersonal
                        ? percentToPersonalLevel(progressPercent)
                        : Number(userSkill?.level ?? userSkill?.Level ?? 0)

                    return {
                        skillId,
                        id: skillId,
                        skillName: skill.name || skill.Name || '-',
                        skillType: isPersonal ? 'Personal' : 'Technical',
                        skillCategory: isPersonal ? 'Personal' : (skillCategory || skillType),
                        userLevel: currentLevel,
                        requiredLevel: isPersonal ? 100 : 5,
                        personalPercent: isPersonal ? progressPercent : 0,
                        personalTask1Completed: Boolean(
                            personalProgress?.task1Completed ??
                            personalProgress?.Task1Completed ??
                            false
                        ),
                        personalTask2Completed: Boolean(
                            personalProgress?.task2Completed ??
                            personalProgress?.Task2Completed ??
                            false
                        ),
                        personalTask3Completed: Boolean(
                            personalProgress?.task3Completed ??
                            personalProgress?.Task3Completed ??
                            false
                        ),

                        recommendationLevel: isPersonal
                            ? `${progressPercent}%`
                            : currentLevel === 0
                                ? 'No Knowledge'
                                : currentLevel === 1
                                    ? 'Beginner'
                                    : currentLevel === 2
                                        ? 'Basic'
                                        : currentLevel === 3
                                            ? 'Intermediate'
                                            : currentLevel === 4
                                                ? 'Advanced'
                                                : 'Expert',

                        practiceTask: isPersonal
                            ? (
                                skill.personalDevelopmentActivityTemplate ||
                                skill.PersonalDevelopmentActivityTemplate ||
                                'Complete one development activity for this personal skill.'
                            )
                            : `Practice ${skill.name || skill.Name} with a small hands-on task.`,

                        caseStudy: isPersonal
                            ? (
                                skill.personalReflectionTemplate ||
                                skill.PersonalReflectionTemplate ||
                                'Write a short reflection about how you used this skill.'
                            )
                            : `Review a real-world example related to ${skill.name || skill.Name}.`,

                        projectSuggestion: isPersonal
                            ? (
                                skill.personalRealLifeExerciseTemplate ||
                                skill.PersonalRealLifeExerciseTemplate ||
                                'Create a personal development plan for this skill.'
                            )
                            : `Create a small project using ${skill.name || skill.Name}.`,

                        projectDescription: isPersonal
                            ? (
                                skill.personalFeedbackTemplate ||
                                skill.PersonalFeedbackTemplate ||
                                'Explain how you will improve this personal skill over time.'
                            )
                            : 'Describe what you built, what you learned, and what can be improved.',

                        taskTitle: isPersonal
                            ? `${skill.name || skill.Name} Personal Development Activity`
                            : `${skill.name || skill.Name} Level Improvement`,

                        taskType: isPersonal
                            ? 'Personal Development'
                            : 'Technical Skill Development',

                        developmentActivities: [
                            skill.personalDevelopmentActivityTemplate || skill.PersonalDevelopmentActivityTemplate,
                            skill.personalReflectionTemplate || skill.PersonalReflectionTemplate,
                            skill.personalFeedbackTemplate || skill.PersonalFeedbackTemplate,
                            skill.personalRealLifeExerciseTemplate || skill.PersonalRealLifeExerciseTemplate,
                        ].filter(Boolean),
                    }
                })
                .filter(Boolean)

            setSelectedUserSkills(mappedSkills)
        } catch (err) {
            console.log(err)
            setSelectedUserSkills([])
        }
    }

    const fetchPlatforms = async () => {
        try {
            const response = await api.get('/LearningPlatforms/active')
            setPlatforms(response.data || [])
        } catch (err) {
            console.log(err)
            setPlatforms([])
        }
    }

    const fetchJobPlatforms = async () => {
        try {
            const response = await api.get('/JobPlatforms/active')
            setJobPlatforms(response.data || [])
        } catch (err) {
            console.log(err)
            setJobPlatforms([])
        }
    }

    const safeParsePlatforms = (value) => {
        if (!value) return []
        if (Array.isArray(value)) return value

        try {
            const parsed = JSON.parse(value)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    }

    const getSkillKey = (skill) => {
        const skillId = skill.skillId || skill.id

        if (isPersonalSkill(skill)) {
            return `${skillId}-personal`
        }

        const fromLevel = skill.userLevel || 0
        const toLevel = Math.min(
            (skill.userLevel || 0) + 1,
            skill.requiredLevel || 0
        )

        return `${skillId}-${fromLevel}-${toLevel}`
    }

    const fetchRoadmapStates = async () => {
        try {
            const states = await getRoadmapStates(user.id)
            const mapped = {}

            states.forEach((item) => {
                const skillId = item.skillId || item.SkillId
                const fromLevel = item.fromLevel || item.FromLevel || 0
                const toLevel = item.toLevel || item.ToLevel || 0
                const key = `${skillId}-${fromLevel}-${toLevel}`
                const personalKey = `${skillId}-personal`

                const formData = {
                    selectedPlatforms: safeParsePlatforms(
                        item.selectedPlatforms || item.SelectedPlatforms
                    ),

                    isMarkedCompleted:
                        item.isCompleted ||
                        item.IsCompleted ||
                        false,

                    isPracticeTaskCompleted:
                        item.isPracticeTaskCompleted ||
                        item.IsPracticeTaskCompleted ||
                        false,

                    practiceTaskDescription:
                        item.practiceTaskDescription ||
                        item.PracticeTaskDescription ||
                        '',

                    isCaseStudyCompleted:
                        item.isCaseStudyCompleted ||
                        item.IsCaseStudyCompleted ||
                        false,

                    caseStudyDescription:
                        item.caseStudyDescription ||
                        item.CaseStudyDescription ||
                        '',

                    isProjectCompleted:
                        item.isProjectCompleted ||
                        item.IsProjectCompleted ||
                        false,

                    projectDescription:
                        item.projectDescription ||
                        item.ProjectDescription ||
                        '',
                }

                mapped[key] = formData

                if (
                    !mapped[personalKey] ||
                    formData.isMarkedCompleted ||
                    !mapped[personalKey].isMarkedCompleted
                ) {
                    mapped[personalKey] = formData
                }
            })

            setRoadmapForms(mapped)
        } catch (err) {
            console.log(err)
        }
    }

    const getForm = (skill) => {
        const key = getSkillKey(skill)
        const existingForm = roadmapForms[key]

        if (isPersonalSkill(skill)) {
            return {
                selectedPlatforms: [],
                isMarkedCompleted: Boolean(
                    existingForm?.isMarkedCompleted ||
                    skill.isMarkedCompleted ||
                    skill.isCompleted ||
                    skill.IsCompleted
                ),

                isPracticeTaskCompleted:
                    Boolean(existingForm?.isPracticeTaskCompleted) ||
                    Boolean(skill.personalTask1Completed),

                practiceTaskDescription:
                    existingForm?.practiceTaskDescription || '',

                isCaseStudyCompleted:
                    Boolean(existingForm?.isCaseStudyCompleted) ||
                    Boolean(skill.personalTask2Completed),

                caseStudyDescription:
                    existingForm?.caseStudyDescription || '',

                isProjectCompleted:
                    Boolean(existingForm?.isProjectCompleted) ||
                    Boolean(skill.personalTask3Completed),

                projectDescription:
                    existingForm?.projectDescription || '',
            }
        }

        return existingForm || {
            selectedPlatforms: [],
            isMarkedCompleted: false,
            isPracticeTaskCompleted: false,
            practiceTaskDescription: '',
            isCaseStudyCompleted: false,
            caseStudyDescription: '',
            isProjectCompleted: false,
            projectDescription: '',
        }
    }

    const isPersonalSkill = (skill) =>
        skill.skillType === 'Personal' || skill.skillCategory === 'Personal'

    const convertPersonalLevelToPercent = (level) => {
        if (level <= 0) return 0
        if (level === 1) return 33
        if (level === 2) return 66
        return 100
    }

    const percentToPersonalLevel = (percent) => {
        if (percent >= 100) return 3
        if (percent >= 66) return 2
        if (percent >= 33) return 1
        return 0
    }

    const isCareerSkillCompleted = (skill) => {
        const personal = isPersonalSkill(skill)

        if (personal) {
            const form = getForm(skill)

            return Boolean(
                form.isMarkedCompleted ||
                skill.isMarkedCompleted ||
                skill.isCompleted ||
                skill.IsCompleted
            )
        }

        const currentLevel = Number(skill.userLevel || 0)
        const requiredLevel = Number(skill.requiredLevel || 0)

        return requiredLevel > 0 && currentLevel >= requiredLevel
    }

    const isSkillBasedCompleted = (skill) => {
        const personal = isPersonalSkill(skill)

        if (personal) {
            const form = getForm(skill)

            return Boolean(
                form.isMarkedCompleted ||
                skill.isMarkedCompleted ||
                skill.isCompleted ||
                skill.IsCompleted
            )
        }

        return Number(skill.userLevel || 0) >= 5
    }

    const updateForm = async (skill, field, value) => {
        const key = getSkillKey(skill)
        const personal = isPersonalSkill(skill)

        const updatedForm = {
            ...getForm(skill),
            [field]: value,
        }

        setRoadmapForms((prev) => ({
            ...prev,
            [key]: updatedForm,
        }))

        try {
            await saveRoadmapState({
                userId: Number(user.id),
                skillId: Number(skill.skillId || skill.id),
                fromLevel: Number(skill.userLevel || 0),
                toLevel: Number(
                    Math.min(
                        (skill.userLevel || 0) + 1,
                        skill.requiredLevel || 0
                    )
                ),
                selectedPlatforms: JSON.stringify(updatedForm.selectedPlatforms || []),
                isCompleted: updatedForm.isMarkedCompleted || false,
                isPracticeTaskCompleted: updatedForm.isPracticeTaskCompleted,
                practiceTaskDescription: updatedForm.practiceTaskDescription || '',
                isCaseStudyCompleted: updatedForm.isCaseStudyCompleted,
                caseStudyDescription: updatedForm.caseStudyDescription || '',
                isProjectCompleted: updatedForm.isProjectCompleted,
                projectDescription: updatedForm.projectDescription || '',
            })

            if (personal) {
                const progress =
                    (updatedForm.isPracticeTaskCompleted ? 33 : 0) +
                    (updatedForm.isCaseStudyCompleted ? 33 : 0) +
                    (updatedForm.isProjectCompleted ? 34 : 0)

                await api.post('/UserPersonalSkillProgress/save', {
                    userId: Number(user.id),
                    skillId: Number(skill.skillId || skill.id),
                    hasThisSkill: progress === 100,
                    task1Completed: updatedForm.isPracticeTaskCompleted,
                    task2Completed: updatedForm.isCaseStudyCompleted,
                    task3Completed: updatedForm.isProjectCompleted,
                    progressPercentage: progress,
                })

                setSelectedUserSkills((prev) =>
                    prev.map((item) =>
                        Number(item.skillId || item.id) === Number(skill.skillId || skill.id)
                            ? {
                                ...item,
                                personalPercent: progress,
                                userLevel:
                                    progress >= 100
                                        ? 3
                                        : progress >= 66
                                            ? 2
                                            : progress >= 33
                                                ? 1
                                                : 0,
                            }
                            : item
                    )
                )
            }
        } catch (err) {
            console.log(err)
        }
    }

    const togglePlatform = (skill, platformName, checked) => {
        const form = getForm(skill)
        let updatedPlatforms = [...(form.selectedPlatforms || [])]

        if (checked) {
            if (!updatedPlatforms.includes(platformName)) {
                updatedPlatforms.push(platformName)
            }
        } else {
            updatedPlatforms = updatedPlatforms.filter((name) => name !== platformName)
        }

        updateForm(skill, 'selectedPlatforms', updatedPlatforms)
    }

    const handleReflectionChange = (skillId, value) => {
        setReflectionTexts((prev) => ({
            ...prev,
            [skillId]: value,
        }))
    }

    const isTechnicalProjectRequired = (skill) => {
        if (isPersonalSkill(skill)) {
            return true
        }

        return Number(skill.userLevel || 0) >= 2
    }

    const validateTechnicalForm = (form, skill) => {
        if (!form.selectedPlatforms || form.selectedPlatforms.length === 0) {
            return 'Please select at least one learning resource.'
        }

        if (!form.isPracticeTaskCompleted) {
            return 'Please mark the practice task as completed.'
        }

        if (!form.isCaseStudyCompleted) {
            return 'Please mark the case study as completed.'
        }

        if (isTechnicalProjectRequired(skill) && !form.isProjectCompleted) {
            return 'Please mark the project task as completed.'
        }

        return ''
    }

    const showWarning = (text) => {
        setWarningMessage(text)

        setTimeout(() => {
            setWarningMessage('')
        }, 4000)
    }

    const handleCompleteTask = async (skill) => {
        try {
            setMessage('')

            const realSkillId = skill.skillId || skill.id
            const personal = isPersonalSkill(skill)
            const form = getForm(skill)
            const formKey = getSkillKey(skill)

            if (!personal) {
                const validationMessage = validateTechnicalForm(form, skill)

                if (validationMessage) {
                    showWarning(validationMessage)
                    return
                }
            }

            if (personal) {
                if (
                    !form.isPracticeTaskCompleted ||
                    !form.isCaseStudyCompleted ||
                    !form.isProjectCompleted
                ) {
                    showWarning(
                        'Please complete Development Activities, Reflection Task and Personal Development Plan before marking this activity as completed.'
                    )
                    return
                }
            }

            const payload = {
                userId: Number(user.id),
                skillId: Number(realSkillId),
                taskTitle: skill.taskTitle,
                taskType: skill.taskType,
                reflectionText: reflectionTexts[realSkillId] || '',
                isCompleted: true,
                selectedPlatforms: JSON.stringify(form.selectedPlatforms || []),
                isPracticeTaskCompleted: form.isPracticeTaskCompleted,
                practiceTaskDescription: form.practiceTaskDescription,
                isCaseStudyCompleted: form.isCaseStudyCompleted,
                caseStudyDescription: form.caseStudyDescription,
                isProjectCompleted: form.isProjectCompleted,
                projectDescription: form.projectDescription,
            }

            await completeLearningTask(payload)

            await saveRoadmapState({
                userId: Number(user.id),
                skillId: Number(realSkillId),
                fromLevel: Number(skill.userLevel || 0),
                toLevel: Number(
                    Math.min(
                        (skill.userLevel || 0) + 1,
                        skill.requiredLevel || 0
                    )
                ),
                selectedPlatforms: JSON.stringify(form.selectedPlatforms || []),
                isCompleted: true,
                isPracticeTaskCompleted: form.isPracticeTaskCompleted,
                practiceTaskDescription: form.practiceTaskDescription || '',
                isCaseStudyCompleted: form.isCaseStudyCompleted,
                caseStudyDescription: form.caseStudyDescription || '',
                isProjectCompleted: form.isProjectCompleted,
                projectDescription: form.projectDescription || '',
            })

            setRoadmapForms((prev) => ({
                ...prev,
                [formKey]: {
                    ...getForm(skill),
                    isMarkedCompleted: true,
                },
                [`${realSkillId}-personal`]: {
                    ...getForm(skill),
                    isMarkedCompleted: true,
                },
            }))

            setReflectionTexts((prev) => ({
                ...prev,
                [realSkillId]: '',
            }))

            setMessage(
                personal
                    ? `${skill.skillName} activity completed successfully.`
                    : `${skill.skillName} level increased successfully.`
            )

            await fetchAllData()
        } catch (err) {
            console.log(err.response?.data || err)

            setMessage(
                err.response?.data ||
                'Task could not be completed.'
            )
        }
    }

    const clearFilters = () => {
        setSearchText('')
        setCareerFilter('all')
        setSkillTypeFilter('all')
        setCompletionFilter('all')
    }

    const filterSkillList = (skills) => {
        return skills.filter((skill) => {
            const personal = isPersonalSkill(skill)

            const search = searchText.toLowerCase()
            const matchesSearch =
                searchText.trim() === '' ||
                (skill.skillName || '').toLowerCase().includes(search) ||
                (skill.taskTitle || '').toLowerCase().includes(search)

            const matchesSkillType =
                skillTypeFilter === 'all' ||
                (skillTypeFilter === 'technical' && !personal) ||
                (skillTypeFilter === 'personal' && personal)

            const completed =
                roadmapMode === 'career'
                    ? isCareerSkillCompleted(skill)
                    : isSkillBasedCompleted(skill)

            const matchesCompletion =
                completionFilter === 'all' ||
                (completionFilter === 'completed' && completed) ||
                (completionFilter === 'notCompleted' && !completed)

            return matchesSearch && matchesSkillType && matchesCompletion
        })
    }

    const filteredSkillBasedSkills = useMemo(() => {
        return filterSkillList(selectedUserSkills)
    }, [
        selectedUserSkills,
        searchText,
        skillTypeFilter,
        completionFilter,
        roadmapForms,
    ])

    const filteredCareers = useMemo(() => {
        return selectedCareers
            .filter((career) => {
                if (careerFilter !== 'all' && String(career.careerId) !== careerFilter) {
                    return false
                }

                if (searchText.trim() !== '') {
                    const search = searchText.toLowerCase()

                    const careerText = `
                        ${career.careerTitle || ''}
                        ${career.careerDescription || ''}
                    `.toLowerCase()

                    const skillText = (career.missingSkills || [])
                        .map((skill) => `
                            ${skill.skillName || ''}
                            ${skill.skillType || ''}
                            ${skill.skillCategory || ''}
                            ${skill.practiceTask || ''}
                            ${skill.caseStudy || ''}
                            ${skill.projectSuggestion || ''}
                        `)
                        .join(' ')
                        .toLowerCase()

                    if (!careerText.includes(search) && !skillText.includes(search)) {
                        return false
                    }
                }

                return true
            })
            .map((career) => {
                const careerSkills =
                    completionFilter === 'completed'
                        ? (career.matchedSkills || [])
                        : completionFilter === 'all'
                            ? [
                                ...(career.missingSkills || []),
                                ...(career.matchedSkills || []),
                            ]
                            : (career.missingSkills || [])

                const visibleMissingSkills = filterSkillList(careerSkills)

                return {
                    ...career,
                    visibleMissingSkills,
                }
            })
            .filter((career) => career.visibleMissingSkills.length > 0)
    }, [
        selectedCareers,
        searchText,
        careerFilter,
        skillTypeFilter,
        completionFilter,
        roadmapForms,
    ])

    const renderSkillCard = (skill) => {
        const personal = isPersonalSkill(skill)
        const form = getForm(skill)
        const currentLevel = Number(skill.userLevel ?? skill.UserLevel ?? 0)
        const requiredLevel =
            roadmapMode === 'skills' && !personal
                ? 5
                : Number(skill.requiredLevel ?? skill.RequiredLevel ?? 0)
        const completed =
            roadmapMode === 'career'
                ? isCareerSkillCompleted(skill)
                : isSkillBasedCompleted(skill)

        const fullyCompleted =
            roadmapMode === 'career'
                ? (
                    personal
                        ? isCareerSkillCompleted(skill)
                        : requiredLevel > 0 && currentLevel >= requiredLevel
                )
                : completed

        const personalPercent = personal
            ? Math.max(
                Number(skill.personalPercent || 0),
                (form.isPracticeTaskCompleted ? 33 : 0) +
                (form.isCaseStudyCompleted ? 33 : 0) +
                (form.isProjectCompleted ? 34 : 0)
            )
            : convertPersonalLevelToPercent(skill.userLevel || 0)

        const projectRequired = isTechnicalProjectRequired(skill)

        return (
            <div className="col-md-6" key={getSkillKey(skill)}>
                <div className="career-card-modern">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <span className="career-badge">
                                {personal ? 'Personal' : 'Technical / Domain'}
                            </span>

                            <h4>{skill.skillName}</h4>
                        </div>

                        {!personal && (
                            <div className="match-circle">
                                {currentLevel}/{roadmapMode === 'skills' ? 5 : requiredLevel}
                            </div>
                        )}

                        {personal && (
                            <div className="match-circle">
                                {personalPercent}%
                            </div>
                        )}
                    </div>

                    {!personal && !fullyCompleted && (
                        <>
                            <p>
                                Current Level: <strong>{currentLevel}</strong>
                                {' '} / Required Level: <strong>{requiredLevel}</strong>
                            </p>

                            <div className="border rounded-4 p-3 mb-3">
                                <h6 className="fw-bold mb-2">Learning Resources</h6>
                                <p className="text-muted small mb-3">
                                    Please select at least one learning resource before completing this task.
                                </p>

                                {platforms.length === 0 ? (
                                    <div className="alert alert-light border rounded-4 mb-0">
                                        No active learning platform found.
                                    </div>
                                ) : (
                                    <div className="row g-2">
                                        {platforms.map((platform) => {
                                            const platformName = platform.name || platform.Name
                                            const baseSearchUrl =
                                                platform.baseSearchUrl ||
                                                platform.BaseSearchUrl ||
                                                ''
                                            const querySuffix =
                                                platform.querySuffix ||
                                                platform.QuerySuffix ||
                                                ''
                                            const selected =
                                                form.selectedPlatforms?.includes(platformName)
                                            const searchQuery =
                                                `${skill.skillName} ${skill.recommendationLevel || ''} ${querySuffix}`.trim()
                                            const url =
                                                `${baseSearchUrl}${encodeURIComponent(searchQuery)}`

                                            return (
                                                <ResourceCard
                                                    key={platform.id || platform.Id || platformName}
                                                    title={platformName}
                                                    checked={selected}
                                                    onCheckedChange={(value) =>
                                                        togglePlatform(skill, platformName, value)
                                                    }
                                                    url={url}
                                                />
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            <TaskSection
                                title="Practice Task"
                                text={skill.practiceTask}
                                checked={form.isPracticeTaskCompleted}
                                onCheckedChange={(value) =>
                                    updateForm(skill, 'isPracticeTaskCompleted', value)
                                }
                                description={form.practiceTaskDescription}
                                onDescriptionChange={(value) =>
                                    updateForm(skill, 'practiceTaskDescription', value)
                                }
                            />

                            <TaskSection
                                title="Case Study"
                                text={skill.caseStudy}
                                checked={form.isCaseStudyCompleted}
                                onCheckedChange={(value) =>
                                    updateForm(skill, 'isCaseStudyCompleted', value)
                                }
                                description={form.caseStudyDescription}
                                onDescriptionChange={(value) =>
                                    updateForm(skill, 'caseStudyDescription', value)
                                }
                            />

                            {projectRequired ? (
                                <TaskSection
                                    title="Project Suggestion"
                                    text={skill.projectSuggestion}
                                    helpText={skill.projectDescription}
                                    checked={form.isProjectCompleted}
                                    onCheckedChange={(value) =>
                                        updateForm(skill, 'isProjectCompleted', value)
                                    }
                                    description={form.projectDescription}
                                    onDescriptionChange={(value) =>
                                        updateForm(skill, 'projectDescription', value)
                                    }
                                />
                            ) : (
                                <div className="alert alert-light border rounded-4">
                                    <strong>Project Optional</strong>
                                    <div className="small text-muted mt-1">
                                        Project becomes required starting from Level 2 → 3.
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {personal && !fullyCompleted && (
                        <>
                            <p>
                                Current personal progress:{' '}
                                <strong>{personalPercent}%</strong>
                            </p>

                            <TaskSection
                                title="Development Activities"
                                text={
                                    skill.developmentActivities?.length > 0
                                        ? skill.developmentActivities.join('\n')
                                        : skill.practiceTask
                                }
                                checked={form.isPracticeTaskCompleted}
                                onCheckedChange={(value) =>
                                    updateForm(skill, 'isPracticeTaskCompleted', value)
                                }
                                description={form.practiceTaskDescription}
                                onDescriptionChange={(value) =>
                                    updateForm(skill, 'practiceTaskDescription', value)
                                }
                            />

                            <TaskSection
                                title="Reflection Task"
                                text={skill.caseStudy || skill.practiceTask}
                                checked={form.isCaseStudyCompleted}
                                onCheckedChange={(value) =>
                                    updateForm(skill, 'isCaseStudyCompleted', value)
                                }
                                description={form.caseStudyDescription}
                                onDescriptionChange={(value) =>
                                    updateForm(skill, 'caseStudyDescription', value)
                                }
                            />

                            <TaskSection
                                title="Personal Development Plan"
                                text={skill.projectSuggestion || skill.taskTitle}
                                helpText={skill.projectDescription}
                                checked={form.isProjectCompleted}
                                onCheckedChange={(value) =>
                                    updateForm(skill, 'isProjectCompleted', value)
                                }
                                description={form.projectDescription}
                                onDescriptionChange={(value) =>
                                    updateForm(skill, 'projectDescription', value)
                                }
                            />
                        </>
                    )}

                    {!fullyCompleted ? (
                        <>
                            <div className="border rounded-4 p-3 mb-3">
                                <div className="fw-bold mb-1">{skill.taskTitle}</div>
                                <div className="text-muted small">{skill.taskType}</div>
                            </div>

                            <textarea
                                className="form-control rounded-4 mb-3"
                                rows="3"
                                placeholder={
                                    personal
                                        ? 'Write a short reflection after completing this activity...'
                                        : 'Write an overall reflection about this learning step...'
                                }
                                value={reflectionTexts[skill.skillId] || ''}
                                onChange={(e) =>
                                    handleReflectionChange(skill.skillId, e.target.value)
                                }
                            />

                            <button
                                className="btn btn-primary rounded-4 w-100"
                                onClick={() => handleCompleteTask(skill)}
                            >
                                {personal
                                    ? 'Mark Activity as Completed'
                                    : 'Mark Task as Completed'}
                            </button>
                        </>
                    ) : (
                        <div className="alert alert-success rounded-4 border-0 mb-0">
                            This skill is completed.
                        </div>
                    )}
                </div>
            </div>
        )
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
            title="Learning Roadmap"
            subtitle="Follow learning resources, practice tasks, case studies, project suggestions and development activities."
        >
            {warningMessage && (
                <div className="position-fixed top-0 end-0 p-4" style={{ zIndex: 9999 }}>
                    <div
                        className="shadow-lg border-0 rounded-4 p-4"
                        style={{
                            width: '380px',
                            background: 'white',
                            borderLeft: '6px solid #f59e0b',
                        }}
                    >
                        <div className="fw-bold mb-1">Learning Step Required</div>
                        <div className="text-muted small">{warningMessage}</div>
                    </div>
                </div>
            )}

            {message && (
                <div className="alert alert-info rounded-4 border-0">
                    {message}
                </div>
            )}

            <div className="modern-card mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                    <div>
                        <h4 className="fw-bold mb-1">Roadmap Mode</h4>
                        <p className="text-muted mb-0">
                            Choose whether you want to improve skills based on selected careers or selected skills.
                        </p>
                    </div>
                </div>

                <div className="d-flex flex-wrap gap-2">
                    <button
                        type="button"
                        className={`btn rounded-pill px-4 ${roadmapMode === 'career'
                            ? 'btn-primary'
                            : 'btn-outline-primary'
                            }`}
                        onClick={() => setRoadmapMode('career')}
                    >
                        Career Based
                    </button>

                    <button
                        type="button"
                        className={`btn rounded-pill px-4 ${roadmapMode === 'skills'
                            ? 'btn-primary'
                            : 'btn-outline-primary'
                            }`}
                        onClick={() => setRoadmapMode('skills')}
                    >
                        Skill Based
                    </button>
                </div>
            </div>

            <div className="modern-card mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                    <div>
                        <h4 className="fw-bold mb-1">Filter Roadmap</h4>
                        <p className="text-muted mb-0">
                            Filter your learning roadmap by search, career, skill type, or completion status.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-outline-secondary rounded-pill px-4"
                        onClick={clearFilters}
                    >
                        Clear Filters
                    </button>
                </div>

                <div className="row g-3">
                    <div className="col-md-6 col-xl-3">
                        <label className="form-label small fw-semibold">Search</label>
                        <input
                            type="text"
                            className="form-control rounded-4"
                            placeholder="Search skill, career or task..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>

                    {roadmapMode === 'career' && (
                        <div className="col-md-6 col-xl-3">
                            <label className="form-label small fw-semibold">Career</label>
                            <select
                                className="form-select rounded-4"
                                value={careerFilter}
                                onChange={(e) => setCareerFilter(e.target.value)}
                            >
                                <option value="all">All Careers</option>
                                {selectedCareers.map((career) => (
                                    <option key={career.careerId} value={String(career.careerId)}>
                                        {career.careerTitle}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="col-md-6 col-xl-3">
                        <label className="form-label small fw-semibold">Skill Type</label>
                        <select
                            className="form-select rounded-4"
                            value={skillTypeFilter}
                            onChange={(e) => setSkillTypeFilter(e.target.value)}
                        >
                            <option value="all">All Skills</option>
                            <option value="technical">Technical / Domain</option>
                            <option value="personal">Personal</option>
                        </select>
                    </div>

                    <div className="col-md-6 col-xl-3">
                        <label className="form-label small fw-semibold">Completion</label>
                        <select
                            className="form-select rounded-4"
                            value={completionFilter}
                            onChange={(e) => setCompletionFilter(e.target.value)}
                        >
                            <option value="all">All Tasks</option>
                            <option value="completed">Completed Tasks</option>
                            <option value="notCompleted">Not Completed Tasks</option>
                        </select>
                    </div>
                </div>
            </div>

            {roadmapMode === 'career' ? (
                selectedCareers.length === 0 ? (
                    <div className="modern-card">
                        <h3 className="fw-bold">No selected career found</h3>
                        <p className="text-muted mb-0">
                            Please go to Career Matches and select up to 4 careers first.
                        </p>
                    </div>
                ) : filteredCareers.length === 0 ? (
                    <div className="modern-card">
                        <h4 className="fw-bold">No roadmap found</h4>
                        <p className="text-muted mb-0">
                            No learning roadmap matched your selected filters.
                        </p>
                    </div>
                ) : (
                    <div className="row g-4">
                        {filteredCareers.map((career) => (
                            <div className="col-12" key={career.careerId}>
                                <div className="modern-card">
                                    <div className="d-flex justify-content-between align-items-start mb-4">
                                        <div>
                                            <span className="career-badge">Selected Career</span>
                                            <h3 className="fw-bold mb-2">{career.careerTitle}</h3>
                                            <p className="text-muted mb-0">
                                                {career.careerDescription}
                                            </p>
                                        </div>

                                        <div className="match-circle">
                                            {career.matchPercentage}%
                                        </div>
                                    </div>

                                    <div className="row g-3 mb-4">
                                        {jobPlatforms.length === 0 ? (
                                            <div className="col-12">
                                                <div className="alert alert-light border rounded-4 mb-0">
                                                    No active job platform found.
                                                </div>
                                            </div>
                                        ) : (
                                            jobPlatforms.map((platform) => {
                                                const platformName = platform.name || platform.Name
                                                const baseSearchUrl =
                                                    platform.baseSearchUrl ||
                                                    platform.BaseSearchUrl ||
                                                    ''
                                                const url =
                                                    `${baseSearchUrl}${encodeURIComponent(career.careerTitle)}`

                                                return (
                                                    <div
                                                        className="col-md-4"
                                                        key={platform.id || platform.Id || platformName}
                                                    >
                                                        <a
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-outline-primary rounded-4 w-100"
                                                        >
                                                            {platformName} Jobs
                                                        </a>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>

                                    <h4 className="fw-bold mb-3">Recommended Development Plan</h4>

                                    <div className="row g-4">
                                        {career.visibleMissingSkills.map((skill) =>
                                            renderSkillCard(skill)
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                selectedUserSkills.length === 0 ? (
                    <div className="modern-card">
                        <h3 className="fw-bold">No selected skill found</h3>
                        <p className="text-muted mb-0">
                            Please go to Skills Analysis and select the skills you want to improve.
                        </p>
                    </div>
                ) : filteredSkillBasedSkills.length === 0 ? (
                    <div className="modern-card">
                        <h4 className="fw-bold">No skill roadmap found</h4>
                        <p className="text-muted mb-0">
                            No selected skill matched your filters.
                        </p>
                    </div>
                ) : (
                    <div className="modern-card">
                        <div className="d-flex justify-content-between align-items-start mb-4">
                            <div>
                                <span className="career-badge">Selected Skills</span>
                                <h3 className="fw-bold mb-2">Skill Based Development Roadmap</h3>
                                <p className="text-muted mb-0">
                                    This roadmap is based on all skills selected by the user in Skills Analysis.
                                </p>
                            </div>

                            <div className="match-circle">
                                {filteredSkillBasedSkills.length}
                            </div>
                        </div>

                        <div className="row g-4">
                            {filteredSkillBasedSkills.map((skill) =>
                                renderSkillCard(skill)
                            )}
                        </div>
                    </div>
                )
            )}
        </MainLayout>
    )
}

function ResourceCard({ title, checked, onCheckedChange, url }) {
    return (
        <div className="col-md-4">
            <div className="border rounded-4 p-3 h-100">
                <div className="form-check mb-2">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onCheckedChange(e.target.checked)}
                    />

                    <label className="form-check-label fw-bold">
                        {title}
                    </label>
                </div>

                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-primary rounded-4 w-100"
                >
                    Open
                </a>
            </div>
        </div>
    )
}

function TaskSection({
    title,
    text,
    helpText,
    checked,
    onCheckedChange,
    description,
    onDescriptionChange,
}) {
    return (
        <div className="border rounded-4 p-3 mb-3">
            <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                <div>
                    <div className="fw-bold mb-1">{title}</div>
                    <div className="text-muted">{text}</div>

                    {helpText && (
                        <div className="text-muted small mt-2">
                            {helpText}
                        </div>
                    )}
                </div>

                <div className="form-check">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onCheckedChange(e.target.checked)}
                    />
                </div>
            </div>

            <textarea
                className="form-control rounded-4 mt-2"
                rows="2"
                placeholder="Description optional..."
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
            />
        </div>
    )
}

export default LearningRoadmap