import { useEffect, useState } from 'react'
import MainLayout from '../layout/MainLayout'
import CareerCard from '../components/CareerCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { getCareerRecommendations } from '../services/aiService'
import { selectCareers, getSelectedCareers } from '../services/careerService'
import { useAuth } from '../context/AuthContext'

function CareerMatches() {
    const { user } = useAuth()

    const [matches, setMatches] = useState([])
    const [selectedCareers, setSelectedCareers] = useState([])
    const [showOnlySelected, setShowOnlySelected] = useState(false)
    const [selectedCareerDetail, setSelectedCareerDetail] = useState(null)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        if (user?.id) {
            fetchMatches()
        }
    }, [user])

    const getCareerId = (career) =>
        Number(career.careerId || career.CareerId)

    const getCareerTitle = (career) =>
        career.careerTitle ||
        career.CareerTitle ||
        career.title ||
        career.Title ||
        career.career ||
        career.Career ||
        ''

    const getMatchPercentage = (career) =>
        Number(career.matchPercentage || career.MatchPercentage || 0)

    const hasCareerRequirements = (career) =>
        career.hasRequirements ?? career.HasRequirements ?? true

    const getMissingSkills = (career) =>
        career.missingSkills || career.MissingSkills || []

    const getMatchedSkills = (career) =>
        career.matchedSkills || career.MatchedSkills || []

    const fetchMatches = async () => {
        try {
            setLoading(true)
            setMessage('')

            const ruleBasedData = await getCareerRecommendations(user.id)

            const preparedData = ruleBasedData.map((career) => {
                const score = getMatchPercentage(career)

                return {
                    ...career,
                    source: career.source || career.Source || 'Rule-Based Career Matching',
                    ruleBasedScore: career.ruleBasedScore ?? career.RuleBasedScore ?? score,
                    matchPercentage: score,
                    MatchPercentage: score,
                }
            })

            setMatches(preparedData)

            let dbSelections = []

            try {
                dbSelections = await getSelectedCareers(user.id)
            } catch (err) {
                console.log('DB selections could not be loaded:', err)
            }

            const selectedCareerIds = dbSelections.map((saved) =>
                Number(saved.careerId || saved.CareerId)
            )

            const selectedFromDb = preparedData.filter((match) =>
                selectedCareerIds.includes(getCareerId(match))
            )

            setSelectedCareers(selectedFromDb)

            localStorage.setItem(
                'careercoach-selected-careers',
                JSON.stringify(selectedFromDb)
            )
        } catch (err) {
            console.log(err)
            setMessage('Career matches could not be loaded.')
        } finally {
            setLoading(false)
        }
    }

    const toggleCareer = (career) => {
        const careerId = getCareerId(career)

        const exists = selectedCareers.some(
            (item) => getCareerId(item) === careerId
        )

        let updatedCareers = []

        if (exists) {
            updatedCareers = selectedCareers.filter(
                (item) => getCareerId(item) !== careerId
            )
        } else {
            if (selectedCareers.length >= 4) {
                setMessage('You can select maximum 4 careers.')
                return
            }

            updatedCareers = [...selectedCareers, career]
        }

        setSelectedCareers(updatedCareers)

        localStorage.setItem(
            'careercoach-selected-careers',
            JSON.stringify(updatedCareers)
        )

        setMessage('')
    }

    const handleSaveSelectedCareers = async () => {
        if (selectedCareers.length === 0) {
            setMessage('Please select at least one career.')
            return
        }

        try {
            setSaving(true)

            const payload = selectedCareers.map((career) => ({
                userId: Number(user.id),
                careerId: getCareerId(career),
                matchPercentage: getMatchPercentage(career),
            }))

            await selectCareers(payload)

            setMessage('Selected careers saved successfully.')

            await fetchMatches()
        } catch (err) {
            console.log(err.response?.data || err)
            setMessage('Selected careers could not be saved.')
        } finally {
            setSaving(false)
        }
    }

    const displayedMatches = showOnlySelected
        ? matches.filter((career) =>
            selectedCareers.some(
                (item) => getCareerId(item) === getCareerId(career)
            )
        )
        : matches

    return (
        <MainLayout
            title="Career Matches"
            subtitle="Rule-based system compares your skill levels with career requirements and recommends suitable careers."
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
                                <h3 className="fw-bold mb-1">Recommended Careers</h3>
                                <p className="text-muted mb-0">
                                    Select up to 4 careers to create your roadmap.
                                </p>
                            </div>

                            <div className="d-flex gap-2 align-items-center flex-wrap justify-content-end">
                                <button
                                    type="button"
                                    className={`btn rounded-pill px-3 py-2 ${showOnlySelected
                                            ? 'btn-primary'
                                            : 'btn-outline-primary'
                                        }`}
                                    onClick={() => setShowOnlySelected(!showOnlySelected)}
                                >
                                    {showOnlySelected ? 'Show All' : 'Show Selected'}
                                </button>

                                <div className="badge text-bg-primary rounded-pill px-3 py-2">
                                    {selectedCareers.length}/4 selected
                                </div>
                            </div>
                        </div>

                        <div className="row g-4">
                            {displayedMatches.length === 0 ? (
                                <div className="col-12">
                                    <div className="alert alert-light rounded-4 border">
                                        No career found for this filter.
                                    </div>
                                </div>
                            ) : (
                                displayedMatches.map((career) => {
                                    const careerId = getCareerId(career)

                                    const selected = selectedCareers.some(
                                        (item) => getCareerId(item) === careerId
                                    )

                                    return (
                                        <div className="col-md-6 col-xl-4" key={careerId}>
                                            <div className={selected ? 'border border-primary rounded-4' : ''}>
                                                <CareerCard
                                                    career={career}
                                                    onClick={() => toggleCareer(career)}
                                                    onDetails={(career) => setSelectedCareerDetail(career)}
                                                />
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    <button
                        className="btn btn-primary rounded-4 px-5 py-3"
                        onClick={handleSaveSelectedCareers}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Selected Careers'}
                    </button>
                </>
            )}

            {selectedCareerDetail && (
                <div
                    className="modal d-block"
                    tabIndex="-1"
                    style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.35)',
                        backdropFilter: 'blur(2px)',
                    }}
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content rounded-4 border-0 shadow-lg">
                            <div className="modal-header border-0">
                                <div>
                                    <span className="career-badge">Career Details</span>
                                    <h3 className="fw-bold mb-0">
                                        {getCareerTitle(selectedCareerDetail)}
                                    </h3>
                                </div>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setSelectedCareerDetail(null)}
                                ></button>
                            </div>

                            <div className="modal-body">
                                <div className="row g-3 mb-4">
                                    <div className="col-md-4">
                                        <div className="border rounded-4 p-3 text-center">
                                            <div className="text-muted small">
                                                Career Status
                                            </div>

                                            <div className="fw-bold">
                                                {hasCareerRequirements(selectedCareerDetail)
                                                    ? 'Recommended'
                                                    : 'Requirements Missing'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-4">
                                        <div className="border rounded-4 p-3 text-center">
                                            <div className="text-muted small">
                                                Matched Skills
                                            </div>

                                            <div className="fw-bold fs-3">
                                                {hasCareerRequirements(selectedCareerDetail)
                                                    ? getMatchedSkills(selectedCareerDetail).length
                                                    : '-'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-4">
                                        <div className="border rounded-4 p-3 text-center">
                                            <div className="text-muted small">
                                                Missing Skills
                                            </div>

                                            <div className="fw-bold fs-3">
                                                {hasCareerRequirements(selectedCareerDetail)
                                                    ? getMissingSkills(selectedCareerDetail).length
                                                    : '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h5 className="fw-bold">Description</h5>

                                    <p className="text-muted">
                                        {selectedCareerDetail.careerDescription ||
                                            selectedCareerDetail.CareerDescription ||
                                            selectedCareerDetail.description ||
                                            selectedCareerDetail.Description ||
                                            'No description'}
                                    </p>
                                </div>

                                {!hasCareerRequirements(selectedCareerDetail) ? (
                                    <div className="alert alert-warning rounded-4 border-0 mt-2">
                                        Skill requirements have not been added for this career yet.
                                        Match score, matched skills and missing skills cannot be calculated accurately.
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-4">
                                            <h5 className="fw-bold">Matched Skills</h5>

                                            {getMatchedSkills(selectedCareerDetail).length > 0 ? (
                                                <div className="row g-3 mt-1">
                                                    {getMatchedSkills(selectedCareerDetail).map((skill) => (
                                                        <div
                                                            className="col-md-6"
                                                            key={skill.skillId || skill.SkillId}
                                                        >
                                                            <div className="border rounded-4 p-3 bg-light">
                                                                <div className="fw-bold">
                                                                    {skill.skillName || skill.SkillName}
                                                                </div>

                                                                <div className="text-muted small">
                                                                    Current Level:{' '}
                                                                    {skill.userLevel ?? skill.UserLevel}
                                                                    {' '} / Required Level:{' '}
                                                                    {skill.requiredLevel ?? skill.RequiredLevel}
                                                                </div>

                                                                <div className={
                                                                    Number(skill.userLevel ?? skill.UserLevel) >= Number(skill.requiredLevel ?? skill.RequiredLevel)
                                                                        ? "text-success small fw-semibold"
                                                                        : "text-warning small fw-semibold"
                                                                }>
                                                                    {Number(skill.userLevel ?? skill.UserLevel) >= Number(skill.requiredLevel ?? skill.RequiredLevel)
                                                                        ? "Skill requirement met"
                                                                        : "Partially matched (Level upgrade needed)"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="alert alert-light rounded-4 border mt-2">
                                                    No matched skills found for this career.
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h5 className="fw-bold">Missing Skills</h5>

                                            {getMissingSkills(selectedCareerDetail).length > 0 ? (
                                                <div className="row g-3 mt-1">
                                                    {getMissingSkills(selectedCareerDetail).map((skill) => (
                                                        <div
                                                            className="col-md-6"
                                                            key={skill.skillId || skill.SkillId}
                                                        >
                                                            <div className="border rounded-4 p-3">
                                                                <div className="fw-bold">
                                                                    {skill.skillName || skill.SkillName}
                                                                </div>

                                                                <div className="text-muted small">
                                                                    Current Level:{' '}
                                                                    {skill.userLevel ?? skill.UserLevel}
                                                                    {' '} / Required Level:{' '}
                                                                    {skill.requiredLevel ?? skill.RequiredLevel}
                                                                </div>

                                                                <div className="text-muted small">
                                                                    Recommended:{' '}
                                                                    {skill.recommendationLevel || skill.RecommendationLevel}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="alert alert-success rounded-4 border-0 mt-2">
                                                    You already meet all required skills for this career.
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="modal-footer border-0">
                                <button
                                    className="btn btn-secondary rounded-4"
                                    onClick={() => setSelectedCareerDetail(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    )
}

export default CareerMatches