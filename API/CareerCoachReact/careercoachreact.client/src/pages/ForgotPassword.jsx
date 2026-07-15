import { useState } from "react";
import { Link } from "react-router-dom";
import "./AuthPages.css";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");
        setLoading(true);

        try {
            const response = await fetch(
                "https://localhost:7127/api/Auth/forgot-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    typeof data === "string"
                        ? data
                        : "Reset link could not be sent."
                );
                return;
            }

            setMessage(
                "If this email is registered with CareerCoach, a password reset link has been sent."
            );
        } catch (err) {
            console.log(err);
            setError("Could not connect to CareerCoach server.");
        } finally {
            setLoading(false);
        }
    };

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
                    Forgot your password?
                </h2>

                <p className="auth-description">
                    Enter the email address connected to your CareerCoach account.
                    We will send you a secure password reset link.
                </p>

                <form onSubmit={handleSubmit}>
                    <label>Email Address</label>

                    <input
                        type="email"
                        placeholder="example@mail.com"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                            setMessage("");
                        }}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}

                <Link to="/login" className="auth-link">
                    Back to Login
                </Link>
            </div>
        </div>
    );
}

export default ForgotPassword;