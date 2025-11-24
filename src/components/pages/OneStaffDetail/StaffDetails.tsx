import Loader from '@/components/Loader/Loader';
import type { User } from '@/lib/types';
import { Award, Box, CircleDollarSign, Search, ShoppingCart } from 'lucide-react';
import { createElement, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';

const userData = {
    "Admin": {
        description: "Administrators have full access to all system features and settings. They can manage users, configure system settings, and oversee overall operations.",
        icon: CircleDollarSign,
        background: "bg-blue-300/35",
        iconColor: "text-blue-600/40"
    },
    "Worker": {
        description: "Workers are responsible for executing tasks assigned to them. They have access to specific modules relevant to their job functions and can update task statuses.",
        icon: Award,
        background: "bg-yellow-300/35",
        iconColor: "text-yellow-600/40"
    },
    "Production Manager": {
        description: "Supervisors oversee the work of others and ensure that tasks are completed efficiently. They have access to reporting tools and can manage team assignments.",
        icon: ShoppingCart,
        background: "bg-green-300/35",
        iconColor: "text-green-600/40"
    },
    "Inventory Manager": {
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
}

const Details = () => {
    const [data, setData] = useState<null | User>({
        id: "usr_001",
        username: "akhilesh_t",
        email: "akhilesh@example.com",
        passwordHash: "$2b$10$abcdefghi1234567890",
        role: "Worker",
        firstName: "Akhilesh",
        lastName: "Talekar",
        createdAt: new Date("2024-10-15T09:30:00Z"),
        updatedAt: new Date("2025-11-20T18:00:00Z"),

        createdFormulations: [
            {
                id: "frm_101",
                version: 1.0,
                formulaName: "Pain Relief Gel",
                createdAt: new Date("2025-01-05T10:00:00Z"),
                updatedAt: new Date("2025-01-05T10:00:00Z"),
                createdById: "usr_001",
            },
            {
                id: "frm_102",
                version: 2.3,
                formulaName: "Herbal Shampoo",
                createdAt: new Date("2025-02-10T08:45:00Z"),
                updatedAt: new Date("2025-02-15T09:30:00Z"),
                createdById: "usr_001",
            },
        ],

        supervisedBatches: [
            {
                id: "batch_501",
                batchCode: "BCH2025-01",
                formulationId: "frm_101",
                producedQty: 1200,
                dateProduced: new Date("2025-03-05T09:00:00Z"),
                supervisorId: "usr_001",
            },
            {
                id: "batch_502",
                batchCode: "BCH2025-02",
                formulationId: "frm_102",
                producedQty: 950,
                dateProduced: new Date("2025-04-02T11:00:00Z"),
                supervisorId: "usr_001",
            },
        ],

        createdInvoices: [
            {
                id: "inv_301",
                invoiceNumber: "INV-2025-001",
                amount: 32500,
                dateIssued: new Date("2025-04-10T12:00:00Z"),
                createdById: "usr_001",
            },
            {
                id: "inv_302",
                invoiceNumber: "INV-2025-002",
                amount: 28900,
                dateIssued: new Date("2025-05-15T14:30:00Z"),
                createdById: "usr_001",
            },
        ],

        createdDispatches: [
            {
                id: "disp_201",
                dispatchCode: "DSP-2025-001",
                invoiceId: "inv_301",
                destination: "Mumbai Warehouse",
                dispatchedQty: 1200,
                dateDispatched: new Date("2025-04-12T08:00:00Z"),
                createdById: "usr_001",
            },
            {
                id: "disp_202",
                dispatchCode: "DSP-2025-002",
                invoiceId: "inv_302",
                destination: "Pune Warehouse",
                dispatchedQty: 950,
                dateDispatched: new Date("2025-05-18T09:30:00Z"),
                createdById: "usr_001",
            },
        ],

        workerEfficiency: {
            id: "eff_001",
            userId: "usr_001",
            standardOutputQtyPerShift: 1000,
            punctualityScore: 9.4,
            efficiencyRating: 8.8,
            batchHistory: ["batch_501", "batch_502"],
            createdAt: new Date("2025-01-10T10:00:00Z"),
            updatedAt: new Date("2025-11-20T18:00:00Z"),
        },
    });
    const params = useParams();
    const { id } = params;
    const Role = "Admin"; // Example role, replace with actual role from context or props

    useEffect(() => {
        const fetchStaffDetails = async () => {
            try {
                setTimeout(() => {
                    //setData();
                }, 1000);
            } catch (error) {
                console.log("Error fetching staff details:", error);
            }
        }
        fetchStaffDetails();
    }, [])

    if (data === null) {
        return (
            <div className='h-full flex justify-center items-center'>
                <Loader />
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
                            <h1 className='text-sm sm:text-xl font-bold'>Name: Akhilesh Talekar</h1>
                            <br />
                            <h1 className='text-sm sm:text-xl font-bold'>Role: Admin</h1>
                            <br />
                            <h1 className='text-sm sm:text-xl font-bold'>Joining: 26/11/2004</h1>
                            <br />
                            <h1 className='text-sm sm:text-xl font-bold size-'>ID: XXX XXXX 143</h1>
                        </div>
                    </div>
                </div>
                <h1 className='absolute bottom-6 left-[50%] transform -translate-x-1/2 font-bold w-full text-center px-4'>This is a Staff Identification Card Made for UMMS People</h1>
            </div>
            <div className="flex flex-col w-full xl:w-1/2 gap-3">
                <div className={`relative flex justify-center items-center rounded-md p-8 lg:p-2 flex-1  ${userData[Role]?.background} overflow-hidden`}>
                    {createElement(userData[Role]?.icon, { className: `size-56 w-1/2 absolute lg:static top-0 ${userData[Role].iconColor}` })}
                    <h3 className="max-lg:text-center text-lg font-semibold">{userData[Role]?.description}</h3>
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

                        {data.role === "Worker" && (
                            <div className='flex flex-col min-w-[200px] bg-purple-300 rounded-md p-4 text-center justify-center flex-1'>
                                <h1 className='font-bold text-lg'>Standard Output</h1>
                                <h2 className='font-semibold text-3xl mt-2'>{data.workerEfficiency?.standardOutputQtyPerShift ?? 'N/A'}</h2>
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
        </div>

    )
}

export default Details
