'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, DataTable, Avatar } from '@aah/ui';
import { type ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Users, TrendingUp, Award } from 'lucide-react';
import Link from 'next/link';

interface StudentAthleteRow {
  id: string;
  studentId: string;
  name: string;
  sport: string;
  team?: string;
  year?: string;
  gpa?: number;
  creditHours: number;
  eligibilityStatus: string;
  academicStanding?: string;
  alertCount: number;
}

interface DashboardData {
  totalStudents: number;
  eligibleCount: number;
  atRiskCount: number;
  ineligibleCount: number;
  averageGpa: number;
  eligibilityRate: number;
  activeAlerts: number;
  criticalAlerts: number;
  students: StudentAthleteRow[];
}

// Mock data - will be replaced with actual API call
const mockData: DashboardData = {
  totalStudents: 45,
  eligibleCount: 38,
  atRiskCount: 5,
  ineligibleCount: 2,
  averageGpa: 3.15,
  eligibilityRate: 84.4,
  activeAlerts: 8,
  criticalAlerts: 2,
  students: [
    {
      id: '1',
      studentId: 'SA001',
      name: 'John Smith',
      sport: 'Basketball',
      team: 'Men\'s Varsity',
      year: 'Junior',
      gpa: 2.45,
      creditHours: 90,
      eligibilityStatus: 'at-risk',
      academicStanding: 'GOOD_STANDING',
      alertCount: 2,
    },
    {
      id: '2',
      studentId: 'SA002',
      name: 'Sarah Johnson',
      sport: 'Basketball',
      team: 'Women\'s Varsity',
      year: 'Sophomore',
      gpa: 3.85,
      creditHours: 60,
      eligibilityStatus: 'eligible',
      academicStanding: 'GOOD_STANDING',
      alertCount: 0,
    },
    {
      id: '3',
      studentId: 'SA003',
      name: 'Michael Davis',
      sport: 'Basketball',
      team: 'Men\'s Varsity',
      year: 'Senior',
      gpa: 1.95,
      creditHours: 110,
      eligibilityStatus: 'ineligible',
      academicStanding: 'PROBATION',
      alertCount: 3,
    },
  ],
};

const columns: ColumnDef<StudentAthleteRow>[] = [
  {
    accessorKey: 'name',
    header: 'Student',
    cell: ({ row }: { row: any }) => {
      const student = row.original as StudentAthleteRow;
      return (
        <div className="flex items-center gap-3">
          <Avatar
            alt={student.name}
            fallback={student.name
              .split(' ')
              .map((n: string) => n[0])
              .join('')}
          />
          <div>
            <div className="font-medium">{student.name}</div>
            <div className="text-sm text-muted-foreground">{student.team || student.sport}</div>
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
      const color = gpa >= 3.0 ? 'text-green-600' : gpa >= 2.0 ? 'text-orange-600' : 'text-red-600';
      return <span className={`font-medium ${color}`}>{gpa?.toFixed(2) || 'N/A'}</span>;
    },
  },
  {
    accessorKey: 'creditHours',
    header: 'Credits',
  },
  {
    accessorKey: 'eligibilityStatus',
    header: 'Status',
    cell: ({ row }: { row: any }) => {
      const status = row.getValue('eligibilityStatus') as string;
      const variant = status === 'eligible' ? 'default' : status === 'at-risk' ? 'warning' : 'destructive';
      return <Badge variant={variant as any}>{status.replace('-', ' ')}</Badge>;
    },
  },
  {
    accessorKey: 'alertCount',
    header: 'Alerts',
    cell: ({ row }: { row: any }) => {
      const count = row.getValue('alertCount') as number;
      if (count === 0) return <span className="text-muted-foreground">—</span>;
      return (
        <Badge variant={count >= 3 ? 'destructive' : 'warning'}>
          {count}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }: { row: any }) => {
      const student = row.original as StudentAthleteRow;
      return (
        <Link href={`/coach/students/${student.studentId}`}>
          <Button variant="outline" size="sm">View Details</Button>
        </Link>
      );
    },
  },
];

export default function CoachDashboardPage() {
  const [data, setData] = useState<DashboardData>(mockData);
  const [loading, setLoading] = useState(false);

  // TODO: Replace with actual API call
  useEffect(() => {
    // Simulating API call
    setLoading(true);
    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coach Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your student-athletes' academic performance and compliance
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Athletes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {data.eligibleCount} eligible
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eligibility Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.eligibilityRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              NCAA compliance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team GPA</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageGpa.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Average across all athletes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {data.criticalAlerts} critical
            </p>
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Students */}
      {data.atRiskCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              At-Risk Student Athletes
            </CardTitle>
            <CardDescription>
              {data.atRiskCount} students require attention for academic compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              Review student progress and consider intervention plans for at-risk athletes.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Athletes Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Student Athletes</CardTitle>
          <CardDescription>
            Monitor academic performance and eligibility status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data.students}
            paginated
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}
