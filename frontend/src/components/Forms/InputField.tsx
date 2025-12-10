import React from "react";
import type { FieldError } from "react-hook-form";

declare interface InputFieldProps {
    label: string;
    type?: string;
    register: any;
    name: string;
    defaultValue?: any;
    err?: FieldError;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    containerClassName?: string;
}

const InputField = ({
    label,
    type = "text",
    register,
    name,
    defaultValue,
    err,
    inputProps,
    containerClassName,
}: InputFieldProps) => {
    return (
        <div className={`flex flex-col gap-2 ${containerClassName || "w-full"}`}>
            <label className="text-xs text-gray-400">{label}</label>
            <input
                type={type}
                {...register(name)}
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...inputProps}
                defaultValue={defaultValue}
            />
            {err?.message && (
                <p className="text-xs text-red-500">
                    {err?.message.toString()}
                </p>
            )}
        </div>
    );
};

export default InputField;
