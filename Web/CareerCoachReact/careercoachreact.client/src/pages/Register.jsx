import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import api from '../services/api'
import AuthShell from '../components/AuthShell'

function Register() {
    const { login } = useAuth()
    const navigate = useNavigate()

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        country: '',
        city: '',
    })

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (
            !formData.firstName ||
            !formData.lastName ||
            !formData.email ||
            !formData.password ||
            !formData.confirmPassword ||
            !formData.country ||
            !formData.city
        ) {
            setError('Please fill all required fields.')
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        try {
            setLoading(true)

            const response = await api.post('/Auth/register', {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                country: formData.country,
                city: formData.city,
            })

            localStorage.setItem(
                'careercoach-user',
                JSON.stringify(response.data.user)
            )

            localStorage.setItem(
                'careercoach-token',
                response.data.token
            )

            login(response.data.user, response.data.token)
            navigate('/profile')
        } catch (err) {
            console.log(err)
            setError(
                err.response?.data ||
                'Register failed. Please check backend connection.'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthShell
            headline="AI destekli kariyer yolculuğuna başlayın"
            subline="Analiz, eşleştirme ve öğrenme takibini tek yerden yönetin."
        >
            <div className="modern-card auth-form-card" style={{ maxWidth: 620 }}>
                <h2 className="fw-bold text-center">Create Account</h2>
                <p className="text-muted text-center mb-4">
                    Start your AI-supported career journey.
                </p>

                {error && (
                    <div className="alert alert-danger rounded-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">First Name *</label>
                            <input
                                name="firstName"
                                className="form-control rounded-4"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Last Name *</label>
                            <input
                                name="lastName"
                                className="form-control rounded-4"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-12">
                            <label className="form-label">Email *</label>
                            <input
                                name="email"
                                type="email"
                                className="form-control rounded-4"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Password *</label>
                            <input
                                name="password"
                                type="password"
                                className="form-control rounded-4"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Confirm Password *</label>
                            <input
                                name="confirmPassword"
                                type="password"
                                className="form-control rounded-4"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Country *</label>
                            <input
                                name="country"
                                className="form-control rounded-4"
                                placeholder="Example: Turkey"
                                value={formData.country}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">City *</label>
                            <input
                                name="city"
                                className="form-control rounded-4"
                                placeholder="Example: Istanbul"
                                value={formData.city}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-12">
                            <div className="text-muted small mt-1">
                                Country and city help the system show more relevant job platforms and career suggestions.
                            </div>
                        </div>
                    </div>

                    <button
                        className="btn btn-primary w-100 rounded-4 py-2 mt-4"
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Account'}
                    </button>
                </form>

                <div className="text-center mt-3">
                    <span className="text-muted">Already have an account? </span>
                    <Link to="/" className="fw-bold text-decoration-none">
                        Login
                    </Link>
                </div>
            </div>
        </AuthShell>
    )
}

export default Register
