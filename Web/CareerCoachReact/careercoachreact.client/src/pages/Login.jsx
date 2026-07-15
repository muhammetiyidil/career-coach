import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import AuthShell from '../components/AuthShell'

function Login() {
    const navigate = useNavigate()
    const { login } = useAuth()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()

        if (!email || !password) {
            setError('Please enter email and password.')
            return
        }

        try {
            setLoading(true)
            setError('')

            const response = await api.post('/Auth/login', {
                email,
                password,
            })

            const user = response.data.user
            const token = response.data.token

            login(user, token)

            if (user.role === 'Admin') {
                navigate('/admin')
            } else {
                navigate('/dashboard')
            }
        } catch (err) {
            console.log(err)
            setError(
                err.response?.data ||
                'Login failed. Please check backend connection.'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthShell
            headline="Kariyerinizi tek panelden yönetin"
            subline="LinkedIn, Kariyer.net ve Indeed ile entegre; AI destekli analiz ve takip."
        >
            <div className="modern-card auth-form-card">
                <div className="text-center mb-4">
                    <h2 className="fw-bold mb-1">Welcome Back</h2>
                    <p className="text-muted mb-0">
                        Login to continue your career journey.
                    </p>
                </div>

                {error && (
                    <div className="alert alert-danger rounded-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-control rounded-4"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                setError('')
                            }}
                            required
                        />
                    </div>

                    <div className="mb-2">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control rounded-4"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value)
                                setError('')
                            }}
                            required
                        />
                    </div>

                    <div className="text-end mb-3">
                        <Link
                            to="/forgot-password"
                            className="text-decoration-none fw-semibold"
                        >
                            Forgot Password?
                        </Link>
                    </div>

                    <button
                        className="btn btn-primary w-100 rounded-4 py-2"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="text-center mt-3">
                    <span className="text-muted">No account? </span>
                    <Link
                        to="/register"
                        className="fw-bold text-decoration-none"
                    >
                        Sign Up
                    </Link>
                </div>
            </div>
        </AuthShell>
    )
}

export default Login
