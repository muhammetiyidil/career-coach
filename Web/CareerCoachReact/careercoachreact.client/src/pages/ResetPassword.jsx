import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import "./AuthPages.css"

function ResetPassword() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get("token")

    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        setMessage("")
        setError("")

        if (!token) {
            setError("Invalid password reset link.")
            return
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.")
            return
        }

        try {
            setLoading(true)

            const response = await fetch(
                "https://localhost:7127/api/Auth/reset-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        token: token,
                        newPassword: newPassword
                    })
                }
            )

            const data = await response.json()

            if (!response.ok) {
                setError(data || "Password reset failed.")
                return
            }

            setMessage("Your CareerCoach password has been updated successfully.")
            setNewPassword("")
            setConfirmPassword("")

        } catch (err) {
            console.log(err)
            setError("Could not connect to CareerCoach server.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">

                    <div className="auth-brand-icon">
                        CC
                    </div>

                    <div className="auth-brand-title">
                        CareerCoach
                    </div>

                </div>

                <h2 className="fw-bold text-center mb-3">
                    Create a new password
                </h2>

                <p className="auth-description">
                    Set a new password and continue your personalized career journey.
                </p>

                {error && <p className="error-message">{error}</p>}
                {message && <p className="success-message">{message}</p>}

                <form onSubmit={handleSubmit}>
                    <label>New Password</label>
                    <input
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />

                    <label>Confirm Password</label>
                    <input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>

                <Link to="/login" className="auth-link">
                    Back to Login
                </Link>
            </div>
        </div>
    )
}

export default ResetPassword