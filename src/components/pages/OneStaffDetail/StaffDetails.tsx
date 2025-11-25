import Loader from '@/components/Loader/Loader';
import type { User } from '@/lib/types';
import { Award, Box, CircleDollarSign, Search, ShoppingCart, Edit } from 'lucide-react';
import { createElement, useEffect, useState, useContext } from 'react'
import { useParams } from 'react-router-dom';
import SetStandardOutputModal from './SetStandardOutputModal';
import api from '@/lib/api';
import { HomeContext } from '@/components/HomeContext';

const userData: Record<string, { description: string; icon: any; background: string; iconColor: string }> = {
    "Admin": {
        description: "Administrators have full access to all system features and settings. They can manage users, configure system settings, and oversee overall operations.",
        icon: CircleDollarSign,
        background: "bg-blue-300/35",
        iconColor: "text-blue-600/40"
    },
    "Staff": {
        description: "Staff members are responsible for executing tasks assigned to them. They have access to specific modules relevant to their job functions and can update task statuses.",
        icon: Award,
        background: "bg-yellow-300/35",
        iconColor: "text-yellow-600/40"
    },
    "Worker": {
        description: "Workers are responsible for executing tasks assigned to them. They have access to specific modules relevant to their job functions and can update task statuses.",
        icon: Award,
        background: "bg-yellow-300/35",
        iconColor: "text-yellow-600/40"
    },
    "ProductionManager": {
        description: "Production Managers oversee manufacturing operations and ensure that production targets are met efficiently. They have access to production planning and reporting tools.",
        icon: ShoppingCart,
        background: "bg-green-300/35",
        iconColor: "text-green-600/40"
    },
    "InventoryManager": {
        description: "Inventory Managers are responsible for managing stock levels, ordering supplies, and ensuring that inventory records are accurate. They have access to inventory management modules.",
        icon: Box,
        background: "bg-purple-300/35",
        iconColor: "text-purple-600/40"
    },
    "Supervisor": {
        description: "Supervisors oversee the work of others and ensure that tasks are completed efficiently. They have access to reporting tools and can manage team assignments.",
        icon: Search,
        background: "bg-red-300/35",
        iconColor: "text-red-600/40"
    },
    "Sales": {
        description: "Sales representatives manage client relationships, create invoices, and track orders. They have access to client management and billing modules.",
        icon: ShoppingCart,
        background: "bg-indigo-300/35",
        iconColor: "text-indigo-600/40"
    },
    "Dispatch": {
        description: "Dispatch coordinators manage shipping and delivery operations. They track shipments, update delivery status, and coordinate with logistics partners.",
        icon: Box,
        background: "bg-orange-300/35",
        iconColor: "text-orange-600/40"
    },
}

const Details = () => {
    const [showStandardOutputModal, setShowStandardOutputModal] = useState(false);
    const [data, setData] = useState<null | User>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const params = useParams();
    const { id } = params;
    const { Role: currentUserRole } = useContext(HomeContext);
    const Role = data?.role || "Staff";

    const fetchStaffDetails = async () => {
        if (!id) return;
        
        try {
            setLoading(true);
            setError(null);
            
            // Fetch user basic details
            const userResponse = await api.get(`/api/users/${id}`);
            const userData = userResponse.data;
            
            // Try to fetch worker efficiency data if user is a worker/staff
            if (userData.role === "Staff" || userData.role === "Worker") {
                try {
                    const efficiencyResponse = await api.get(`/api/worker-efficiency/${id}`);
                    userData.workerEfficiency = {
                        id: efficiencyResponse.data.worker?.id || id,
                        userId: id,
                        standardOutputQtyPerShift: efficiencyResponse.data.standardOutput || 0,
                        punctualityScore: efficiencyResponse.data.efficiency?.punctualityScore || 0,
                        efficiencyRating: efficiencyResponse.data.efficiency?.overallRating || 0,
                        batchHistory: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                } catch (effError: any) {
                    // Worker efficiency might not exist yet, that's okay
                    console.log("Worker efficiency not found, will show N/A");
                    userData.workerEfficiency = null;
                }
            }
            
            // Set empty arrays for relations that might not exist
            userData.createdFormulations = [];
            userData.supervisedBatches = [];
            userData.createdInvoices = [];
            userData.createdDispatches = [];
            
            setData(userData);
        } catch (error: any) {
            console.error("Error fetching staff details:", error);
            setError(error.response?.data?.error || "Failed to fetch staff details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaffDetails();
    }, [id])

    if (loading) {
        return (
            <div className='h-full flex justify-center items-center'>
                <Loader />
            </div>
        )
    }

    if (error || data === null) {
        return (
            <div className='h-full flex justify-center items-center'>
                <div className='text-center'>
                    <p className='text-red-600 text-lg font-semibold mb-2'>
                        {error || "Staff member not found"}
                    </p>
                    <button 
                        onClick={() => window.history.back()}
                        className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col xl:flex-row w-full gap-3">
            <div className="relative flex-col w-full xl:w-1/2 h-[350px] sm:h-[500px]">
                <img
                    src="/IDBackground.png"
                    alt="ID Background"
                    className="absolute object-fill sm:rounded-3xl h-[350px] sm:h-[500px] w-full"
                />

                <div className='absolute flex justify-center mx-auto gap-3 left-[50%] top-6 sm:top-9 transform -translate-x-1/2 w-full'>
                    <img src='/logo.png' className='w-[50px] h-[50px] sm:w-[75px] sm:h-[75px] rounded-full' />
                    <div className='flex flex-col justify-center'>
                        <h1 className='sm:text-3xl font-bold'>UMMS</h1>
                        <h2 className='text-sm sm:text-xl'>Staff Identification Card</h2>
                    </div>
                </div>

                <div className='absolute flex flex-col top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-full p-4 md:px-16 gap-5'>
                    <div className='flex justify-center items-center w-full gap-3 sm:gap-8'>
                        <img src="/Avatar.png" className='w-[125px] h-[175px] sm:w-[200px] sm:h-[250px] object-fill rounded-md' />
                        <div className='flex flex-col justify-center'>
                            <h1 className='text-sm sm:text-xl font-bold'>Name: {data.firstName} {data.lastName}</h1>
                            <br />
                            <h1 className='text-sm sm:text-xl font-bold'>Role: {data.role}</h1>
                            <br />
                            <h1 className='text-sm sm:text-xl font-bold'>Joining: {new Date(data.createdAt).toLocaleDateString()}</h1>
                            <br />
                            <h1 className='text-sm sm:text-xl font-bold'>ID: {data.id.substring(0, 12)}...</h1>
                        </div>
                    </div>
                </div>
                <h1 className='absolute bottom-6 left-[50%] transform -translate-x-1/2 font-bold w-full text-center px-4'>This is a Staff Identification Card Made for UMMS People</h1>
            </div>
            <div className="flex flex-col w-full xl:w-1/2 gap-3">
                <div className={`relative flex justify-center items-center rounded-md p-8 lg:p-2 flex-1  ${userData[Role]?.background || 'bg-gray-300/35'} overflow-hidden`}>
                    {userData[Role]?.icon && createElement(userData[Role].icon, { className: `size-56 w-1/2 absolute lg:static top-0 ${userData[Role]?.iconColor || 'text-gray-600/40'}` })}
                    <h3 className="max-lg:text-center text-lg font-semibold">{userData[Role]?.description || 'System user with assigned responsibilities.'}</h3>
                </div>
                <div className='flex flex-col flex-1 gap-3'>
                    <div className='flex flex-wrap gap-3 flex-1'>
                        <div className='flex flex-col min-w-[200px] bg-purple-300 rounded-md p-4 text-center justify-center flex-1'>
                            <h1 className='font-bold text-lg'>Punctuality Score</h1>
                            <h2 className='font-semibold text-3xl mt-2'>{data.workerEfficiency?.punctualityScore ?? 'N/A'}</h2>
                        </div>

                        <div className='flex flex-col min-w-[200px] bg-purple-300 rounded-md p-4 text-center justify-center flex-1'>
                            <h1 className='font-bold text-lg'>Efficiency Rating</h1>
                            <h2 className='font-semibold text-3xl mt-2'>{data.workerEfficiency?.efficiencyRating ?? 'N/A'}</h2>
                        </div>

                        {(data.role === "Worker" || data.role === "Staff") && (
                            <div className='flex flex-col min-w-[200px] bg-purple-300 rounded-md p-4 text-center justify-center flex-1 relative'>
                                <h1 className='font-bold text-lg'>Standard Output</h1>
                                <h2 className='font-semibold text-3xl mt-2'>{data.workerEfficiency?.standardOutputQtyPerShift ?? 'N/A'}</h2>
                                {(currentUserRole === "Admin" || currentUserRole === "ProductionManager" || currentUserRole === "Supervisor") && (
                                    <button
                                        onClick={() => setShowStandardOutputModal(true)}
                                        className='absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full transition shadow-sm'
                                        title="Set Standard Output"
                                    >
                                        <Edit className='w-4 h-4 text-purple-700' />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    {data.role === "Supervisor" ?  (
                        <div className='flex flex-col bg-yellow-200 flex-1 p-4 rounded-md'>
                            <h2 className='font-bold text-xl'>Supervised Batches</h2>
                            <h2 className='font-semibold'>{data.supervisedBatches?.length}</h2>
                        </div>
                    ): data.role === "ProductionManager" ? (
                        <div className='flex flex-col bg-yellow-200 flex-1 p-4 rounded-md '>
                            <h2 className='font-bold text-xl'>Created Formulations</h2>
                            <h2 className='font-semibold'>{data.createdFormulations?.length}</h2>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Standard Output Modal */}
            {showStandardOutputModal && (
                <SetStandardOutputModal
                    userId={data.id}
                    workerName={`${data.firstName} ${data.lastName}`}
                    currentStandardOutput={data.workerEfficiency?.standardOutputQtyPerShift ?? 0}
                    onClose={() => setShowStandardOutputModal(false)}
                    onSuccess={() => {
                        setShowStandardOutputModal(false);
                        // Refresh the staff details to show updated data
                        fetchStaffDetails();
                    }}
                />
            )}
        </div>
    )
}

export default Details
