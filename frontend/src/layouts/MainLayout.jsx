import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const MainLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-[#020617] bg-scada-grid">
            <Sidebar />
            <div className="flex flex-col">
                <Header />
                <main className="ml-72 p-8 relative">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;