import { useEffect, useState } from "react"
import { Badge } from "../../ui/badge"
import { TriangleAlert } from "lucide-react"
import api from "@/lib/api"

interface Alert {
    materialId: string
    materialName: string
    currentStock: number
    threshold: number
    unit: string
    urgency: string
    message: string
}

const CriticalAlerts = () => {
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const response = await api.get("/api/stock/alerts/low-stock")
                setAlerts(response.data.alerts || [])
            } catch (error) {
                console.error("Error fetching alerts:", error)
                setAlerts([])
            } finally {
                setLoading(false)
            }
        }

        fetchAlerts()
    }, [])

    if (loading) {
        return (
            <div className="flex flex-col gap-3 p-3 bg-slate-200 dark:bg-gray-700 rounded-md text-black dark:text-white">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                        <TriangleAlert />
                        <span className="ml-2 font-bold text-lg">Critical Alerts</span>
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading alerts...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3 p-3 bg-slate-200 dark:bg-gray-700 rounded-md text-black dark:text-white">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                    <TriangleAlert />
                    <span className="ml-2 font-bold text-lg">Critical Alerts</span>
                </div>
                {alerts.length > 0 && (
                    <Badge variant="destructive" className="dark:bg-red-500">
                        {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
                    </Badge>
                )}
            </div>

            {alerts.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">No critical alerts at this time.</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {alerts.map((alert) => (
                        <div key={alert.materialId} className="flex justify-between px-2 py-4 bg-red-200 border-l-4 border-red-600 rounded-md">
                            <p className="text-md font-semibold text-black">{alert.message}</p>
                            <span className="text-xs text-gray-800">{new Date().toLocaleTimeString()}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default CriticalAlerts
