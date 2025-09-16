import { RefreshCcw } from "lucide-react"
import { Button } from "../../ui/button"
import CriticalAlerts from "../_Components/CriticalAlerts"
import KeyPerformanceIndicators from "./_Components/KeyPerformanceIndicators"

const AdminDashboard = () => {
    return (
        <div className="flex flex-col gap-8">
            {/* Header Section */}
            <div className="flex justify-between items-center">
                <div className="flex flex-col text-black dark:text-white">
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Welcome to the admin dashboard</p>
                </div>

                <div className="flex items-center gap-3 text-black dark:text-white">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last updated: 2 days ago</p>
                    <Button className="group cursor-pointer">Refresh <RefreshCcw className="size-4 group-hover:rotate-[-45deg] transition-transform" /></Button>
                </div>
            </div>

            <div className="h-0.5 bg-gray-200 dark:bg-gray-700" />

            {/* Critical Alert Section */}
            <CriticalAlerts />

            {/* Key Performance Indicators */}
            <KeyPerformanceIndicators />

            {/* Graphical Representations */}
            
        </div>
    )
}

export default AdminDashboard
