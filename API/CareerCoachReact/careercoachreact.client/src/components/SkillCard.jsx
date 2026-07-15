function SkillCard({
    skill,
    selected,
    onClick,
    hasPersonalSkill = false,
    onTogglePersonalSkill,
    personalPercentage = 0,
}) {
    const skillType =
        skill.skillType ||
        skill.SkillType ||
        skill.category ||
        skill.Category ||
        ''

    const skillName = skill.name || skill.Name || ''

    const isPersonal =
        skillType === 'Personal' ||
        skill.category === 'Personal' ||
        skill.Category === 'Personal'

    const handleCardClick = () => {
        if (onClick) {
            onClick()
        }
    }

    const handlePersonalButtonClick = (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (onTogglePersonalSkill) {
            onTogglePersonalSkill()
        }
    }

    return (
        <div
            className={`skill-card-modern ${selected ? 'selected' : ''}`}
            onClick={handleCardClick}
            style={{
                cursor: 'pointer',
                position: 'relative',
            }}
        >
            <div className="d-flex align-items-start gap-3">
                <div className="skill-icon">
                    {isPersonal ? 'P' : 'T'}
                </div>

                <div className="text-start flex-grow-1">
                    <h6>{skillName}</h6>
                    <span>{isPersonal ? 'Personal' : skillType}</span>

                    {selected && (
                        <div className="mt-2 small fw-semibold text-primary">
                            Selected for analysis
                        </div>
                    )}

                    {isPersonal && hasPersonalSkill && (
                        <div className="mt-2 small fw-semibold text-success">
                            Progress: {personalPercentage}%
                        </div>
                    )}
                </div>
            </div>

            {isPersonal && (
                <div
                    className="mt-3 pt-3 border-top"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        className={`btn btn-sm rounded-pill ${hasPersonalSkill
                                ? 'btn-success'
                                : 'btn-outline-primary'
                            }`}
                        style={{
                            position: 'relative',
                            zIndex: 20,
                            pointerEvents: 'auto',
                        }}
                        onClick={handlePersonalButtonClick}
                    >
                        {hasPersonalSkill
                            ? `I have this skill ✓ (${personalPercentage}%)`
                            : 'I already have this skill'}
                    </button>
                </div>
            )}
        </div>
    )
}

export default SkillCard