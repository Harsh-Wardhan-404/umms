import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const data = [
    { month: "Jan", score: 78 },
    { month: "Feb", score: 85 },
    { month: "Mar", score: 90 },
    { month: "Apr", score: 88 },
    { month: "May", score: 92 },
    { month: "Jun", score: 95 },
    { month: "Jul", score: 94 },
    { month: "Aug", score: 96 },
]

const QualityMetricsGraph = () => {
    return (
        <div className="flex flex-col p-4 bg-slate-200 dark:bg-gray-700 rounded-md text-black dark:text-white h-[50%]">
            <h2 className="text-lg font-semibold">Quality Metrics Graph</h2>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />

                    {/* X axis shows months */}
                    <XAxis dataKey="month" />

                    {/* Y axis shows scores */}
                    <YAxis label={{ value: "Score", angle: -90, position: "insideLeft" }} />

                    <Tooltip />

                    {/* Area chart uses score */}
                    <Area type="monotone" dataKey="score" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

export default QualityMetricsGraph
