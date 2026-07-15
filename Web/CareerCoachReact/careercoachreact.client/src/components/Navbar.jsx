import { useAuth } from '../context/AuthContext'

function Navbar({ title, subtitle }) {
    const { user, logout } = useAuth()

    const getPhotoUrl = (url) => {
        if (!url) return ''

        if (url.startsWith('http')) {
            return url
        }

        return `https://localhost:7127${url}`
    }

    return (
        <header className="topbar-modern">
            <div>
                <h2>{title}</h2>

                <p>
                    {subtitle}
                </p>
            </div>

            <div className="topbar-user">

                <div
                    className="user-avatar overflow-hidden"
                    style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        border: '2px solid rgba(255,255,255,0.2)',
                    }}
                >
                    {user?.profilePhotoUrl ? (
                        <img
                            src={getPhotoUrl(user.profilePhotoUrl)}
                            alt="Profile"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    ) : (
                        <span
                            className="fw-bold"
                            style={{
                                color: '#2563eb',
                                fontSize: '18px',
                            }}
                        >
                            {user?.firstName?.[0] || 'U'}
                        </span>
                    )}
                </div>

                <div className="d-none d-md-block">
                    <strong>{user?.firstName || 'User'}</strong>

                    <small>
                        {user?.email || 'careercoach user'}
                    </small>
                </div>

                <button
                    className="btn btn-light btn-sm rounded-pill"
                    onClick={logout}
                >
                    Logout
                </button>
            </div>
        </header>
    )
}

export default Navbar