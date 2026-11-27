import { User } from '@/types';

type RoleUser = Pick<User, 'role' | 'canPublish'> | null | undefined;

export function isAdmin(user: RoleUser): boolean {
  return user?.role === 'admin';
}

export function isSectionEditor(user: RoleUser): boolean {
  return user?.role === 'section_editor';
}

export function isSeniorEditor(user: RoleUser): boolean {
  return user?.role === 'editor';
}

export function isEditorialReviewer(user: RoleUser): boolean {
  return isSeniorEditor(user) || isSectionEditor(user);
}

export function canManageEditorial(user: RoleUser): boolean {
  return isAdmin(user) || isSeniorEditor(user) || isSectionEditor(user);
}

export function canCreateOrEditArticles(user: RoleUser): boolean {
  return canManageEditorial(user) || user?.role === 'contributor';
}

export function getRoleLabel(role?: string, _canPublish?: boolean): string {
  if (role === 'admin') return 'Admin';
  if (role === 'section_editor') return 'Section Editor';
  if (role === 'editor') return 'Senior Editor';
  return 'Contributor';
}
