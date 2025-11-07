import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const categoryBadgeStyles = {
  Raw: "border-1 border-blue-800 bg-blue-100 text-blue-800",
  Consumable: "border-1 border-green-800 bg-green-100 text-green-800",
  Packaging: "border-1 border-yellow-800 bg-yellow-100 text-yellow-800",
};
