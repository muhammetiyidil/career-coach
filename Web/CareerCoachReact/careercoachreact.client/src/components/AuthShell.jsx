import { useEffect, useState } from 'react'

const MARQUEE_ITEMS = [
    {
        icon: 'bi-linkedin',
        title: 'LinkedIn entegrasyonu',
        text: 'Profil ve iş ilanlarını tek yerden takip edin.',
    },
    {
        icon: 'bi-briefcase',
        title: 'Kariyer.net & Indeed',
        text: 'Popüler iş platformlarıyla uyumlu kariyer önerileri.',
    },
    {
        icon: 'bi-graph-up-arrow',
        title: 'Kariyer analizi + takip',
        text: 'Analiz ve ilerleme takibi tek panelde birleşir.',
    },
    {
        icon: 'bi-cpu',
        title: 'AI destekli eşleştirme',
        text: 'ML tabanlı skorlama ile size uygun roller bulunur.',
    },
    {
        icon: 'bi-arrow-repeat',
        title: 'Sürekli geliştirilir',
        text: 'Sistem periyodik olarak AI ile iyileştirilir.',
    },
    {
        icon: 'bi-search',
        title: 'Beceri boşluğu analizi',
        text: 'Eksik becerilerinizi görün, yol haritası alın.',
    },
]

function AuthMarquee() {
    const loop = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]

    return (
        <div className="auth-marquee" aria-hidden="true">
            <div className="auth-marquee-track">
                {loop.map((item, index) => (
                    <article key={`${item.title}-${index}`} className="auth-marquee-card">
                        <div className="auth-marquee-icon">
                            <i className={`bi ${item.icon}`} />
                        </div>
                        <h3>{item.title}</h3>
                        <p>{item.text}</p>
                    </article>
                ))}
            </div>
        </div>
    )
}

function MouseFollower() {
    const [pos, setPos] = useState({ x: -100, y: -100 })

    useEffect(() => {
        const onMove = (e) => setPos({ x: e.clientX, y: e.clientY })
        window.addEventListener('mousemove', onMove)
        return () => window.removeEventListener('mousemove', onMove)
    }, [])

    return (
        <div
            className="auth-mouse-follower"
            style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
            aria-hidden="true"
        />
    )
}

function CareerVisual() {
    return (
        <div className="auth-career-visual" aria-hidden="true">
            <div className="auth-visual-ring" />
            <div className="auth-visual-core">
                <i className="bi bi-search" />
            </div>
            <span className="auth-visual-symbol auth-visual-s1">
                <i className="bi bi-bar-chart-line" />
            </span>
            <span className="auth-visual-symbol auth-visual-s2">
                <i className="bi bi-pie-chart" />
            </span>
            <span className="auth-visual-symbol auth-visual-s3">
                <i className="bi bi-clipboard-data" />
            </span>
            <span className="auth-visual-symbol auth-visual-s4">
                <i className="bi bi-lightbulb" />
            </span>
        </div>
    )
}

export default function AuthShell({ children, headline, subline }) {
    return (
        <div className="auth-shell">
            <MouseFollower />
            <AuthMarquee />
            <CareerVisual />

            <div className="auth-shell-content">
                <div className="auth-shell-intro">
                    <div className="auth-brand">
                        <div className="auth-brand-icon">CC</div>
                        <div className="auth-brand-title">CareerCoach</div>
                    </div>
                    <h1 className="auth-hero-title">{headline}</h1>
                    <p className="auth-hero-sub">{subline}</p>
                    <ul className="auth-feature-list">
                        <li>
                            <i className="bi bi-check2-circle" />
                            LinkedIn, Kariyer.net ve Indeed ile entegre kariyer deneyimi
                        </li>
                        <li>
                            <i className="bi bi-check2-circle" />
                            Tek yerden hem kariyer analizi hem ilerleme takibi
                        </li>
                        <li>
                            <i className="bi bi-check2-circle" />
                            AI ile yapılandırılmış, sürekli geliştirilen öneriler
                        </li>
                    </ul>
                </div>

                <div className="auth-shell-card-wrap">{children}</div>
            </div>
        </div>
    )
}
