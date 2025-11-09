import { redirect } from 'next/navigation';

export default function AdminHome() {
  // Redirect to dashboard
  redirect('/admin/dashboard');
}
