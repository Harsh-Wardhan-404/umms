import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const data = [
    { name: 'Ayurveda', value: 70 },
    { name: 'Alopethy', value: 12 },
    { name: 'Generic', value: 15 },
    { name: 'Cosmetic', value: 3 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const InventoryLevelCategoryGraph = () => {
    return (
        <div className='flex flex-col p-4 bg-slate-200 dark:bg-gray-700 rounded-md text-black dark:text-white h-[50%]'>
            <h2 className='text-lg font-semibold'>Inventory Level by Category Graph</h2>
            <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}

export default InventoryLevelCategoryGraph
