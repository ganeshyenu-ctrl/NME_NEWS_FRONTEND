import { User } from '@/types';

type RoleUser = Pick<User, 'role' | 'canPublish'> | null | undefined;

export function isAdmin(user: RoleUser): boolean {
  return user?.role === 'admin';
}

export function isSectionEditor(user: RoleUser): boolean {
  return (
    user?.role === 'section_editor' ||
    (user?.role === 'editor' && user?.canPublish === false)
  );
}

export function isSeniorEditor(user: RoleUser): boolean {
  return user?.role === 'editor' && user?.canPublish !== false;
}

export function canManageEditorial(user: RoleUser): boolean {
  return isAdmin(user) || isSeniorEditor(user);
}

export function canCreateOrEditArticles(user: RoleUser): boolean {
  return isAdmin(user) || isSeniorEditor(user) || user?.role === 'contributor';
}

export function getRoleLabel(role?: string, canPublish?: boolean): string {
  if (role === 'admin') return 'Admin';
  if (role === 'section_editor' || (role === 'editor' && canPublish === false)) {
    return 'Section Editor';
  }
  if (role === 'editor') return 'Senior Editor';
  return 'Contributor';
}
