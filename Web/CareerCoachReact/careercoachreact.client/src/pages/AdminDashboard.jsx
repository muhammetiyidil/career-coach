import { useEffect, useState } from 'react'
import MainLayout from '../layout/MainLayout'
import api from '../services/api'

function AdminDashboard() {
    const [stats, setStats] = useState({
        users: 0,
        skills: 0,
        careers: 0,
        learningPlatforms: 0,
        jobPlatforms: 0,
    })

    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        fetchStats()
    }, [])

    const getCount = (response) => {
        if (Array.isArray(response.data)) {
            return response.data.length
        }

        if (Array.isArray(response.data?.data)) {
            return response.data.data.length
        }

        if (Array.isArray(response.data?.items)) {
            return response.data.items.length
        }

        return 0
    }

    const fetchStats = async () => {
        try {
            setLoading(true)
            setErrorMessage('')

            const [
                users,
                skills,
                careers,
                learningPlatforms,
                jobPlatforms,
            ] = await Promise.all([
                api.get('/Users'),
                api.get('/Skills'),
                api.get('/Careers'),
                api.get('/LearningPlatforms/active'),
                api.get('/JobPlatforms/active'),
            ])

            setStats({
                users: getCount(users),
                skills: getCount(skills),
                careers: getCount(careers),
                learningPlatforms: getCount(learningPlatforms),
                jobPlatforms: getCount(jobPlatforms),
            })
        } catch (err) {
            console.log(
                'Admin dashboard error:',
                err.response?.status,
                err.response?.data || err
            )

            if (err.response?.status === 401) {
                setErrorMessage('Unauthorized. Please login again.')
            } else if (err.response?.status === 403) {
                setErrorMessage('Forbidden. Your account does not have Admin role.')
            } else if (err.response?.status === 404) {
                setErrorMessage('One of the admin API endpoints was not found.')
            } else {
                setErrorMessage('Admin dashboard data could not be loaded.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <MainLayout
            title="Admin Dashboard"
            subtitle="Manage platform data, career requirements, skills, learning platforms, job platforms, and analytics."
        >
            {errorMessage && (
                <div className="alert alert-danger rounded-4 border-0 mb-4">
                    {errorMessage}
                </div>
            )}

            {loading && (
                <div className="alert alert-light border rounded-4 mb-4">
                    Loading admin dashboard data...
                </div>
            )}

            <div className="row g-4 mb-4">
                <StatCard title="Users" value={stats.users} />
                <StatCard title="Skills" value={stats.skills} />
                <StatCard title="Careers" value={stats.careers} />
                <StatCard
                    title="Learning Platforms"
                    value={stats.learningPlatforms}
                />
                <StatCard
                    title="Job Platforms"
                    value={stats.jobPlatforms}
                />
            </div>

            <div className="modern-card">
                <h3 className="fw-bold mb-4">Admin Modules</h3>

                <div className="row g-3">
                    <AdminModule
                        title="Users"
                        text="View registered users."
                        link="/admin/users"
                    />

                    <AdminModule
                        title="Skills"
                        text="Manage technical and personal skills."
                        link="/admin/skills"
                    />

                    <AdminModule
                        title="Careers"
                        text="Manage career options."
                        link="/admin/careers"
                    />

                    <AdminModule
                        title="Requirements"
                        text="Define required skills for careers."
                        link="/admin/career-requirements"
                    />

                    <AdminModule
                        title="Learning Platforms"
                        text="Manage learning platforms."
                        link="/admin/resources"
                    />

                    <AdminModule
                        title="Job Platforms"
                        text="Manage job platforms."
                        link="/admin/job-platforms"
                    />

                    <AdminModule
                        title="Analytics"
                        text="View system insights."
                        link="/admin/analytics"
                    />
                </div>
            </div>
        </MainLayout>
    )
}

function StatCard({ title, value }) {
    return (
        <div className="col-md-4 col-xl">
            <div className="modern-card text-center h-100">
                <h6 className="text-muted mb-2">{title}</h6>
                <h2 className="fw-bold">{value}</h2>
            </div>
        </div>
    )
}

function AdminModule({ title, text, link }) {
    return (
        <div className="col-md-4">
            <a href={link} className="text-decoration-none">
                <div className="career-card-modern h-100">
                    <span className="career-badge">Admin</span>
                    <h4>{title}</h4>
                    <p>{text}</p>
                    <button type="button" className="btn btn-primary rounded-4">
                        Open
                    </button>
                </div>
            </a>
        </div>
    )
}

export default AdminDashboard