import { useState } from 'react'
import Loader from '../Loader/Loader'
import AdminDashboard from './Admin/AdminDashboard'

const Dashboard = () => {
    const [role, setRole] = useState("Admin")

    if (!role) {
        return (
            <div className='flex h-full justify-center items-center'>
                <Loader />
            </div>
        )
    }

    switch (role) {
        case "Admin":
            return <AdminDashboard />
        case "User":
            return <div>User Dashboard</div>
        default:
            return <div>Unknown Role</div>
    }
}

export default Dashboard
