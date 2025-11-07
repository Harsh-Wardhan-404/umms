import { cn } from "@/lib/utils";
import { Box, ChartBar, CheckCircle, ClipboardList, Cog, Factory, LayoutDashboard, Package, ShoppingCart, User, Users, type LucideIcon } from "lucide-react";
import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { HomeContext } from "../HomeContext";

export type Role = string | null;

export type MenuOption = {
    name: string;
    href: string;
    icon: LucideIcon;
}

export interface MenuSection {
    name: string;
    options: MenuOption[];
    access: Role[];
}

const menuItems: MenuSection[] = [
    {
        name: "Overview",
        options: [
            { name: "Dashboard", href: "/", icon: LayoutDashboard },
        ],
        access: ["Admin", "Production Manager", "Inventory Manager", "Supervisor", "Staff", "Client"]
    },
    {
        name: "Inventory & Management",
        options: [
            { name: "Inventory", href: "/inventory/inventory", icon: Box },
            { name: "Suppliers", href: "/inventory/suppliers", icon: Package },
        ],
        access: ["Admin", "Inventory Manager"]
    },
    {
        name: "Production",
        options: [
            { name: "Formulations & R&D", href: "/production/formulations-and-rd", icon: Factory },
            { name: "Batch Production", href: "/production/batch-production", icon: ClipboardList },
            { name: "Quality Control", href: "/production/quality-control", icon: CheckCircle },
        ],
        access: ["Admin", "Production Manager"]
    },
    {
        name: "Business Operations",
        options: [
            { name: "Order Management", href: "/business-operations/order-management", icon: ShoppingCart },
            { name: "Financial Management", href: "/business-operations/financial-management", icon: Users },
            { name: "Client Management", href: "/business-operations/client-management", icon: User },
        ],
        access: ["Admin"]
    },
    {
        name: "Administration",
        options: [
            { name: "Staff Performance", href: "/administration/staff-performance", icon: Users },
            { name: "Analytics & Reports", href: "/administration/analytics-and-reports", icon: ChartBar },
            { name: "User Management", href: "/administration/settings", icon: Cog },
        ],
        access: ["Admin", "Inventory Manager"]
    }
]

const DesktopNavBar = () => {
    const pathName = useLocation().pathname;
    const { Role } = useContext(HomeContext);

    return (
        <div className="hidden md:block md:w-[225px] xl:w-[250px] p-5 bg-slate-200 dark:bg-gray-700 h-full overflow-y-auto">
            <h2 className="text-lg font-semibold mb-1">Menu</h2>
            <div className="w-full h-[2px] bg-gray-300 dark:bg-gray-600 mb-4" />
            <div className="flex flex-col gap-5">
                {menuItems.map((section) => {
                    if (section.access.includes(Role)) return (
                        <div key={section.name} className="flex flex-col">
                            <h3 className="text-md font-semibold mb-2">{section.name}</h3>
                            <div className="flex flex-col gap-3">
                                {section.options.map((option) => {
                                    const isActive = pathName === option.href;
                                    return (
                                        <Link key={option.name} to={option.href}>
                                            <div key={option.name} className={cn("relative flex items-center p-2 rounded-md w-full hover:bg-slate-300 dark:hover:bg-gray-600", { "bg-slate-300 dark:bg-gray-600": isActive })}>
                                                {React.createElement(option.icon, { className: "size-5 mr-3" })}
                                                <span className="text-sm">{option.name}</span>
                                                <div className="absolute inset-0 rounded-md ring-1 ring-transparent group-hover:ring-gray-300 dark:group-hover:ring-gray-600" />
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export default DesktopNavBar
