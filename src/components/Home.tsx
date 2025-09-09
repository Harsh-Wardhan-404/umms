import { LogOut } from "lucide-react"
import { Route, Routes } from "react-router-dom"
import { useState } from "react";
import DesktopNavBar from "./Navbars/DesktopNavBar";
import Dashboard from "./Dashboards/Dashboard";
import UpperNavbar from "./Navbars/UpperNavbar";

const Home = () => {
    const [userDrawerOpen, setUserDrawerOpen] = useState(false);
    return (
        <div className="relative h-screen flex flex-col">

            <UpperNavbar setUserDrawer={setUserDrawerOpen} />

            <div className="flex h-full overflow-y-hidden">
                <DesktopNavBar />

                <div className="flex-1 p-5 overflow-y-auto bg-slate-100 dark:bg-[#282C35]">
                    <Routes>
                        <Route path="/dashboard" element={<Dashboard />} />
                    </Routes>
                </div>
            </div>

            {userDrawerOpen && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center" onClick={() => setUserDrawerOpen(false)}>
                    <div className="flex flex-col items-center w-[95%] md:w-[60%] lg:w-[50%] xl:w-[30%] rounded bg-white dark:bg-[#1A1C22] p-4" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xl font-bold tracking-wider dark:text-white">Are you sure you want to logout?</span>
                        <button className="font-semibold mt-4 bg-red-500 text-white rounded px-4 py-2 w-[50%] cursor-pointer">
                            Logout
                            <LogOut className="inline-block ml-2 size-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Home
