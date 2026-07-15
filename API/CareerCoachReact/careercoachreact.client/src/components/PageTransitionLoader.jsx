import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export default function PageTransitionLoader() {
    const location = useLocation()
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        setVisible(true)
        const timer = setTimeout(() => setVisible(false), 1000)
        return () => clearTimeout(timer)
    }, [location.pathname])

    if (!visible) return null

    return (
        <div className="page-transition-loader" aria-live="polite" aria-busy="true">
            <div className="page-transition-panel">
                <div className="page-transition-spinner">
                    <i className="bi bi-search" />
                </div>
                <p>CareerCoach hazırlanıyor...</p>
            </div>
        </div>
    )
}
