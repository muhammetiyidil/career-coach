import { useEffect, useState } from 'react'
import MainLayout from '../layout/MainLayout'
import { useAuth } from '../context/AuthContext'
import { getCareerRecommendations } from '../services/aiService'
import { getSelectedCareers } from '../services/careerService'
import api from '../services/api'

function Dashboard() {
    const { user } = useAuth()

    const [careerMatches, setCareerMatches] = useState([])
    const [selectedCareers, setSelectedCareers] = useState([])
    const [profileStatus, setProfileStatus] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user?.id) {
            fetchDashboard()
        }
    }, [user])

    const getCareerTitle = (career) =>
        career.careerTitle ||
        career.CareerTitle ||
        career.title ||
        career.Title ||
        career.career ||
        career.Career ||
        ''

    const getMatchPercentage = (career) =>
        Number(
            career.matchPercentage ||
            career.MatchPercentage ||
            0
        )

    const fetchDashboard = async () => {
        try {
            setLoading(true)

            const [matches, userResponse, savedCareers] = await Promise.all([
                getCareerRecommendations(user.id),
                api.get(`/Users/${user.id}`),
                getSelectedCareers(user.id),
            ])

            setCareerMatches(matches)
            setProfileStatus(userResponse.data.isProfileCompleted)

            const selectedCareerIds = (savedCareers || []).map((career) =>
                Number(career.careerId || career.CareerId)
            )

            const selectedFromDb = (matches || []).filter((career) =>
                selectedCareerIds.includes(
                    Number(career.careerId || career.CareerId)
                )
            )

            setSelectedCareers(selectedFromDb)
        } catch (err) {
            console.log(err)
        } finally {
            setLoading(false)
        }
    }

    const sortedCareerMatches = [...careerMatches].sort(
        (a, b) => getMatchPercentage(b) - getMatchPercentage(a)
    )

    const highestMatch =
        careerMatches.length > 0
            ? Math.max(...careerMatches.map((x) => getMatchPercentage(x)))
            : 0

    const strongMatchCount =
        careerMatches.filter((x) => getMatchPercentage(x) >= 75).length

    const topCareer =
        sortedCareerMatches.length > 0
            ? getCareerTitle(sortedCareerMatches[0])
            : 'Not calculated yet'

    if (loading) {
        return (
            <MainLayout
                title={`Welcome ${user?.firstName}`}
                subtitle="Your rule-based career guidance dashboard."
            >
                <div className="modern-card text-center">
                    <h5 className="fw-bold mb-0">Loading dashboard...</h5>
                </div>
            </MainLayout>
        )
    }

    return (
        <MainLayout
            title={`Welcome ${user?.firstName}`}
            subtitle="Your career guidance dashboard based on skill matching."
        >
            <div className="row g-4 mb-4">
                <div className="col-6 col-md-3">
                    <div className="modern-card text-center">
                        <h6 className="text-muted mb-2">Career Matches</h6>
                        <h2 className="fw-bold">{careerMatches.length}</h2>
                    </div>
                </div>

                <div className="col-6 col-md-3">
                    <div className="modern-card text-center">
                        <h6 className="text-muted mb-2">Strong Matches</h6>
                        <h2 className="fw-bold text-primary">
                            {strongMatchCount}
                        </h2>
                    </div>
                </div>

                <div className="col-6 col-md-3">
                    <div className="modern-card text-center">
                        <h6 className="text-muted mb-2">Highest Match</h6>
                        <h2 className="fw-bold">{highestMatch}%</h2>
                    </div>
                </div>

                <div className="col-6 col-md-3">
                    <div className="modern-card text-center">
                        <h6 className="text-muted mb-2">Profile Status</h6>
                        <h2 className={`fw-bold ${profileStatus ? 'text-success' : 'text-danger'}`}>
                            {profileStatus ? 'Ready' : 'Incomplete'}
                        </h2>
                    </div>
                </div>
            </div>

            <div className="modern-card mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                        <h3 className="fw-bold mb-1">
                            Top Career Match
                        </h3>

                        <p className="text-muted mb-0">
                            The system compares your saved skill levels with career requirements and calculates your best match.
                        </p>
                    </div>

                    <div className="px-4 py-3 rounded-4 bg-light border text-center">
                        <div className="small text-muted mb-1">
                            Best Match
                        </div>

                        <div className="fw-bold text-primary">
                            {topCareer}
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4 mb-4">
                <div className="col-lg-8">
                    <div className="modern-card h-100">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h3 className="fw-bold mb-1">
                                    Career Insights
                                </h3>

                                <p className="text-muted mb-0">
                                    Your strongest recommendations based on skill match percentages.
                                </p>
                            </div>
                        </div>

                        <div className="row g-3">
                            {sortedCareerMatches
                                .slice(0, 3)
                                .map((career) => (
                                    <div className="col-md-4" key={career.careerId || career.CareerId}>
                                        <div className="career-card-modern">
                                            <div className="d-flex gap-2 flex-wrap mb-3">
                                                <div className="career-badge">
                                                    Top Match
                                                </div>

                                                {getMatchPercentage(career) >= 75 && (
                                                    <div className="career-badge bg-primary text-white">
                                                        Strong Match
                                                    </div>
                                                )}
                                            </div>

                                            <h5 className="fw-bold">
                                                {getCareerTitle(career)}
                                            </h5>

                                            <p className="small">
                                                {career.careerDescription || career.CareerDescription}
                                            </p>

                                            <div className="small text-muted mb-3">
                                                <div>
                                                    Career Match:{' '}
                                                    <strong>
                                                        {getMatchPercentage(career)}%
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="career-footer">
                                                <span>Skill Match</span>

                                                <div className="match-circle">
                                                    {getMatchPercentage(career)}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="modern-card h-100">
                        <h3 className="fw-bold mb-4">
                            Quick Actions
                        </h3>

                        <div className="d-grid gap-3">
                            <a
                                href="/profile"
                                className="btn btn-outline-primary rounded-4 py-3"
                            >
                                Update Profile
                            </a>

                            <a
                                href="/skills"
                                className="btn btn-outline-primary rounded-4 py-3"
                            >
                                Analyze Skills
                            </a>

                            <a
                                href="/career-matches"
                                className="btn btn-outline-primary rounded-4 py-3"
                            >
                                View Career Matches
                            </a>

                            <a
                                href="/learning-roadmap"
                                className="btn btn-outline-primary rounded-4 py-3"
                            >
                                Open Learning Roadmap
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modern-card">
                <h3 className="fw-bold mb-4">
                    Selected Career Goals
                </h3>

                {selectedCareers.length === 0 ? (
                    <div className="alert alert-light rounded-4 border">
                        No selected career yet.
                    </div>
                ) : (
                    <div className="row g-3">
                        {selectedCareers.map((career) => (
                            <div className="col-md-6 col-xl-3" key={career.careerId || career.CareerId}>
                                <div className="career-card-modern">
                                    <div className="career-badge">
                                        Selected
                                    </div>

                                    <h5 className="fw-bold">
                                        {getCareerTitle(career)}
                                    </h5>

                                    <div className="career-footer">
                                        <span>Compatibility</span>

                                        <div className="match-circle">
                                            {getMatchPercentage(career)}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    )
}

export default Dashboard