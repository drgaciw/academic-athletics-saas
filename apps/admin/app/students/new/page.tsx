import { auth as clerkAuth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@aah/ui';
import { createStudent } from '../actions';
import { StudentForm } from '../../../components/students/StudentForm';

export default async function NewStudentPage() {
  const { userId } = await clerkAuth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Add New Student</h1>
          <p className="text-gray-600 mt-1">Create a new student-athlete profile</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>
            Fill out all required fields to create a new student profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentForm onCreate={createStudent} />
        </CardContent>
      </Card>
    </div>
  );
}
