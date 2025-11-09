'use client';

import { useState } from 'react';
import { DataTable, Badge, Avatar, Button, SearchInput } from '@aah/ui';
import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye } from 'lucide-react';
import Link from 'next/link';

interface Student {
  id: string;
  name: string;
  sport: string;
  year: string;
  gpa: number;
  credits: number;
  eligibilityStatus: 'eligible' | 'at-risk' | 'ineligible' | 'pending-review';
  imageUrl?: string;
}

// Mock data - will be replaced with actual API call
const mockStudents: Student[] = [
  {
    id: '1',
    name: 'John Smith',
    sport: 'Basketball',
    year: 'Junior',
    gpa: 3.45,
    credits: 90,
    eligibilityStatus: 'eligible',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    sport: 'Soccer',
    year: 'Sophomore',
    gpa: 2.85,
    credits: 60,
    eligibilityStatus: 'at-risk',
  },
  {
    id: '3',
    name: 'Michael Davis',
    sport: 'Football',
    year: 'Senior',
    gpa: 3.72,
    credits: 110,
    eligibilityStatus: 'eligible',
  },
  {
    id: '4',
    name: 'Emily Brown',
    sport: 'Track & Field',
    year: 'Freshman',
    gpa: 1.95,
    credits: 28,
    eligibilityStatus: 'ineligible',
  },
  {
    id: '5',
    name: 'David Wilson',
    sport: 'Baseball',
    year: 'Junior',
    gpa: 3.12,
    credits: 85,
    eligibilityStatus: 'pending-review',
  },
];

const columns: ColumnDef<Student>[] = [
  {
    accessorKey: 'name',
    header: 'Student',
    cell: ({ row }: { row: any }) => {
      const student = row.original as Student;
      return (
        <div className="flex items-center gap-3">
          <Avatar
            src={student.imageUrl}
            alt={student.name}
            fallback={student.name
              .split(' ')
              .map((n: string) => n[0])
              .join('')}
          />
          <div>
            <div className="font-medium">{student.name}</div>
            <div className="text-sm text-muted-foreground">{student.sport}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'year',
    header: 'Year',
  },
  {
    accessorKey: 'gpa',
    header: 'GPA',
    cell: ({ row }: { row: any }) => {
      const gpa = row.getValue('gpa') as number;
      return <span className="font-medium">{gpa.toFixed(2)}</span>;
    },
  },
  {
    accessorKey: 'credits',
    header: 'Credits',
  },
  {
    accessorKey: 'eligibilityStatus',
    header: 'Status',
    cell: ({ row }: { row: any }) => {
      const status = row.getValue('eligibilityStatus') as Student['eligibilityStatus'];
      return <Badge variant={status}>{status.replace('-', ' ')}</Badge>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }: { row: any }) => {
      const student = row.original as Student;
      return (
        <div className="flex items-center gap-2">
          <Link href={`/admin/students/${student.id}`}>
            <Button variant="ghost" size="icon">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = mockStudents.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.sport.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
        <p className="text-muted-foreground">
          Manage and monitor student-athlete academic performance
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <SearchInput
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          className="max-w-sm"
        />
        <Button variant="outline">Filters</Button>
        <Button variant="outline">Export</Button>
      </div>

      {/* Students Table */}
      <DataTable
        columns={columns}
        data={filteredStudents}
        paginated
        pageSize={10}
      />
    </div>
  );
}