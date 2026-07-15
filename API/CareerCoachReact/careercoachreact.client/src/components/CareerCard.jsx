function CareerCard({ career, onClick, onDetails }) {
    const match = Number(
        career.matchPercentage ??
        career.MatchPercentage ??
        0
    )

    const hasRequirements =
        career.hasRequirements ??
        career.HasRequirements ??
        true

    const title =
        career.careerTitle ||
        career.CareerTitle ||
        career.title ||
        career.Title ||
        career.career ||
        career.Career ||
        'Untitled Career'

    const description =
        career.careerDescription ||
        career.CareerDescription ||
        career.description ||
        career.Description ||
        ''

    const matchLabel =
        career.matchLabel ||
        career.MatchLabel ||
        getMatchLabel(match)

    return (
        <div className="career-card-modern" onClick={onClick}>
            <div className="d-flex justify-content-between align-items-start gap-3">
                <div>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                        

                        {hasRequirements && (
                            <span className="career-badge bg-success text-white">
                                {matchLabel}
                            </span>
                        )}
                    </div>

                    <h4>{title}</h4>
                </div>

                <div className="match-circle">
                    {match}%
                </div>
            </div>

            <p>{description || 'No description available.'}</p>

            {!hasRequirements && (
                <div className="alert alert-warning mt-3 py-2 px-3 rounded-4 small mb-3">
                    Skill requirements have not been added for this career yet.
                    Match score cannot be calculated accurately.
                </div>
            )}

            <div className="mb-2 small text-muted">
                Career Match
            </div>

            <div className="progress modern-progress">
                <div
                    className="progress-bar"
                    style={{ width: `${match}%` }}
                ></div>
            </div>

            <div className="career-footer">
                <span>
                    {hasRequirements
                        ? `${match}% Match`
                        : 'Requirements Missing'}
                </span>

                <button
                    type="button"
                    className="btn btn-primary btn-sm rounded-pill"
                    onClick={(e) => {
                        e.stopPropagation()

                        if (onDetails) {
                            onDetails(career)
                        }
                    }}
                >
                    View Details
                </button>
            </div>
        </div>
    )
}

function getMatchLabel(score) {
    if (score >= 90) return 'Excellent Match'
    if (score >= 75) return 'Strong Match'
    if (score >= 60) return 'Good Match'
    if (score >= 40) return 'Moderate Match'
    return 'Low Match'
}

export default CareerCard