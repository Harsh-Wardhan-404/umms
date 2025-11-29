import { CriticalAlertsData } from "@/lib/constants"
import { Badge } from "../../ui/badge"
import { TriangleAlert } from "lucide-react"


const CriticalAlerts = () => {
    return (
        <div className="flex flex-col gap-3 p-3 bg-slate-200 dark:bg-gray-700 rounded-md text-black dark:text-white">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                    <TriangleAlert />
                    <span className="ml-2 font-bold text-lg">Critical Alerts</span>
                </div>
                <Badge variant="destructive" className="dark:bg-red-500">3 active alerts</Badge>
            </div>

            <div className="flex flex-col gap-2">
                {CriticalAlertsData.map((alert) => (
                    <div key={alert.id} className="flex justify-between px-2 py-4 bg-red-200 border-l-4 border-red-600 rounded-md">
                        <p className="text-md font-semibold text-black">{alert.message}</p>
                        <span className="text-xs text-gray-800">{new Date().toLocaleTimeString()}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default CriticalAlerts
