import { useEffect, useState } from 'react'
import MainLayout from '../layout/MainLayout'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

function AccountSettings() {
    const { user, login } = useAuth()

    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [photoPreview, setPhotoPreview] = useState('')

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        country: '',
        city: '',
        phone: '',
        profilePhotoUrl: '',
    })

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    })

    useEffect(() => {
        if (user) {
            setForm({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                country: user.country || '',
                city: user.city || '',
                phone: user.phone || '',
                profilePhotoUrl: user.profilePhotoUrl || '',
            })
        }
    }, [user])

    const getPhotoUrl = (url) => {
        if (!url) return ''

        if (url.startsWith('http')) {
            return url
        }

        return `https://localhost:7127${url}`
    }

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        })

        setMessage('')
    }

    const handlePasswordChange = (e) => {
        setPasswordForm({
            ...passwordForm,
            [e.target.name]: e.target.value,
        })

        setMessage('')
    }

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0]

        if (!file) return

        try {
            setLoading(true)
            setMessage('')

            setPhotoPreview(URL.createObjectURL(file))

            const formData = new FormData()
            formData.append('file', file)

            const response = await api.post(
                `/Users/${user.id}/upload-profile-photo`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            )

            login(response.data)

            setForm((prev) => ({
                ...prev,
                profilePhotoUrl: response.data.profilePhotoUrl || '',
            }))

            setMessage('Profile photo uploaded successfully.')
        } catch (err) {
            console.log(err)
            setMessage(err.response?.data || 'Profile photo could not be uploaded.')
        } finally {
            setLoading(false)
        }
    }

    const handleRemovePhoto = async () => {
        try {
            setLoading(true)
            setMessage('')
            setPhotoPreview('')

            const response = await api.delete(`/Users/${user.id}/remove-profile-photo`)

            login(response.data)

            setForm((prev) => ({
                ...prev,
                profilePhotoUrl: '',
            }))

            setMessage('Profile photo removed successfully.')
        } catch (err) {
            console.log(err)
            setMessage(err.response?.data || 'Profile photo could not be removed.')
        } finally {
            setLoading(false)
        }
    }

    const validateForm = () => {
        if (!form.firstName.trim()) {
            setMessage('First name is required.')
            return false
        }

        if (!form.lastName.trim()) {
            setMessage('Last name is required.')
            return false
        }

        if (!form.email.trim()) {
            setMessage('Email is required.')
            return false
        }

        if (!form.country.trim()) {
            setMessage('Country is required.')
            return false
        }

        if (!form.city.trim()) {
            setMessage('City is required.')
            return false
        }

        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) return

        try {
            setLoading(true)
            setMessage('')

            const payload = {
                ...user,
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                country: form.country,
                city: form.city,
                phone: form.phone,
                profilePhotoUrl: form.profilePhotoUrl,
            }

            const response = await api.put(`/Users/${user.id}`, payload)

            login(response.data)

            setForm((prev) => ({
                ...prev,
                profilePhotoUrl: response.data.profilePhotoUrl || prev.profilePhotoUrl,
            }))

            setMessage('Account settings updated successfully.')
        } catch (err) {
            console.log(err)
            setMessage(err.response?.data || 'Account settings could not be updated.')
        } finally {
            setLoading(false)
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()

        if (!passwordForm.currentPassword.trim()) {
            setMessage('Current password is required.')
            return
        }

        if (!passwordForm.newPassword.trim()) {
            setMessage('New password is required.')
            return
        }

        if (!passwordForm.confirmNewPassword.trim()) {
            setMessage('Confirm new password is required.')
            return
        }

        if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
            setMessage('New passwords do not match.')
            return
        }

        try {
            setLoading(true)
            setMessage('')

            await api.put(`/Users/${user.id}/change-password`, {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
                confirmNewPassword: passwordForm.confirmNewPassword,
            })

            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: '',
            })

            setMessage('Password changed successfully.')
        } catch (err) {
            console.log(err)
            setMessage(err.response?.data || 'Password could not be changed.')
        } finally {
            setLoading(false)
        }
    }

    const imageSource = photoPreview || getPhotoUrl(form.profilePhotoUrl)

    return (
        <MainLayout
            title="Account Settings"
            subtitle="Update your personal account information."
        >
            {message && (
                <div className="alert alert-info rounded-4 border-0">
                    {message}
                </div>
            )}

            <div className="modern-card mb-4">
                <form onSubmit={handleSubmit}>
                    <div className="text-center mb-4">
                        <h5 className="fw-bold mb-3">Profile Photo</h5>

                        {imageSource ? (
                            <img
                                src={imageSource}
                                alt="Profile"
                                style={{
                                    width: 130,
                                    height: 130,
                                    objectFit: 'cover',
                                    borderRadius: '50%',
                                    border: '4px solid #eef2ff',
                                }}
                            />
                        ) : (
                            <div
                                className="mx-auto d-flex align-items-center justify-content-center"
                                style={{
                                    width: 130,
                                    height: 130,
                                    borderRadius: '50%',
                                    background: '#eef2ff',
                                    fontSize: 38,
                                    fontWeight: 700,
                                }}
                            >
                                {form.firstName?.charAt(0)}
                                {form.lastName?.charAt(0)}
                            </div>
                        )}

                        <div className="mt-4 d-flex justify-content-center gap-2 flex-wrap">
                            <label className="btn btn-primary rounded-4 px-4">
                                Upload Photo
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/jpg, image/webp"
                                    hidden
                                    onChange={handlePhotoUpload}
                                />
                            </label>

                            {form.profilePhotoUrl && (
                                <button
                                    type="button"
                                    className="btn btn-outline-danger rounded-4 px-4"
                                    onClick={handleRemovePhoto}
                                    disabled={loading}
                                >
                                    Remove Photo
                                </button>
                            )}
                        </div>

                        <div className="text-muted small mt-2">
                            JPG, PNG and WEBP supported
                        </div>
                    </div>

                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">
                                First Name <span className="text-danger">*</span>
                            </label>
                            <input
                                required
                                name="firstName"
                                className="form-control rounded-4"
                                value={form.firstName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">
                                Last Name <span className="text-danger">*</span>
                            </label>
                            <input
                                required
                                name="lastName"
                                className="form-control rounded-4"
                                value={form.lastName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">
                                Email <span className="text-danger">*</span>
                            </label>
                            <input
                                required
                                name="email"
                                type="email"
                                className="form-control rounded-4"
                                value={form.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">
                                Phone
                            </label>
                            <input
                                name="phone"
                                className="form-control rounded-4"
                                value={form.phone}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">
                                Country <span className="text-danger">*</span>
                            </label>
                            <input
                                required
                                name="country"
                                className="form-control rounded-4"
                                value={form.country}
                                onChange={handleChange}
                                placeholder="Example: Turkey"
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">
                                City <span className="text-danger">*</span>
                            </label>
                            <input
                                required
                                name="city"
                                className="form-control rounded-4"
                                value={form.city}
                                onChange={handleChange}
                                placeholder="Example: Istanbul"
                            />
                        </div>
                    </div>

                    <button
                        className="btn btn-primary rounded-4 px-4 mt-4"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>

            <div className="modern-card">
                <h4 className="fw-bold mb-3">Change Password</h4>

                <form onSubmit={handleChangePassword}>
                    <div className="row g-3">
                        <div className="col-12">
                            <label className="form-label">
                                Current Password <span className="text-danger">*</span>
                            </label>
                            <input
                                required
                                name="currentPassword"
                                type="password"
                                className="form-control rounded-4"
                                value={passwordForm.currentPassword}
                                onChange={handlePasswordChange}
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">
                                New Password <span className="text-danger">*</span>
                            </label>
                            <input
                                required
                                name="newPassword"
                                type="password"
                                className="form-control rounded-4"
                                value={passwordForm.newPassword}
                                onChange={handlePasswordChange}
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">
                                Confirm New Password <span className="text-danger">*</span>
                            </label>
                            <input
                                required
                                name="confirmNewPassword"
                                type="password"
                                className="form-control rounded-4"
                                value={passwordForm.confirmNewPassword}
                                onChange={handlePasswordChange}
                            />
                        </div>
                    </div>

                    <button
                        className="btn btn-outline-primary rounded-4 px-4 mt-4"
                        disabled={loading}
                    >
                        {loading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </MainLayout>
    )
}

export default AccountSettings