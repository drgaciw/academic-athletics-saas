import { auth } from '@clerk/nextjs';
import { prisma } from '@aah/database';
import { Card, CardHeader, CardTitle, CardContent } from '@aah/ui';
import { redirect } from 'next/navigation';

async function getStudents() {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    include: {
      complianceRecords: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { lastName: 'asc' },
  });

  return students;
}

export default async function StudentsPage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const students = await getStudents();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Student Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Students ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">GPA</th>
                  <th className="text-left p-3">Credits</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const latestCompliance = student.complianceRecords[0];
                  return (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {student.email}
                      </td>
                      <td className="p-3">
                        {latestCompliance?.gpa?.toFixed(2) || 'N/A'}
                      </td>
                      <td className="p-3">
                        {latestCompliance?.creditHours || 0}
                      </td>
                      <td className="p-3">
                        {latestCompliance?.eligible ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                            Eligible
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm">
                            Review
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <a
                          href={`/admin/students/${student.id}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Details
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
