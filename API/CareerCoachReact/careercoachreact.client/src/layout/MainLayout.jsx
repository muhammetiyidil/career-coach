import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'

function MainLayout({
    children,
    title,
    subtitle,
}) {
    return (
        <div className="app-shell">
            <Sidebar />

            <main className="main-content">
                <Navbar
                    title={title}
                    subtitle={subtitle}
                />

                <section className="page-content">
                    {children}
                </section>
            </main>

            <BottomNav />
        </div>
    )
}

export default MainLayout