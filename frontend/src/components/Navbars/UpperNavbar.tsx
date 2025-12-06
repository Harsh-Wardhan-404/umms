import { Bell, CircleUserRound, Search } from 'lucide-react'
import ThemeToggle from '../ThemeToggle'
import MobileNavBar from './MobileNavBar'
import { useAuth } from '@/contexts/AuthContext'

const UpperNavbar = ({ setUserDrawer }: { setUserDrawer: React.Dispatch<React.SetStateAction<boolean>> }) => {
    const { user } = useAuth();
    
    return (
        <div className="flex justify-between items-center h-14 px-5 py-3 bg-slate-200 dark:bg-gray-700">
            <div className="flex items-center gap-3">
                <img 
                    src="/logo.jpeg" 
                    alt="Company Logo" 
                    className="h-10 w-auto"
                    style={{ maxHeight: '40px', objectFit: 'contain' }}
                />
            </div>
            <div className="hidden md:flex items-center">
                <input type="text" className="border border-gray-300 rounded-l-md p-1 bg-white placeholder:text-slate-400 lg:w-[300px]" placeholder="Search anything..." />
                <button className="border border-gray-300 px-3 py-1 bg-blue-500 text-white rounded-r-md cursor-pointer"><Search /></button>
            </div>
            <div className="flex items-center gap-5">

                <div className="flex items-center justify-between border border-blue-400 gap-3 px-3 py-1 rounded-lg cursor-pointer" onClick={() => setUserDrawer(true)}>
                    <CircleUserRound className="text-blue-400" />
                    <div className="hidden md:flex flex-col">
                        <span className="text-sm">{user?.firstName} {user?.lastName}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-300">{user?.role}</span>
                    </div>
                </div>

                <div className="hidden md:block border border-gray-300 rounded-lg">
                    <ThemeToggle />
                </div>

                <div className='flex md:hidden justify-center items-center'>
                    <MobileNavBar />
                </div>
            </div>
        </div>
    )
}

export default UpperNavbar
