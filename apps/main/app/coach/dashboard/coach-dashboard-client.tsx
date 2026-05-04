'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  DataTable,
  Avatar,
} from '@aah/ui';
import { type ColumnDef } from '@tanstack/react-table';
import {
  AlertTriangle,
  Users,
  TrendingUp,
  Award,
  Scale,
} from 'lucide-react';
import Link from 'next/link';

export interface RegulationDigestItem {
  id: string;
  title: string | null;
  summary: string;
  detectedAt: string;
  severity: string;
  sourceType: string;
}

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
      team: "Men's Varsity",
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
      team: "Women's Varsity",
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
      team: "Men's Varsity",
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
    cell: ({ row }: { row: { original: StudentAthleteRow } }) => {
      const student = row.original;
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
            <div className="text-sm text-muted-foreground">
              {student.team || student.sport}
            </div>
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
    cell: ({ row }: { row: { getValue: (k: string) => unknown } }) => {
      const raw = row.getValue('gpa');
      const gpa =
        typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined;
      if (gpa === undefined) {
        return (
          <span className="font-medium text-muted-foreground">N/A</span>
        );
      }
      const color =
        gpa >= 3.0 ? 'text-green-600' : gpa >= 2.0 ? 'text-orange-600' : 'text-red-600';
      return (
        <span className={`font-medium ${color}`}>{gpa.toFixed(2)}</span>
      );
    },
  },
  {
    accessorKey: 'creditHours',
    header: 'Credits',
  },
  {
    accessorKey: 'eligibilityStatus',
    header: 'Status',
    cell: ({ row }: { row: { getValue: (k: string) => unknown } }) => {
      const status = row.getValue('eligibilityStatus') as string;
      const variant =
        status === 'eligible'
          ? 'default'
          : status === 'at-risk'
            ? 'warning'
            : 'destructive';
      return (
        <Badge variant={variant as 'default' | 'warning' | 'destructive'}>
          {status.replace('-', ' ')}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'alertCount',
    header: 'Alerts',
    cell: ({ row }: { row: { getValue: (k: string) => unknown } }) => {
      const count = row.getValue('alertCount') as number;
      if (count === 0) return <span className="text-muted-foreground">—</span>;
      return (
        <Badge variant={count >= 3 ? 'destructive' : 'warning'}>{count}</Badge>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }: { row: { original: StudentAthleteRow } }) => {
      const student = row.original;
      return (
        <Link href={`/coach/students/${student.studentId}`}>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </Link>
      );
    },
  },
];

export function CoachDashboardClient({
  regulationDigest = [],
}: {
  regulationDigest?: RegulationDigestItem[];
}) {
  const [data, setData] = useState<DashboardData>(mockData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coach Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your student-athletes&apos; academic performance and compliance
        </p>
      </div>

      {regulationDigest.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Scale className="h-5 w-5 text-blue-700" />
                Regulation updates (digest)
              </CardTitle>
              <CardDescription>
                NCAA, conference, and state governance feeds reviewed by compliance — coach-ready
                highlights only.
              </CardDescription>
            </div>
            <Link href="/coach/updates">
              <Button variant="outline" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {regulationDigest.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-1 rounded-md border border-blue-100 bg-white/80 p-3 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{item.sourceType}</Badge>
                  <Badge variant="secondary">{item.severity}</Badge>
                  <span className="text-muted-foreground">
                    {new Date(item.detectedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="font-medium text-foreground">
                  {item.title ?? 'Regulation feed update'}
                </p>
                <p className="line-clamp-2 text-muted-foreground">{item.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Athletes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalStudents}</div>
            <p className="text-xs text-muted-foreground">{data.eligibleCount} eligible</p>
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
            <p className="text-xs text-muted-foreground">NCAA compliance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team GPA</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageGpa.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Average across all athletes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">{data.criticalAlerts} critical</p>
          </CardContent>
        </Card>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>My Student Athletes</CardTitle>
          <CardDescription>
            Monitor academic performance and eligibility status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading roster…</p>
          ) : (
            <DataTable columns={columns} data={data.students} paginated pageSize={10} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
