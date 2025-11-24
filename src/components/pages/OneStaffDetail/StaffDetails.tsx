import { HomeContext } from '@/components/HomeContext';
import Loader from '@/components/Loader/Loader';
import { Award, Box, CircleDollarSign, Search, ShoppingCart } from 'lucide-react';
import { createElement, useContext, useEffect, useState } from 'react'
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
    const [data, setData] = useState<null | boolean>(null);
    const params = useParams();
    const { id } = params;
    const Role = "Worker"; // Example role, replace with actual role from context or props

    useEffect(() => {
        const fetchStaffDetails = async () => {
            try {
                setTimeout(() => {
                    setData(true);
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
        <div className="flex flex-col lg:flex-row w-full gap-3">
            <div className="relative flex-col w-full lg:w-1/2 h-[350px] sm:h-[500px]">
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
            <div className="flex flex-col w-full h-[350px] sm:h-[500px] lg:w-1/2">
                <div className={`relative flex justify-center items-center rounded-md p-8 lg:p-2 h-[50%]  ${userData[Role]?.background} overflow-hidden`}>
                    {createElement(userData[Role]?.icon, { className: `size-56 w-1/2 absolute lg:static top-0 ${userData[Role].iconColor}` })}
                    <h3 className="max-lg:text-center text-lg font-semibold">{userData[Role]?.description}</h3>
                </div>
            </div>
        </div>

    )
}

export default Details
