import { BackgroundGradient } from "@/components/ui/background-gradient"
import { useState } from "react";

const AuthForm = () => {
    const [userData, setUserData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Handle form submission
    };

    return (
        <div className="flex justify-center items-center p-12 h-screen bg-slate-200 dark:bg-[#282C35]">
            <BackgroundGradient containerClassName="w-[95%] md:w-[60%] lg:w-[50%] xl:w-[30%] rounded" className="p-5 w-full rounded-3xl bg-white dark:bg-[#1A1C22]">
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <h1 className="text-2xl font-bold text-center">Sign In</h1>
                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold">Email Address</p>
                        <input type="email" name="email" value={userData.email} onChange={handleChange} placeholder="Email" className="p-2 border border-gray-300 rounded placeholder:font-semibold" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold">Password</p>
                        <div className="relative w-full">
                            <input type={showPassword ? "text" : "password"} name="password" value={userData.password} onChange={handleChange} placeholder="Password" className="p-2 border border-gray-300 rounded w-full placeholder:font-semibold" />
                            <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer">
                                {showPassword ? <i className="fa-solid fa-eye-slash"></i> : <i className="fa-solid fa-eye"></i>}
                            </button>
                        </div>
                    </div>

                    <button className="p-[3px] relative w-[50%] cursor-pointer mx-auto mt-5">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg" />
                        <div className="px-8 py-2  bg-black rounded-[6px]  relative group transition duration-200 text-white hover:bg-transparent">
                            Submit
                        </div>
                    </button>
                </form>
            </BackgroundGradient>
        </div>
    )
}

export default AuthForm
