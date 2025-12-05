import React, { useState } from 'react'
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import InputField from './InputField';
import api from '@/lib/api';

// Create schema (password required)
const CreateUserSchema = z.object({
    username: z.string().min(2, { message: "Username must be at least 2 characters long" }),
    email: z.string().email({ message: "Invalid email address" }),
    role: z.enum(["Admin", "ProductionManager", "InventoryManager", "Supervisor", "Staff"]),
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
});

// Update schema (password optional)
const UpdateUserSchema = z.object({
    username: z.string().min(2, { message: "Username must be at least 2 characters long" }),
    email: z.string().email({ message: "Invalid email address" }),
    role: z.enum(["Admin", "ProductionManager", "InventoryManager", "Supervisor", "Staff"]),
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    password: z.string().optional().or(z.literal("")).refine(
        (val) => !val || val.length >= 6,
        { message: "Password must be at least 6 characters long if provided" }
    ),
});

export type userSchema = z.infer<typeof CreateUserSchema>;

const UserForm = ({
    type,
    data,
    setOpen,
    relatedData,
}: {
    type: "create" | "update";
    data?: any;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    relatedData?: any;
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
    const [usernameError, setUsernameError] = useState<string | null>(null);
    
    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm({
        resolver: zodResolver(type === "create" ? CreateUserSchema : UpdateUserSchema) as any,
        defaultValues: {
            username: data?.username || "",
            email: data?.email || "",
            firstName: data?.firstName || "",
            lastName: data?.lastName || "",
            role: data?.role || "Staff",
        },
    });

    // Watch username field for real-time validation
    const username = watch("username");

    // Check username availability
    const checkUsernameAvailability = async (username: string) => {
        if (!username || username.length < 2) {
            setUsernameError(null);
            return;
        }

        // Don't check if updating and username hasn't changed
        if (type === "update" && username === data?.username) {
            setUsernameError(null);
            return;
        }

        try {
            setUsernameCheckLoading(true);
            setUsernameError(null);
            
            // Check if username exists by trying to fetch users with that username
            const response = await api.get(`/api/users?search=${encodeURIComponent(username)}&limit=1`);
            const users = response.data.users || [];
            
            // Check if any user has this exact username
            const usernameExists = users.some((user: any) => 
                user.username.toLowerCase() === username.toLowerCase() && 
                user.id !== data?.id
            );
            
            if (usernameExists) {
                setUsernameError("This username is already taken");
            }
        } catch (error) {
            console.error("Error checking username:", error);
        } finally {
            setUsernameCheckLoading(false);
        }
    };

    // Debounce username check
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (username) {
                checkUsernameAvailability(username);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [username]);

    const onSubmit = handleSubmit(async (dataFromForm) => {
        // Check if username is taken before submitting
        if (usernameError) {
            setApiError(usernameError);
            return;
        }

        try {
            setIsSubmitting(true);
            setApiError(null);

            if (type === "create") {
                // Create new user
                const response = await api.post("/api/users", dataFromForm);
                console.log("User created:", response.data);
            } else {
                // Update existing user
                const updateData: any = {
                    username: dataFromForm.username,
                    email: dataFromForm.email,
                    firstName: dataFromForm.firstName,
                    lastName: dataFromForm.lastName,
                    role: dataFromForm.role,
                };
                
                // Only include password if it's provided
                const formData = dataFromForm as any;
                if (formData.password) {
                    updateData.password = formData.password;
                }
                
                const response = await api.put(`/api/users/${data?.id}`, updateData);
                console.log("User updated:", response.data);
            }

            setOpen(false);
            // Reload the page to refresh the user list
            window.location.reload();
        }
        catch (err: any) {
            console.error("API Error:", err);
            setApiError(err.response?.data?.error || "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    });

    return (
        <form className="flex flex-col gap-8" onSubmit={onSubmit}>
            <h1>{type === "create"
                ? "Register a new User"
                : "Update an existing User"}
            </h1>

            {apiError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {apiError}
                </div>
            )}

            <div className="flex justify-between flex-wrap gap-4">
                <div className="flex flex-col gap-2 w-full md:w-[30%]">
                    <InputField
                        label="Username"
                        register={register}
                        name="username"
                        defaultValue={data?.username}
                        err={errors.username as any}
                    />
                    {usernameCheckLoading && (
                        <p className="text-xs text-blue-500">Checking availability...</p>
                    )}
                    {usernameError && !usernameCheckLoading && (
                        <p className="text-xs text-red-500">{usernameError}</p>
                    )}
                    {!usernameError && !usernameCheckLoading && username && username.length >= 2 && type === "create" && (
                        <p className="text-xs text-green-500">Username is available</p>
                    )}
                </div>
                <InputField
                    label="email"
                    register={register}
                    name="email"
                    defaultValue={data?.email}
                        err={errors.email as any}
                />
                <div className="flex flex-col gap-2 w-full md:w-[30%]">
                    <InputField
                        label={type === "update" ? "Password (leave blank to keep current)" : "Password"}
                        register={register}
                        name="password"
                        err={(errors as any).password}
                        type="password"
                    />
                    {type === "create" && (
                        <p className="text-xs text-gray-500">Minimum 6 characters required</p>
                    )}
                    {type === "update" && (
                        <p className="text-xs text-gray-500">Minimum 6 characters if changing</p>
                    )}
                </div>
            </div>
            <div className='flex justify-between gap-3'>
                <div className='flex flex-col flex-1'>
                    <label htmlFor="firstName" className='text-xs text-gray-400'>First Name</label>
                    <input {...register('firstName')} className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" />
                    {errors.firstName?.message && <p className='text-red-500'>{String(errors.firstName?.message)}</p>}
                </div>

                <div className='flex flex-col flex-1'>
                    <label htmlFor="lastName" className='text-xs text-gray-400'>Last Name</label>
                    <input {...register('lastName')} className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" />
                    {errors.lastName?.message && <p className='text-red-500'>{String(errors.lastName?.message)}</p>}
                </div>
            </div>
            <div className="flex flex-col gap-2 w-full md:w-1/4">
                <label className="text-xs text-gray-400">Role</label>
                <select
                    className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                    {...register("role")}
                    defaultValue={data?.role}
                >
                    <option value="Admin">Admin</option>
                    <option value="ProductionManager">Production Manager</option>
                    <option value="InventoryManager">Inventory Manager</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Staff">Staff</option>
                </select>
                {errors.role?.message && (
                    <p className="text-xs text-red-500">
                        {errors.role?.message.toString()}
                    </p>
                )}
            </div>
            <button 
                type="submit"
                disabled={isSubmitting || usernameCheckLoading || !!usernameError}
                className="bg-blue-500 text-white rounded-md p-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
                {isSubmitting ? "Processing..." : (type === "create" ? "Register" : "Update")}
            </button>
        </form>
    )
}

export default UserForm
