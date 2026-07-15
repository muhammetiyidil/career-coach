import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {

    const [user, setUser] = useState(() => {
        const savedUser =
            localStorage.getItem('careercoach-user')

        return savedUser
            ? JSON.parse(savedUser)
            : null
    })

    const [token, setToken] = useState(() => {
        return localStorage.getItem('careercoach-token')
    })

    const login = (userData, jwtToken) => {

        setUser(userData)

        setToken(jwtToken)

        localStorage.setItem(
            'careercoach-user',
            JSON.stringify(userData)
        )

        localStorage.setItem(
            'careercoach-token',
            jwtToken
        )
    }

    const logout = () => {

        setUser(null)

        setToken(null)

        localStorage.removeItem('careercoach-user')

        localStorage.removeItem('careercoach-token')

        window.location.href = '/'
    }

    const isAdmin =
        user?.role === 'Admin'

    const isUser =
        user?.role === 'User'

    return (
        <AuthContext.Provider
            value={{
                user,
                token,

                login,
                logout,

                isAdmin,
                isUser
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}