declare type column = {
  header: string;
  accessor: string;
  className?: string;
};

declare interface TableProps {
  columns: column[];
  renderRow: (item: any) => React.ReactNode;
  data: any[];
}

const Table = ({columns, renderRow, data}: TableProps) => {
    return (
        <table className="w-full mt-4">
            <thead>
                <tr className="text-left text-gray-500">
                    {columns.map((column) => (
                        <th key={column.accessor} className={column.className}>{column.header}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((item) => renderRow(item))}
            </tbody>
        </table>
    )
}

export default Table
