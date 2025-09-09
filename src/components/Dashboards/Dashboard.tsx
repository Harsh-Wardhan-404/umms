import { useState } from 'react'
import Loader from '../Loader/Loader'

const Dashboard = () => {
    const [role, setRole] = useState("Admin")

    if (!role) {
        return (
            <div className='flex h-full justify-center items-center'>
                <Loader />
            </div>
        )
    }
}

export default Dashboard
