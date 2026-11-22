import { redirect } from 'next/navigation';
import { SECURE_ADMIN_LOGIN_PATH } from '@/config/routes';

export default function AdminLoginRedirect() {
  redirect(SECURE_ADMIN_LOGIN_PATH);
}
