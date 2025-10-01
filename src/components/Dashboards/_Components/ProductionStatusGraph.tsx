import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, } from "recharts";

const data = [
    { name: "Quality Check", amt: 2400 },
    { name: "Completed", amt: 2210 },
    { name: "Scheduled", amt: 2290 }
];

const ProductionStatusGraph = () => {
    return (
        <div className="flex flex-col p-4 gap-5 bg-slate-200 dark:bg-gray-700 rounded-md text-black dark:text-white h-[50%]">
            <h2 className="text-lg font-semibold">Production Status</h2>
            <ResponsiveContainer width="100%" height="90%">
                <BarChart data={data}>
                    {/* Grid */}
                    <CartesianGrid strokeDasharray="3 3" />

                    {/* X-Axis: bar names */}
                    <XAxis dataKey="name" />

                    {/* Y-Axis: bar values */}
                    <YAxis label={{ value: "Amount", angle: -90, position: "insideLeft" }} />

                    {/* Tooltip on hover */}
                    <Tooltip />

                    {/* Bars: using amt */}
                    <Bar dataKey="amt" fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ProductionStatusGraph;
