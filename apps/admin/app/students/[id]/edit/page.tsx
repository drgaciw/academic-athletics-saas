import { auth as clerkAuth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@aah/ui';
import { getStudent, updateStudent, type StudentFormData } from '../../actions';
import { StudentForm } from '../../../../components/students/StudentForm';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditStudentPage({ params }: Props) {
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

    const initialData = {
      email: student.email,
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      studentId: student.studentProfile?.studentId || '',
      sport: student.studentProfile?.sport || '',
      team: student.studentProfile?.team || undefined,
      gpa: student.studentProfile?.gpa || undefined,
      creditHours: student.studentProfile?.creditHours || undefined,
      eligibilityStatus: student.studentProfile?.eligibilityStatus || undefined,
      academicStanding: student.studentProfile?.academicStanding || undefined,
      enrollmentStatus: student.studentProfile?.enrollmentStatus || undefined,
      major: student.studentProfile?.major || undefined,
      minor: student.studentProfile?.minor || undefined,
      advisor: student.studentProfile?.advisor || undefined,
      expectedGradDate: student.studentProfile?.expectedGradDate
        ? new Date(student.studentProfile.expectedGradDate).toISOString().split('T')[0]
        : undefined,
    };

    const handleUpdate = async (id: string, data: Partial<StudentFormData>) => {
      return await updateStudent(id, data);
    };

    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Edit Student</h1>
            <p className="text-gray-600 mt-1">
              {student.firstName} {student.lastName}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentForm
              studentId={student.id}
              initialData={initialData}
              onUpdate={handleUpdate}
            />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('Error loading student:', error);
    notFound();
  }
}
