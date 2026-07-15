import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children, role }) {

    const { user } = useAuth()

    // login yoksa
    if (!user) {
        return <Navigate to="/" />
    }

    // role kontrolü (admin vs user)
    if (role && user.role !== role) {
        return <Navigate to="/dashboard" />
    }

    return children
}

export default ProtectedRoute