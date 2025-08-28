import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", darkMode);
    }, [darkMode]);

    return (
        <button
            onClick={() => setDarkMode(d => !d)}
            className="flex justify-center items-center px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-black dark:text-white transition-colors duration-300"
            aria-label="Toggle theme"
        >
            <span className="relative inline-block w-5 h-5">
                <i
                    className={`fa-solid fa-sun absolute inset-0 transition-all duration-300 ease-out
                        ${darkMode ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"}`}
                />
                <i
                    className={`fa-solid fa-moon absolute inset-0 transition-all duration-300 ease-out
                        ${darkMode ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"}`}
                />
            </span>
        </button>
    );
}
