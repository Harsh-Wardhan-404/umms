import { Bell, CircleUserRound, Search } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const UpperNavbar = ({ setUserDrawer }: { setUserDrawer: React.Dispatch<React.SetStateAction<boolean>> }) => {
    return (
        <div className="flex justify-between items-center h-14 px-5 py-3 bg-slate-200 dark:bg-gray-700">
            <h1 className="text-lg font-bold">UMMS</h1>
            <div className="hidden md:flex items-center">
                <input type="text" className="border border-gray-300 rounded-l-md p-1 bg-white placeholder:text-slate-400 lg:w-[300px]" placeholder="Search anything..." />
                <button className="border border-gray-300 px-3 py-1 bg-blue-500 text-white rounded-r-md cursor-pointer"><Search /></button>
            </div>
            <div className="flex items-center gap-5">
                <div className="relative">
                    <Bell fill="black" />
                    <div className="absolute top-1 right-1 translate-x-1/2 -translate-y-1/2 min-w-[16px] h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                        5
                    </div>
                </div>

                <div className="flex items-center justify-between border border-blue-400 gap-3 px-3 py-1 rounded-lg cursor-pointer" onClick={() => setUserDrawer(true)}>
                    <CircleUserRound className="text-blue-400" />
                    <div className="hidden md:flex flex-col">
                        <span className="text-sm">John Doe</span>
                        <span className="text-xs text-gray-500 dark:text-gray-300">Admin</span>
                    </div>
                </div>

                <div className="border border-gray-300 rounded-lg">
                    <ThemeToggle />
                </div>
            </div>
        </div>
    )
}

export default UpperNavbar
