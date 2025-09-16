import { Badge } from '@/components/ui/badge';
import type { LucideIcon } from 'lucide-react';
import React from 'react'

interface CardsProps {
    type: 'primary' | 'secondary';
    title: string;
    metric: number | string;
    icon: LucideIcon;
    change?: number;
}

const Cards = ({ title, metric, icon, change, type }: CardsProps) => {
    if (type === 'primary') {
        return (
            <div className={`flex-1 flex flex-col justify-between gap-3 p-3 bg-slate-200 dark:bg-gray-700 rounded-md text-black dark:text-white min-w-[200px]`}>
                <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-3'>
                        {React.createElement(icon, { className: "size-6" })}
                        <h3 className='text-sm font-medium'>{title}</h3>
                    </div>
                    {change && (
                        <Badge className={`px-2 py-1 ${change > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-xs font-semibold`}>
                            {change > 0 ? `+${change}` : change}
                        </Badge>
                    )}
                </div>
                <div className='text-5xl font-bold text-center'>
                    {`${metric}${title === 'Inventory Turnover' ? '' : '%'}`}
                </div>
            </div>
        )
    }

    return (
        <div className={`flex-1 flex justify-center items-center gap-5 p-3 bg-slate-200 dark:bg-gray-700 rounded-md min-w-[150px]`}>
            {React.createElement(icon, { className: "size-6" })}
            <div className='flex flex-col justify-between'>
                {metric}
                <h3 className='text-sm font-medium'>{title}</h3>
            </div>
        </div>
    )
}

export default Cards
