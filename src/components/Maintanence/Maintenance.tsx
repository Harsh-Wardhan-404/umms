import { Badge } from "../ui/badge";
import "./Maintenance.css"
import { MAINTENANCE_MODE } from "@/lib/envVariables";

const Maintenance = () => {
    return (
        <div className="flex justify-center items-center h-screen bg-gray-200">
            <div className="flex justify-center items-center bg-gradient-to-b from-slate-500 to-slate-100 p-1 rounded-lg shadow">
                <div className="relative flex flex-col justify-center items-center gap-8 w-full h-full bg-white pt-12 p-3 rounded-lg">
                    <div className="flex flex-col justify-center items-center gap-3">
                        <Badge variant={"outline"} className="absolute flex items-center top-2 right-2 p-2 bg-red-100 border-red-300 text-red-600">
                            System Offline
                            <div className="relative">
                                <div className="size-2 bg-red-600 rounded-full" />
                                <div className="absolute inset-0 size-2 bg-red-600 rounded-full animate-ping" />
                            </div>
                        </Badge>
                        <h1 className="text-3xl font-bold">Maintenance Break</h1>
                        <div className="flex flex-col justify-center items-center gap-1">
                            <h2 className="text-lg font-semibold">We are currently performing scheduled maintenance.</h2>
                            <h2 className="text-md font-medium">Estimated Time: {MAINTENANCE_MODE.estimatedTime}</h2>
                        </div>
                    </div>

                    {/* Terminal Loader */}
                    <div className="terminal-loader">
                        <div className="terminal-header">
                            <div className="terminal-title">Status</div>
                            <div className="terminal-controls">
                                <div className="control close"></div>
                                <div className="control minimize"></div>
                                <div className="control maximize"></div>
                            </div>
                        </div>
                        <div className="text">please wait... </div>
                    </div>

                    {/* Support */}
                    <h2 className="text-sm text-gray-600 flex gap-1">
                        Need help? Our support team is always here to assist you.
                        <span className="font-medium text-blue-600 hover:underline cursor-pointer">
                            Contact us
                        </span>
                    </h2>
                </div>
            </div>
        </div>
    )
}

export default Maintenance
