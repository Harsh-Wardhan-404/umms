import React from 'react'
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod'; // or 'zod/v4'
import InputField from './InputField';

const UserSchema = z.object({
    userName: z.string().min(2, { message: "Name must be at least 2 characters long" }),
    email: z.string().email({ message: "Invalid email address" }),
    role: z.enum(["Admin", "ProductionManager", "InventoryManager", "Supervisor", "Staff", "Client"]),
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters long" }).optional().or(z.literal("")),
});

export type userSchema = z.infer<typeof UserSchema>;

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
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<userSchema>({
        resolver: zodResolver(UserSchema),
    });

    const { relatedField } = relatedData || {}; // Example of using relatedData if needed

    const onSubmit = handleSubmit(async (dataFromForm) => {
        try {
            console.log("Form Data:", dataFromForm);
            // Cursor simulate API call here
            setOpen(false);
        }
        catch (err) {
            console.error(err);
        }
    });

    return (
        <form className="flex flex-col gap-8" onSubmit={onSubmit}>
            <h1>{type === "create"
                ? "Register a new User"
                : "Update an existing User"}
            </h1>

            <div className="flex justify-between flex-wrap gap-4">
                <InputField
                    label="Username"
                    register={register}
                    name="userName"
                    defaultValue={data?.userName}
                    err={errors.userName}
                />
                <InputField
                    label="email"
                    register={register}
                    name="email"
                    defaultValue={data?.email}
                    err={errors.email}
                />
                <InputField
                    label="Password"
                    register={register}
                    name="password"
                    err={errors.password}
                    type="password"
                />
            </div>
            <div className='flex justify-between gap-3'>
                <div className='flex flex-col flex-1'>
                    <label htmlFor="firstName" className='text-xs text-gray-400'>First Name</label>
                    <input {...register('firstName')} className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" />
                    {errors.firstName?.message && <p className='text-red-500'>{errors.firstName?.message}</p>}
                </div>

                <div className='flex flex-col flex-1'>
                    <label htmlFor="lastName" className='text-xs text-gray-400'>Last Name</label>
                    <input {...register('lastName')} className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" />
                    {errors.lastName?.message && <p className='text-red-500'>{errors.lastName?.message}</p>}
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
            <button className="bg-blue-500 text-white rounded-md p-2">
                {type == "create" ? "Register" : "Update"}
            </button>
        </form>
    )
}

export default UserForm
