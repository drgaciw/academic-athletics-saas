'use client'

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Button } from '@aah/ui'
import { format } from 'date-fns'

type StudentData = {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  studentProfile: {
    studentId: string
    sport: string
    team?: string | null
    gpa?: number | null
    creditHours?: number | null
    eligibilityStatus?: string | null
    academicStanding?: string | null
    complianceRecords: Array<{
      isEligible: boolean
      cumulativeGpa?: number | null
      creditHours?: number | null
    }>
  } | null
}

const columns: ColumnDef<StudentData>[] = [
  {
    accessorKey: 'lastName',
    header: 'Name',
    cell: ({ row }) => (
      <div>
        {row.original.firstName || ''} {row.original.lastName || ''}
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'studentProfile.studentId',
    header: 'Student ID',
    cell: ({ row }) => row.original.studentProfile?.studentId || 'N/A',
  },
  {
    accessorKey: 'studentProfile.sport',
    header: 'Sport',
    cell: ({ row }) => row.original.studentProfile?.sport || 'N/A',
  },
  {
    accessorKey: 'studentProfile.team',
    header: 'Team',
    cell: ({ row }) => row.original.studentProfile?.team || 'N/A',
  },
  {
    id: 'gpa',
    header: 'GPA',
    cell: ({ row }) => {
      const latestCompliance = row.original.studentProfile?.complianceRecords[0]
      const gpa = latestCompliance?.cumulativeGpa || row.original.studentProfile?.gpa
      return gpa ? gpa.toFixed(2) : 'N/A'
    },
  },
  {
    id: 'credits',
    header: 'Credits',
    cell: ({ row }) => {
      const latestCompliance = row.original.studentProfile?.complianceRecords[0]
      return latestCompliance?.creditHours || row.original.studentProfile?.creditHours || 0
    },
  },
  {
    id: 'eligibility',
    header: 'Eligibility',
    cell: ({ row }) => {
      const latestCompliance = row.original.studentProfile?.complianceRecords[0]
      const isEligible = latestCompliance?.isEligible

      if (isEligible === true) {
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
            Eligible
          </span>
        )
      } else if (isEligible === false) {
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">
            Ineligible
          </span>
        )
      } else {
        return (
          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm font-medium">
            Review
          </span>
        )
      }
    },
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true
      const latestCompliance = row.original.studentProfile?.complianceRecords[0]
      const isEligible = latestCompliance?.isEligible

      if (filterValue === 'ELIGIBLE') return isEligible === true
      if (filterValue === 'INELIGIBLE') return isEligible === false
      if (filterValue === 'REVIEW') return isEligible === null || isEligible === undefined
      return true
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex gap-2">
        <a
          href={`/students/${row.original.id}`}
          className="text-blue-600 hover:underline text-sm"
        >
          View
        </a>
        <a
          href={`/students/${row.original.id}/edit`}
          className="text-blue-600 hover:underline text-sm"
        >
          Edit
        </a>
      </div>
    ),
  },
]

type StudentTableProps = {
  data: StudentData[]
  onExport: (format: 'csv' | 'json') => Promise<void>
  onBulkUpdate?: (studentIds: string[], eligibilityStatus: string) => Promise<void>
}

export function StudentTable({ data, onExport, onBulkUpdate }: StudentTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  })

  const selectedStudentIds = Object.keys(rowSelection).map(
    (index) => data[parseInt(index)].id
  )

  const handleBulkUpdate = async (status: string) => {
    if (onBulkUpdate && selectedStudentIds.length > 0) {
      await onBulkUpdate(selectedStudentIds, status)
      setRowSelection({})
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search Input */}
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search students..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {/* Sport Filter */}
          <select
            value={(table.getColumn('studentProfile.sport')?.getFilterValue() as string) ?? ''}
            onChange={(e) =>
              table.getColumn('studentProfile.sport')?.setFilterValue(e.target.value || undefined)
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sports</option>
            <option value="Basketball">Basketball</option>
            <option value="Football">Football</option>
            <option value="Soccer">Soccer</option>
            <option value="Baseball">Baseball</option>
            <option value="Softball">Softball</option>
            <option value="Track">Track</option>
            <option value="Volleyball">Volleyball</option>
          </select>

          {/* Eligibility Filter */}
          <select
            value={(table.getColumn('eligibility')?.getFilterValue() as string) ?? ''}
            onChange={(e) =>
              table.getColumn('eligibility')?.setFilterValue(e.target.value || undefined)
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="ELIGIBLE">Eligible</option>
            <option value="INELIGIBLE">Ineligible</option>
            <option value="REVIEW">Review</option>
          </select>

          {/* Export Button */}
          <Button
            onClick={() => onExport('csv')}
            variant="outline"
            size="sm"
          >
            Export CSV
          </Button>

          <Button
            onClick={() => onExport('json')}
            variant="outline"
            size="sm"
          >
            Export JSON
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedStudentIds.length > 0 && onBulkUpdate && (
        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <span className="text-sm font-medium text-blue-900">
            {selectedStudentIds.length} student(s) selected
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => handleBulkUpdate('ELIGIBLE')}
              size="sm"
              variant="outline"
            >
              Mark Eligible
            </Button>
            <Button
              onClick={() => handleBulkUpdate('INELIGIBLE')}
              size="sm"
              variant="outline"
            >
              Mark Ineligible
            </Button>
            <Button
              onClick={() => setRowSelection({})}
              size="sm"
              variant="outline"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {onBulkUpdate && (
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={table.getIsAllRowsSelected()}
                        onChange={table.getToggleAllRowsSelectedHandler()}
                        className="cursor-pointer"
                      />
                    </th>
                  )}
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-900"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? 'cursor-pointer select-none flex items-center gap-1'
                              : ''
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {onBulkUpdate && (
                    <td className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                        className="cursor-pointer"
                      />
                    </td>
                  )}
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm text-gray-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          of {table.getFilteredRowModel().rows.length} results
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            size="sm"
            variant="outline"
          >
            Previous
          </Button>
          <Button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            size="sm"
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
