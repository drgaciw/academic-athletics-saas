import { Card, CardHeader, CardTitle, CardContent, Badge, Avatar, ProgressIndicator } from '@aah/ui';
import { ArrowLeft, Mail, Phone, Calendar } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: {
    id: string;
  };
}

// Mock data - will be replaced with actual API call
const mockStudent = {
  id: '1',
  name: 'John Smith',
  email: 'john.smith@university.edu',
  phone: '(555) 123-4567',
  sport: 'Basketball',
  year: 'Junior',
  major: 'Business Administration',
  gpa: 3.45,
  credits: 90,
  totalCredits: 120,
  eligibilityStatus: 'eligible' as const,
  enrollmentDate: '2022-08-15',
};

export default function StudentDetailPage({ params }: PageProps) {
  const student = mockStudent; // In real app, fetch by params.id

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </Link>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar
              src={undefined}
              alt={student.name}
              fallback={student.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
              className="h-24 w-24"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{student.name}</h1>
                  <p className="text-muted-foreground">
                    {student.year} • {student.sport}
                  </p>
                </div>
                <Badge variant={student.eligibilityStatus}>
                  {student.eligibilityStatus}
                </Badge>
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{student.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{student.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Enrolled since {new Date(student.enrollmentDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>GPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{student.gpa.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">out of 4.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credits Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{student.credits}</div>
            <p className="text-sm text-muted-foreground mb-2">
              of {student.totalCredits} required
            </p>
            <ProgressIndicator
              value={student.credits}
              max={student.totalCredits}
              variant="linear"
              size="sm"
              color="primary"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Major</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{student.major}</div>
            <p className="text-sm text-muted-foreground">
              {Math.round((student.credits / student.totalCredits) * 100)}% complete
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Student Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Detailed tabs for Profile, Academics, Compliance, Performance, Schedule, and Support will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}