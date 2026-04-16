import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const MainLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex flex-col">
                <Header />
                <main className="ml-64 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;