import SignUp from "./_components/SignUp"
import ThemeToggle from "../ThemeToggle"

const Auth = () => {
    return (
        <div className="flex flex-col h-screen">
            <div className="flex justify-between items-center dark:bg-[#1A1C22] h-14 p-3">
                <h1 className="text-lg font-bold">UMMS</h1>
                <ThemeToggle />
            </div>
            <SignUp />
        </div>
    )
}

export default Auth
