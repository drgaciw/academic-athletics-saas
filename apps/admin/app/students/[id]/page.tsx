import { auth as clerkAuth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@aah/ui';
import { getStudent, deleteStudent } from '../actions';
import { DeleteStudentButton } from '../../../components/students/DeleteStudentButton';
import { format } from 'date-fns';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StudentDetailPage({ params }: Props) {
  const { userId } = await clerkAuth();

  if (!userId) {
    redirect('/sign-in');
  }

  const { id } = await params;

  try {
    const student = await getStudent(id);

    if (!student) {
      notFound();
    }

    const latestCompliance = student.studentProfile?.complianceRecords[0];

    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-gray-600 mt-1">{student.email}</p>
          </div>
          <div className="flex gap-2">
            <a href={`/students/${student.id}/edit`}>
              <Button variant="outline">Edit Profile</Button>
            </a>
            <DeleteStudentButton studentId={student.id} />
            <a href="/students">
              <Button variant="outline">Back to List</Button>
            </a>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Student ID</p>
                <p className="font-semibold">{student.studentProfile?.studentId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sport</p>
                <p className="font-semibold">{student.studentProfile?.sport || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Team</p>
                <p className="font-semibold">{student.studentProfile?.team || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Cumulative GPA</p>
                <p className="font-semibold text-2xl">
                  {latestCompliance?.cumulativeGpa?.toFixed(2) ||
                    student.studentProfile?.gpa?.toFixed(2) ||
                    'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Credit Hours</p>
                <p className="font-semibold">
                  {latestCompliance?.creditHours || student.studentProfile?.creditHours || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Major</p>
                <p className="font-semibold">{student.studentProfile?.major || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Minor</p>
                <p className="font-semibold">{student.studentProfile?.minor || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Eligibility Status */}
          <Card>
            <CardHeader>
              <CardTitle>Eligibility Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Current Status</p>
                {latestCompliance?.isEligible === true ? (
                  <span className="inline-block px-3 py-2 bg-green-100 text-green-800 rounded-md font-semibold">
                    Eligible
                  </span>
                ) : latestCompliance?.isEligible === false ? (
                  <span className="inline-block px-3 py-2 bg-red-100 text-red-800 rounded-md font-semibold">
                    Ineligible
                  </span>
                ) : (
                  <span className="inline-block px-3 py-2 bg-orange-100 text-orange-800 rounded-md font-semibold">
                    Under Review
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Academic Standing</p>
                <p className="font-semibold">
                  {student.studentProfile?.academicStanding || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Enrollment Status</p>
                <p className="font-semibold">
                  {student.studentProfile?.enrollmentStatus || 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Records */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Compliance Records</CardTitle>
            <CardDescription>Last 5 compliance checks</CardDescription>
          </CardHeader>
          <CardContent>
            {student.studentProfile?.complianceRecords &&
            student.studentProfile.complianceRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">GPA</th>
                      <th className="text-left p-3">Credits</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.studentProfile.complianceRecords.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm">
                          {format(new Date(record.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="p-3">{record.cumulativeGpa?.toFixed(2) || 'N/A'}</td>
                        <td className="p-3">{record.creditHours || 0}</td>
                        <td className="p-3">
                          {record.isEligible ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                              Eligible
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                              Ineligible
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No compliance records found</p>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Latest alerts and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            {student.studentProfile?.alerts && student.studentProfile.alerts.length > 0 ? (
              <div className="space-y-3">
                {student.studentProfile.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 border rounded-lg ${
                      alert.severity === 'HIGH'
                        ? 'bg-red-50 border-red-200'
                        : alert.severity === 'MEDIUM'
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{alert.alertType}</p>
                        <p className="text-sm mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-600 mt-2">
                          {format(new Date(alert.createdAt), 'MMM dd, yyyy hh:mm a')}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          alert.severity === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : alert.severity === 'MEDIUM'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    {!alert.resolvedAt && (
                      <p className="text-xs text-orange-600 mt-2 font-medium">
                        ⚠️ Unresolved
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No alerts found</p>
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Recent academic performance tracking</CardDescription>
          </CardHeader>
          <CardContent>
            {student.studentProfile?.performanceMetrics &&
            student.studentProfile.performanceMetrics.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.studentProfile.performanceMetrics.map((metric) => (
                      <tr key={metric.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm">
                          {format(new Date(metric.recordedAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="p-3">{metric.metricType}</td>
                        <td className="p-3 font-semibold">{metric.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No performance metrics found</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('Error loading student:', error);
    notFound();
  }
}
