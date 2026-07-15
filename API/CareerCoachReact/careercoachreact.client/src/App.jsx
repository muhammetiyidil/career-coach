import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import PageTransitionLoader from './components/PageTransitionLoader'

import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

import Dashboard from './pages/Dashboard'
import Skills from './pages/Skills'
import CareerMatches from './pages/CareerMatches'
import LearningRoadmap from './pages/LearningRoadmap'
import LearningHistory from './pages/LearningHistory'
import AccountSettings from './pages/AccountSettings'
import Profile from './pages/Profile'

import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminDepartments from './pages/AdminDepartments'
import AdminSkills from './pages/AdminSkills'
import AdminSkillCategories from './pages/AdminSkillCategories'
import AdminCareers from './pages/AdminCareers'
import AdminCareerRequirements from './pages/AdminCareerRequirements'
import AdminLearningPlatforms from './pages/AdminLearningPlatforms'
import AdminJobPlatforms from './pages/AdminJobPlatforms'
import AdminAnalytics from './pages/AdminAnalytics'
import AdminLearningProgress from './pages/AdminLearningProgress'

function ProtectedRoute({ children }) {
    const { user } = useAuth()

    if (!user) {
        return <Navigate to="/" replace />
    }

    return children
}

function AdminRoute({ children }) {
    const { user } = useAuth()

    if (!user) {
        return <Navigate to="/" replace />
    }

    if (user.role !== 'Admin') {
        return <Navigate to="/dashboard" replace />
    }

    return children
}

function App() {
    return (
        <BrowserRouter>
            <PageTransitionLoader />
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route
                    path="/dashboard"
                    element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
                />

                <Route
                    path="/profile"
                    element={<ProtectedRoute><Profile /></ProtectedRoute>}
                />

                <Route
                    path="/account-settings"
                    element={<ProtectedRoute><AccountSettings /></ProtectedRoute>}
                />

                <Route
                    path="/skills"
                    element={<ProtectedRoute><Skills /></ProtectedRoute>}
                />

                <Route
                    path="/career-matches"
                    element={<ProtectedRoute><CareerMatches /></ProtectedRoute>}
                />

                <Route
                    path="/learning-roadmap"
                    element={<ProtectedRoute><LearningRoadmap /></ProtectedRoute>}
                />

                <Route
                    path="/learning-history"
                    element={<ProtectedRoute><LearningHistory /></ProtectedRoute>}
                />

                <Route
                    path="/admin"
                    element={<AdminRoute><AdminDashboard /></AdminRoute>}
                />

                <Route
                    path="/admin/users"
                    element={<AdminRoute><AdminUsers /></AdminRoute>}
                />

                <Route
                    path="/admin/departments"
                    element={<AdminRoute><AdminDepartments /></AdminRoute>}
                />

                <Route
                    path="/admin/skills"
                    element={<AdminRoute><AdminSkills /></AdminRoute>}
                />

                <Route
                    path="/admin/skill-categories"
                    element={<AdminRoute><AdminSkillCategories /></AdminRoute>}
                />

                <Route
                    path="/admin/careers"
                    element={<AdminRoute><AdminCareers /></AdminRoute>}
                />

                <Route
                    path="/admin/career-requirements"
                    element={<AdminRoute><AdminCareerRequirements /></AdminRoute>}
                />

                <Route
                    path="/admin/learning-platforms"
                    element={<AdminRoute><AdminLearningPlatforms /></AdminRoute>}
                />

                <Route
                    path="/admin/job-platforms"
                    element={<AdminRoute><AdminJobPlatforms /></AdminRoute>}
                />

                <Route
                    path="/admin/learning-progress"
                    element={<AdminRoute><AdminLearningProgress /></AdminRoute>}
                />

                <Route
                    path="/admin/analytics"
                    element={<AdminRoute><AdminAnalytics /></AdminRoute>}
                />
            </Routes>
        </BrowserRouter>
    )
}

export default App