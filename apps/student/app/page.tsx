import { redirect } from 'next/navigation';

export default function StudentHome() {
  // Redirect to dashboard
  redirect('/student/dashboard');
}
