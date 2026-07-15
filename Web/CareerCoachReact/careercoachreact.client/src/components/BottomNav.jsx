import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const userPrimaryLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: 'bi-grid' },
    { to: '/profile', label: 'Profile', icon: 'bi-person' },
    { to: '/skills', label: 'Skills', icon: 'bi-stars' },
    { to: '/career-matches', label: 'Careers', icon: 'bi-briefcase' },
]

const userMoreLinks = [
    { to: '/learning-roadmap', label: 'Learning Roadmap', icon: 'bi-map' },
    { to: '/learning-history', label: 'Learning History', icon: 'bi-clock-history' },
    { to: '/account-settings', label: 'Account Settings', icon: 'bi-person-gear' },
]

const adminPrimaryLinks = [
    { to: '/admin', label: 'Dashboard', icon: 'bi-speedometer2' },
    { to: '/admin/users', label: 'Users', icon: 'bi-people' },
    { to: '/admin/careers', label: 'Careers', icon: 'bi-briefcase' },
    { to: '/admin/analytics', label: 'Analytics', icon: 'bi-bar-chart' },
]

const adminMoreLinks = [
    { to: '/admin/departments', label: 'Departments', icon: 'bi-mortarboard' },
    { to: '/admin/skill-categories', label: 'Skill Categories', icon: 'bi-tags' },
    { to: '/admin/skills', label: 'Manage Skills', icon: 'bi-stars' },
    { to: '/admin/career-requirements', label: 'Career Requirements', icon: 'bi-diagram-3' },
    { to: '/admin/learning-platforms', label: 'Learning Platforms', icon: 'bi-play-circle' },
    { to: '/admin/job-platforms', label: 'Job Platforms', icon: 'bi-briefcase' },
    { to: '/admin/learning-progress', label: 'Learning Progress', icon: 'bi-journal-check' },
]

function BottomNav() {
    const { user, logout } = useAuth()
    const location = useLocation()
    const [sheetOpen, setSheetOpen] = useState(false)

    const isAdmin = user?.role === 'Admin'
    const primaryLinks = isAdmin ? adminPrimaryLinks : userPrimaryLinks
    const moreLinks = isAdmin ? adminMoreLinks : userMoreLinks

    useEffect(() => {
        document.body.style.overflow = sheetOpen ? 'hidden' : ''

        return () => {
            document.body.style.overflow = ''
        }
    }, [sheetOpen])

    const moreIsActive = moreLinks.some(
        (link) => location.pathname === link.to
    )

    return (
        <>
            {sheetOpen && (
                <div
                    className="mobile-sheet-backdrop"
                    onClick={() => setSheetOpen(false)}
                />
            )}

            <div className={`mobile-menu-sheet ${sheetOpen ? 'open' : ''}`}>
                <div className="mobile-sheet-handle" />

                <div className="mobile-sheet-header">
                    <div className="brand-icon">CC</div>

                    <div>
                        <h5>CareerCoach</h5>
                        <span>All menus</span>
                    </div>

                    <button
                        type="button"
                        className="btn-close ms-auto"
                        aria-label="Close menu"
                        onClick={() => setSheetOpen(false)}
                    />
                </div>

                <div className="mobile-sheet-grid">
                    {[...primaryLinks, ...moreLinks].map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.to === '/admin' || link.to === '/dashboard'}
                            className={({ isActive }) =>
                                `mobile-sheet-link ${isActive ? 'active' : ''}`
                            }
                            onClick={() => setSheetOpen(false)}
                        >
                            <i className={`bi ${link.icon}`}></i>
                            <span>{link.label}</span>
                        </NavLink>
                    ))}

                    <button
                        type="button"
                        className="mobile-sheet-link logout"
                        onClick={logout}
                    >
                        <i className="bi bi-box-arrow-right"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            <nav className="bottom-nav" aria-label="Mobile navigation">
                {primaryLinks.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.to === '/admin' || link.to === '/dashboard'}
                        className={({ isActive }) =>
                            `bottom-nav-link ${isActive ? 'active' : ''}`
                        }
                        onClick={() => setSheetOpen(false)}
                    >
                        <i className={`bi ${link.icon}`}></i>
                        <span>{link.label}</span>
                    </NavLink>
                ))}

                <button
                    type="button"
                    className={`bottom-nav-link more ${sheetOpen || moreIsActive ? 'active' : ''}`}
                    onClick={() => setSheetOpen(!sheetOpen)}
                >
                    <i className="bi bi-grid-3x3-gap"></i>
                    <span>More</span>
                </button>
            </nav>
        </>
    )
}

export default BottomNav
