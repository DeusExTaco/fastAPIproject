// components/EmptyTableRows.tsx
import React from 'react';

interface EmptyTableRowsProps {
    startIndex: number;
    count: number;
    columnsCount: number;
}

const EmptyTableRows: React.FC<EmptyTableRowsProps> = ({ startIndex, count, columnsCount }) => {
    return (
        <>
            {Array(count).fill(null).map((_, index) => {
                const rowNum = startIndex + index;
                return (
                    <tr
                        key={`empty-row-${rowNum}`}
                        className={`${rowNum % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}
                    >
                        {Array(columnsCount).fill(null).map((_, colIndex) => (
                            <td
                                key={`empty-cell-${rowNum}-${colIndex}`}
                                className="p-4 border-b border-gray-200"
                            >
                                <div className="h-8"></div>
                            </td>
                        ))}
                    </tr>
                );
            })}
        </>
    );
};

export default EmptyTableRows;