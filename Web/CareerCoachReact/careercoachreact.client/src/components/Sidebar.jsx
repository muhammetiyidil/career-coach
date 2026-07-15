import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const userLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: 'bi-grid' },
    { to: '/profile', label: 'Profile', icon: 'bi-person' },
    { to: '/skills', label: 'Skills', icon: 'bi-stars' },
    { to: '/career-matches', label: 'Career Matches', icon: 'bi-briefcase' },
    { to: '/learning-roadmap', label: 'Learning Roadmap', icon: 'bi-map' },
    { to: '/learning-history', label: 'Learning History', icon: 'bi-clock-history' },
    { to: '/account-settings', label: 'Account Settings', icon: 'bi-person-gear' },
]

const adminLinks = [
    { to: '/admin', label: 'Admin Dashboard', icon: 'bi-speedometer2' },
    { to: '/admin/users', label: 'Users', icon: 'bi-people' },
    { to: '/admin/departments', label: 'Departments', icon: 'bi-mortarboard' },

    { to: '/admin/skill-categories', label: 'Skill Categories', icon: 'bi-tags' },
    { to: '/admin/skills', label: 'Manage Skills', icon: 'bi-stars' },

    { to: '/admin/careers', label: 'Manage Careers', icon: 'bi-briefcase' },
    { to: '/admin/career-requirements', label: 'Career Requirements', icon: 'bi-diagram-3' },

    { to: '/admin/learning-platforms', label: 'Learning Platforms', icon: 'bi-play-circle' },
    { to: '/admin/job-platforms', label: 'Job Platforms', icon: 'bi-briefcase' },
    { to: '/admin/learning-progress', label: 'Learning Progress', icon: 'bi-journal-check' },

    { to: '/admin/analytics', label: 'Analytics', icon: 'bi-bar-chart' },
]

function Sidebar() {
    const { user } = useAuth()

    const links = user?.role === 'Admin'
        ? adminLinks
        : userLinks

    return (
        <aside className="sidebar-modern">
            <div className="brand-box">
                <div className="brand-icon">CC</div>

                <div>
                    <h4>CareerCoach</h4>
                    <span>Smart Career Guide</span>
                </div>
            </div>

            <nav className="nav-modern">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.to === '/admin' || link.to === '/dashboard'}
                        className={({ isActive }) =>
                            `nav-modern-link ${isActive ? 'active' : ''}`
                        }
                    >
                        <i className={`bi ${link.icon}`}></i>
                        <span>{link.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    )
}

export default Sidebar