import { LogOut } from "lucide-react"
import { Route, Routes, Navigate } from "react-router-dom"
import { useState, useEffect } from "react";
import DesktopNavBar from "./Navbars/DesktopNavBar";
import Dashboard from "./Dashboards/Dashboard";
import UpperNavbar from "./Navbars/UpperNavbar";
import Loader from "./Loader/Loader";
import { HomeContext } from "./HomeContext";
import RawMaterial from "./pages/RawMaterial/RawMaterial";
import Suppliers from "./pages/Suppliers/Suppliers";
import BatchProduction from "./pages/BatchProduction/BatchProduction";
import CreateBatchWizard from "./pages/BatchProduction/CreateBatchWizard";
import BatchDetails from "./pages/BatchProduction/BatchDetails";
import ProductionReport from "./pages/BatchProduction/ProductionReport";
import FormulationsAndRnD from "./pages/FormulationsRnD/FormulationsAndRnD";
import FormulationDetails from "./pages/FormulationsRnD/FormulationDetails";
import QualityControl from "./pages/QualityControl/QualityControl";
import Staff from "./pages/Staff/Staff";
import StaffDetails from "./pages/OneStaffDetail/StaffDetails";
import { useAuth } from "@/contexts/AuthContext";

const Home = () => {
    const [userDrawerOpen, setUserDrawerOpen] = useState(false);
    const { user, logout, loading, isAuthenticated } = useAuth();

    // Redirect to login if not authenticated
    if (loading) {
        return (
            <div className='flex h-screen justify-center items-center'>
                <Loader />
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth/signin" replace />;
    }

    const role = user?.role || "Admin";

    return (
        <HomeContext.Provider value={{ Role: role }}>
            <div className="relative h-screen flex flex-col">

                <UpperNavbar setUserDrawer={setUserDrawerOpen} />

                <div className="flex h-full overflow-y-hidden">
                    <DesktopNavBar />

                    <div className="flex-1 p-5 overflow-y-auto bg-slate-100 dark:bg-[#282C35]">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/inventory/inventory" element={<RawMaterial />} />
                            <Route path="/inventory/suppliers" element={<Suppliers />} />
                            <Route path="/production/formulations-and-rd" element={<FormulationsAndRnD />} />
                            <Route path="/production/formulations/:id" element={<FormulationDetails />} />
                            <Route path="/production/batch-production" element={<BatchProduction />} />
                            <Route path="/production/batch-production/create" element={<CreateBatchWizard />} />
                            <Route path="/production/batch-production/:id" element={<BatchDetails />} />
                            <Route path="/production/batch-production/:id/report" element={<ProductionReport />} />
                            <Route path="/production/quality-control" element={<QualityControl />} />
                            <Route path="/staff" element={<Staff />} />
                            <Route path="/user/:id" element={<StaffDetails/>} />
                        </Routes>
                    </div>
                </div>

                {userDrawerOpen && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center" onClick={() => setUserDrawerOpen(false)}>
                        <div className="flex flex-col items-center w-[95%] md:w-[60%] lg:w-[50%] xl:w-[30%] rounded bg-white dark:bg-[#1A1C22] p-4" onClick={(e) => e.stopPropagation()}>
                            <div className="mb-4 text-center">
                                <p className="text-lg font-semibold dark:text-white">{user?.firstName} {user?.lastName}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{user?.role}</p>
                            </div>
                            <span className="text-xl font-bold tracking-wider dark:text-white mb-4">Are you sure you want to logout?</span>
                            <button 
                                onClick={logout}
                                className="font-semibold bg-red-500 text-white rounded px-4 py-2 w-[50%] cursor-pointer hover:bg-red-600 transition"
                            >
                                Logout
                                <LogOut className="inline-block ml-2 size-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </HomeContext.Provider>
    )
}

export default Home
