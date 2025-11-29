import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
    { month: "Jan", income: 5000, expense: 3000 }, // Profit
    { month: "Feb", income: 5200, expense: 3500 }, // Profit
    { month: "Mar", income: 4800, expense: 5000 }, // Loss
    { month: "Apr", income: 5300, expense: 4200 }, // Profit
    { month: "May", income: 5500, expense: 3900 }, // Profit
    { month: "Jun", income: 4800, expense: 5100 }, // Loss (Holidays, school break)
    { month: "Jul", income: 4700, expense: 5200 }, // Loss (Summer vacation)
    { month: "Aug", income: 6300, expense: 4700 }, // Profit
    { month: "Sep", income: 5800, expense: 4300 }, // Profit
    { month: "Oct", income: 6200, expense: 4900 }, // Profit
    { month: "Nov", income: 6500, expense: 5200 }, // Profit
    { month: "Dec", income: 5000, expense: 5300 }, // Loss (Holiday season)
];

const ExpenseChart = () => {
    return (
        <div className='flex flex-col p-4 bg-slate-200 dark:bg-gray-700 rounded-md text-black dark:text-white h-[50%]'>
            <h2 className='text-lg font-semibold'>Expense Chart</h2>
            <ResponsiveContainer width="100%" height="90%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} /> {/* Removed vertical grid lines */}
                    <XAxis dataKey="month" tick={{ fill: "#d1d5db" }} tickLine={false} axisLine={false} tickMargin={10} />
                    <YAxis tick={{ fill: "#d1d5db" }} tickLine={false} axisLine={false} tickMargin={10} />
                    <Tooltip />
                    <Legend verticalAlign="top" wrapperStyle={{ paddingTop: "20px", paddingBottom: "20px" }} />

                    {/* Income line (blue) */}
                    <Line type="monotone" dataKey="income" stroke="#8884d8" strokeWidth={3} />

                    {/* Expense line (green) */}
                    <Line type="monotone" dataKey="expense" stroke="#82ca9d" strokeWidth={3} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

export default ExpenseChart
