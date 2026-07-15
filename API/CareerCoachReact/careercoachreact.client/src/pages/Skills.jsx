import { useEffect, useState } from 'react'
import MainLayout from '../layout/MainLayout'
import SkillCard from '../components/SkillCard'
import LoadingSpinner from '../components/LoadingSpinner'

import { getSkills } from '../services/skillService'
import { analyzeUserSkills } from '../services/aiService'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Skills() {
    const { user } = useAuth()

    const [skills, setSkills] = useState([])
    const [selectedSkills, setSelectedSkills] = useState([])
    const [userSkills, setUserSkills] = useState([])
    const [personalProgresses, setPersonalProgresses] = useState([])

    const [loading, setLoading] = useState(true)
    const [analyzing, setAnalyzing] = useState(false)
    const [results, setResults] = useState([])
    const [resultFilter, setResultFilter] = useState('all')
    const [message, setMessage] = useState('')

    const [showOnlySelectedTechnical, setShowOnlySelectedTechnical] = useState(false)
    const [showOnlySelectedPersonal, setShowOnlySelectedPersonal] = useState(false)

    useEffect(() => {
        if (user?.id) {
            fetchSkills()
        }
    }, [user])

    const fetchSkills = async () => {
        try {
            setLoading(true)

            const allSkills = await getSkills()
            setSkills(allSkills)

            const userSkillResponse = await api.get(`/UserSkills/user/${user.id}`)
            const userSkillData = userSkillResponse.data || []
            setUserSkills(userSkillData)

            const personalResponse = await api.get(`/UserPersonalSkillProgress/user/${user.id}`)
            const personalData = personalResponse.data || []
            setPersonalProgresses(personalData)

            const userSkillIds = userSkillData
                .filter((item) => {
                    const skillId = Number(item.skillId || item.SkillId)
                    const skill = allSkills.find((s) => Number(s.id || s.Id) === skillId)
                    return !isPersonalSkill(skill)
                })
                .map((item) => Number(item.skillId || item.SkillId))

            const personalSkillIds = personalData.map((item) =>
                Number(item.skillId || item.SkillId)
            )

            let careerSkillIds = []

            try {
                const careerSkillResponse = await api.get(
                    `/UserCareers/career-skills/${user.id}`
                )

                careerSkillIds = careerSkillResponse.data.map((id) =>
                    Number(id)
                )
            } catch (err) {
                console.log('Career skills could not be loaded:', err)
            }

            setSelectedSkills([
                ...new Set([
                    ...userSkillIds,
                    ...personalSkillIds,
                    ...careerSkillIds,
                ]),
            ])
        } catch (err) {
            console.log(err)
            setMessage('Skills could not be loaded.')
        } finally {
            setLoading(false)
        }
    }

    const refreshUserSkills = async () => {
        const response = await api.get(`/UserSkills/user/${user.id}`)
        const data = response.data || []

        setUserSkills(data)

        const ids = data
            .filter((item) => {
                const skillId = Number(item.skillId || item.SkillId)
                const skill = getSkillById(skillId)

                return skill && !isPersonalSkill(skill)
            })
            .map((item) => Number(item.skillId || item.SkillId))

        setSelectedSkills((prev) => [
            ...new Set([
                ...prev,
                ...ids,
            ]),
        ])

        return data
    }

    const getSkillById = (skillId) => {
        return skills.find((item) =>
            Number(item.id || item.Id) === Number(skillId)
        )
    }

    const isPersonalSkill = (skill) => {
        const type = skill?.skillType || skill?.SkillType || ''
        const category = skill?.category || skill?.Category || ''

        return type === 'Personal' || category === 'Personal'
    }

    const getUserSkillRecord = (skillId) => {
        return userSkills.find((item) =>
            Number(item.skillId || item.SkillId) === Number(skillId)
        )
    }

    const getUserSkillLevel = (skillId) => {
        const record = getUserSkillRecord(skillId)

        if (!record) return 0

        return Number(record.level ?? record.Level ?? 0)
    }

    const getPersonalProgressRecord = (skillId) => {
        return personalProgresses.find((item) =>
            Number(item.skillId || item.SkillId) === Number(skillId)
        )
    }

    const isPersonalOwned = (skillId) => {
        const record = getPersonalProgressRecord(skillId)

        return Boolean(record?.hasThisSkill ?? record?.HasThisSkill ?? false)
    }

    const getPersonalProgressPercentage = (skillId) => {
        const record = getPersonalProgressRecord(skillId)

        return Number(record?.progressPercentage ?? record?.ProgressPercentage ?? 0)
    }

    const getPersonalPercentage = (level) => {
        if (level <= 0) return 0
        if (level === 1) return 33
        if (level === 2) return 66
        return 100
    }

    const isResultPersonal = (result) => {
        const skill = getSkillById(result.skillId || result.SkillId)

        return (
            isPersonalSkill(skill) ||
            result.reason?.toLowerCase().includes('personal')
        )
    }

    const filteredResults = results.filter((result) => {
        const personal = isResultPersonal(result)

        if (resultFilter === 'technical') return !personal
        if (resultFilter === 'personal') return personal

        if (resultFilter === 'completed') {
            if (!personal) return result.estimatedLevel >= 5

            const percent = getPersonalProgressPercentage(result.skillId || result.SkillId)
            return percent === 100
        }

        if (resultFilter === 'progress') {
            if (!personal) return result.estimatedLevel < 5

            const percent = getPersonalProgressPercentage(result.skillId || result.SkillId)
            return percent < 100
        }

        return true
    })

    const toggleSkill = async (skillId) => {
        setMessage('')
        setResults([])

        const id = Number(skillId)
        const skill = getSkillById(id)
        const personal = isPersonalSkill(skill)
        const exists = selectedSkills.includes(id)

        if (personal) {
            try {
                if (exists) {
                    await api.delete(
                        `/UserPersonalSkillProgress/user/${user.id}/skill/${id}`
                    )

                    setSelectedSkills((prev) =>
                        prev.filter((x) => x !== id)
                    )

                    setPersonalProgresses((prev) =>
                        prev.filter((item) =>
                            Number(item.skillId || item.SkillId) !== id
                        )
                    )

                    return
                }

                const response = await api.post('/UserPersonalSkillProgress/select', {
                    userId: Number(user.id),
                    skillId: id,
                })

                const savedProgress = response.data

                setSelectedSkills((prev) => [
                    ...new Set([
                        ...prev,
                        id,
                    ]),
                ])

                setPersonalProgresses((prev) => [
                    ...prev.filter((item) =>
                        Number(item.skillId || item.SkillId) !== id
                    ),
                    {
                        ...savedProgress,
                        skillId: savedProgress.skillId || savedProgress.SkillId || id,
                        SkillId: savedProgress.skillId || savedProgress.SkillId || id,
                    },
                ])
            } catch (err) {
                console.log(err)
                setMessage('Personal skill selection could not be updated.')
            }

            return
        }

        try {
            const existingUserSkill = getUserSkillRecord(id)

            if (exists) {
                if (existingUserSkill) {
                    const userSkillId = existingUserSkill.id || existingUserSkill.Id
                    await api.delete(`/UserSkills/${userSkillId}`)
                }

                setSelectedSkills(selectedSkills.filter((selectedId) => selectedId !== id))

                setUserSkills(userSkills.filter((item) =>
                    Number(item.skillId || item.SkillId) !== id
                ))

                return
            }

            if (!existingUserSkill) {
                await api.post('/UserSkills', {
                    userId: Number(user.id),
                    skillId: id,
                    level: 0,
                })
            }

            setSelectedSkills([
                ...new Set([
                    ...selectedSkills,
                    id,
                ]),
            ])

            await refreshUserSkills()
        } catch (err) {
            console.log(err.response?.data || err)

            setMessage(
                typeof err.response?.data === 'string'
                    ? err.response.data
                    : 'Skill selection could not be updated.'
            )
        }
    }

    const markPersonalAsOwned = async (skillId) => {
        const id = Number(skillId)
        const alreadyOwned = isPersonalOwned(id)

        try {
            setMessage('')
            setResults([])

            const currentPercent = getPersonalProgressPercentage(id)

            const fallbackTask1 = currentPercent >= 33
            const fallbackTask2 = currentPercent >= 66
            const fallbackTask3 = currentPercent >= 100

            const currentRecord = getPersonalProgressRecord(id)

            const task1 = Boolean(
                currentRecord?.task1Completed ??
                currentRecord?.Task1Completed ??
                false
            )

            const task2 = Boolean(
                currentRecord?.task2Completed ??
                currentRecord?.Task2Completed ??
                false
            )

            const task3 = Boolean(
                currentRecord?.task3Completed ??
                currentRecord?.Task3Completed ??
                false
            )

            await api.post('/UserPersonalSkillProgress/save', {
                userId: Number(user.id),
                skillId: id,
                hasThisSkill: !alreadyOwned,
                task1Completed: task1,
                task2Completed: task2,
                task3Completed: task3,
                progressPercentage: !alreadyOwned ? 100 : 0,
            })

            const existingUserSkill = getUserSkillRecord(id)

            if (existingUserSkill) {
                const userSkillId = existingUserSkill.id || existingUserSkill.Id

                await api.put(`/UserSkills/${userSkillId}`, {
                    userId: Number(user.id),
                    skillId: id,
                    level: !alreadyOwned ? 3 : 0,
                })
            } else {
                await api.post('/UserSkills', {
                    userId: Number(user.id),
                    skillId: id,
                    level: !alreadyOwned ? 3 : 0,
                })
            }

            setSelectedSkills((prev) => [
                ...new Set([
                    ...prev,
                    id,
                ]),
            ])

            setUserSkills((prev) => {
                const exists = prev.some(
                    (item) => Number(item.skillId || item.SkillId) === id
                )

                if (exists) {
                    return prev.map((item) =>
                        Number(item.skillId || item.SkillId) === id
                            ? {
                                ...item,
                                level: !alreadyOwned ? 3 : 0,
                                Level: !alreadyOwned ? 3 : 0,
                            }
                            : item
                    )
                }

                return [
                    ...prev,
                    {
                        userId: Number(user.id),
                        UserId: Number(user.id),
                        skillId: id,
                        SkillId: id,
                        level: !alreadyOwned ? 3 : 0,
                        Level: !alreadyOwned ? 3 : 0,
                    },
                ]
            })

            setPersonalProgresses((prev) => {
                const exists = prev.some(
                    (item) => Number(item.skillId || item.SkillId) === id
                )

                if (exists) {
                    return prev.map((item) =>
                        Number(item.skillId || item.SkillId) === id
                            ? {
                                ...item,
                                hasThisSkill: !alreadyOwned,
                                HasThisSkill: !alreadyOwned,
                                task1Completed: !alreadyOwned,
                                Task1Completed: !alreadyOwned,
                                task2Completed: !alreadyOwned,
                                Task2Completed: !alreadyOwned,
                                task3Completed: !alreadyOwned,
                                Task3Completed: !alreadyOwned,
                                progressPercentage: !alreadyOwned ? 100 : 0,
                                ProgressPercentage: !alreadyOwned ? 100 : 0,
                            }
                            : item
                    )
                }

                return [
                    ...prev,
                    {
                        userId: Number(user.id),
                        UserId: Number(user.id),
                        skillId: id,
                        SkillId: id,
                        hasThisSkill: !alreadyOwned,
                        HasThisSkill: !alreadyOwned,
                        task1Completed: !alreadyOwned,
                        Task1Completed: !alreadyOwned,
                        task2Completed: !alreadyOwned,
                        Task2Completed: !alreadyOwned,
                        task3Completed: !alreadyOwned,
                        Task3Completed: !alreadyOwned,
                        progressPercentage: !alreadyOwned ? 100 : 0,
                        ProgressPercentage: !alreadyOwned ? 100 : 0,
                    },
                ]
            })

            setMessage(
                !alreadyOwned
                    ? 'Personal skill marked as owned.'
                    : 'Personal skill ownership removed.'
            )
        } catch (err) {
            console.log(err.response?.data || err)
            setMessage('Personal skill could not be updated.')
        }
    }

    const handleAnalyze = async () => {
        if (selectedSkills.length === 0) {
            setMessage('Please select at least one skill.')
            return
        }

        try {
            setAnalyzing(true)
            setMessage('')
            setResultFilter('all')

            const response = await analyzeUserSkills({
                userId: user.id,
                selectedSkillIds: selectedSkills,
                cvSummary: user.cvSummary || '',
                experienceText: user.experienceText || '',
                projectText: user.projectText || '',
            })

            setResults(response)

            await refreshUserSkills()

            const personalResponse = await api.get(`/UserPersonalSkillProgress/user/${user.id}`)
            setPersonalProgresses(personalResponse.data || [])

            setMessage('Skill analysis completed successfully.')
        } catch (err) {
            console.log(err.response?.data || err)
            setMessage('Skill analysis could not be completed.')
        } finally {
            setAnalyzing(false)
        }
    }

    const technicalSkills = skills.filter((skill) => {
        const type = skill.skillType || skill.SkillType || ''
        return type === 'Technical'
    })

    const personalSkills = skills.filter((skill) => {
        return isPersonalSkill(skill)
    })

    const selectedTechnicalCount = technicalSkills.filter((skill) =>
        selectedSkills.includes(Number(skill.id || skill.Id))
    ).length

    const selectedPersonalCount = personalSkills.filter((skill) =>
        selectedSkills.includes(Number(skill.id || skill.Id))
    ).length

    const displayedTechnicalSkills = showOnlySelectedTechnical
        ? technicalSkills.filter((skill) =>
            selectedSkills.includes(Number(skill.id || skill.Id))
        )
        : technicalSkills

    const displayedPersonalSkills = showOnlySelectedPersonal
        ? personalSkills.filter((skill) =>
            selectedSkills.includes(Number(skill.id || skill.Id))
        )
        : personalSkills

    return (
        <MainLayout
            title="Skills Analysis"
            subtitle="Select technical skills for 0-5 level analysis and personal skills for percentage-based evaluation."
        >
            {message && (
                <div className="alert alert-info rounded-4 border-0">
                    {message}
                </div>
            )}

            {loading ? (
                <LoadingSpinner />
            ) : (
                <>
                    <div className="modern-card mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h3 className="fw-bold mb-1">Technical / Domain Skills</h3>
                                <p className="text-muted mb-0">
                                    Technical skills are evaluated with level values between 0 and 5.
                                </p>
                            </div>

                            <div className="d-flex gap-2 align-items-center">
                                <button
                                    type="button"
                                    className={`btn rounded-pill px-3 py-2 ${showOnlySelectedTechnical
                                        ? 'btn-primary'
                                        : 'btn-outline-primary'
                                        }`}
                                    onClick={() =>
                                        setShowOnlySelectedTechnical(!showOnlySelectedTechnical)
                                    }
                                >
                                    {showOnlySelectedTechnical ? 'Show All' : 'Show Selected'}
                                </button>

                                <span className="badge text-bg-primary rounded-pill px-3 py-2">
                                    {selectedTechnicalCount} selected
                                </span>
                            </div>
                        </div>

                        <div className="row g-3">
                            {displayedTechnicalSkills.length === 0 ? (
                                <div className="col-12">
                                    <div className="alert alert-light rounded-4 border">
                                        No technical/domain skill found for this filter.
                                    </div>
                                </div>
                            ) : (
                                displayedTechnicalSkills.map((skill) => {
                                    const id = Number(skill.id || skill.Id)

                                    return (
                                        <div className="col-6 col-md-4" key={id}>
                                            <SkillCard
                                                skill={skill}
                                                selected={selectedSkills.includes(id)}
                                                onClick={() => toggleSkill(id)}
                                            />
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    <div className="modern-card mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h3 className="fw-bold mb-1">Personal Skills</h3>
                                <p className="text-muted mb-0">
                                    Click the card to select it for analysis. Use the green button only if you already have this skill.
                                </p>
                            </div>

                            <div className="d-flex gap-2 align-items-center">
                                <button
                                    type="button"
                                    className={`btn rounded-pill px-3 py-2 ${showOnlySelectedPersonal
                                        ? 'btn-primary'
                                        : 'btn-outline-primary'
                                        }`}
                                    onClick={() =>
                                        setShowOnlySelectedPersonal(!showOnlySelectedPersonal)
                                    }
                                >
                                    {showOnlySelectedPersonal ? 'Show All' : 'Show Selected'}
                                </button>

                                <span className="badge text-bg-primary rounded-pill px-3 py-2">
                                    {selectedPersonalCount} selected
                                </span>
                            </div>
                        </div>

                        <div className="row g-3">
                            {displayedPersonalSkills.length === 0 ? (
                                <div className="col-12">
                                    <div className="alert alert-light rounded-4 border">
                                        No personal skill found for this filter.
                                    </div>
                                </div>
                            ) : (
                                displayedPersonalSkills.map((skill) => {
                                    const id = Number(skill.id || skill.Id)
                                    const owned = isPersonalOwned(id)
                                    const percent = getPersonalProgressPercentage(id)

                                    return (
                                        <div className="col-6 col-md-4" key={id}>
                                            <SkillCard
                                                skill={skill}
                                                selected={selectedSkills.includes(id)}
                                                onClick={() => toggleSkill(id)}
                                                hasPersonalSkill={owned}
                                                personalPercentage={percent}
                                                onTogglePersonalSkill={() =>
                                                    markPersonalAsOwned(id)
                                                }
                                            />
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    <button
                        className="btn btn-primary rounded-4 px-5 py-3"
                        onClick={handleAnalyze}
                        disabled={analyzing}
                    >
                        {analyzing ? 'Analyzing...' : 'Analyze Selected Skills'}
                    </button>

                    {results.length > 0 && (
                        <div className="modern-card mt-4">
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                                <div>
                                    <h3 className="fw-bold mb-1">Skill Results</h3>
                                    <div className="text-muted small">
                                        Showing {filteredResults.length} of {results.length} results
                                    </div>
                                </div>

                                <div className="d-flex gap-2 flex-wrap">
                                    <FilterButton label="All" value="all" active={resultFilter} onClick={setResultFilter} />
                                    <FilterButton label="Technical / Domain" value="technical" active={resultFilter} onClick={setResultFilter} />
                                    <FilterButton label="Personal" value="personal" active={resultFilter} onClick={setResultFilter} />
                                    <FilterButton label="Completed" value="completed" active={resultFilter} onClick={setResultFilter} />
                                    <FilterButton label="In Progress" value="progress" active={resultFilter} onClick={setResultFilter} />
                                </div>
                            </div>

                            {filteredResults.length === 0 ? (
                                <div className="alert alert-light border rounded-4 mb-0">
                                    No result found for this filter.
                                </div>
                            ) : (
                                <div className="row g-3">
                                    {filteredResults.map((result) => {
                                        const skillId = Number(result.skillId || result.SkillId)
                                        const personal = isResultPersonal(result)

                                        const personalPercent = getPersonalProgressPercentage(skillId)
                                        const personalLevel =
                                            personalPercent >= 100
                                                ? 3
                                                : personalPercent >= 66
                                                    ? 2
                                                    : personalPercent >= 33
                                                        ? 1
                                                        : 0

                                        return (
                                            <div className="col-md-6" key={skillId}>
                                                <div className="career-card-modern">
                                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                                        <div>
                                                            <span className="career-badge">
                                                                {personal ? 'Personal' : 'Technical / Domain'}
                                                            </span>

                                                            <h4>{result.skillName || result.SkillName}</h4>
                                                        </div>

                                                        {!personal && (
                                                            <div className="match-circle">
                                                                L{result.estimatedLevel || result.EstimatedLevel}
                                                            </div>
                                                        )}

                                                        {personal && (
                                                            <div className="match-circle">
                                                                {personalPercent}%
                                                            </div>
                                                        )}
                                                    </div>

                                                    <p>{result.reason || result.Reason}</p>

                                                    {!personal && (
                                                        <>
                                                            <div className="progress modern-progress">
                                                                <div
                                                                    className="progress-bar"
                                                                    style={{
                                                                        width: `${(result.estimatedLevel || result.EstimatedLevel) * 20}%`,
                                                                    }}
                                                                ></div>
                                                            </div>

                                                            <div className="career-footer">
                                                                <span>
                                                                    Level {result.estimatedLevel || result.EstimatedLevel} / 5
                                                                </span>
                                                                <span>
                                                                    {getLevelName(result.estimatedLevel || result.EstimatedLevel)}
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}

                                                    {personal && (
                                                        <>
                                                            <div className="progress modern-progress">
                                                                <div
                                                                    className="progress-bar"
                                                                    style={{
                                                                        width: `${personalPercent}%`,
                                                                    }}
                                                                ></div>
                                                            </div>

                                                            <div className="career-footer">
                                                                <span>
                                                                    Personal Level {personalLevel} / 3
                                                                </span>

                                                                <span>
                                                                    {personalPercent === 100
                                                                        ? 'Completed'
                                                                        : 'In Progress'}
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </MainLayout>
    )
}

function FilterButton({ label, value, active, onClick }) {
    return (
        <button
            type="button"
            className={`btn rounded-pill px-3 ${active === value
                ? 'btn-primary'
                : 'btn-outline-primary'
                }`}
            onClick={() => onClick(value)}
        >
            {label}
        </button>
    )
}

function getLevelName(level) {
    if (level <= 0) return 'No Knowledge'
    if (level === 1) return 'Beginner'
    if (level === 2) return 'Foundation'
    if (level === 3) return 'Intermediate'
    if (level === 4) return 'Advanced'
    return 'Expert'
}

export default Skills