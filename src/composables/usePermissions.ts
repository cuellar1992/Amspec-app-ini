import { computed } from 'vue'
import authService from '@/services/authService'

export function usePermissions() {
  const currentUser = computed(() => authService.getCurrentUser())
  const userRoleName = computed(() => currentUser.value?.role || '')

  // Check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    // Si no tiene rol o el rol está vacío, tratar como admin (todos los privilegios)
    if (!userRoleName.value || userRoleName.value.trim() === '') return true
    
    // Admin has all permissions
    if (userRoleName.value === 'admin') return true
    
    // For now, return false for all other permissions
    // This can be extended later if needed
    return false
  }

  // Check if user has any of the provided permissions
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  // Check if user has all of the provided permissions
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  // Load user role - simplified version
  const loadUserRole = async (): Promise<null> => {
    // No longer loads roles from API
    return null
  }

  // Check menu access
  const canAccessMenu = (menuPermission: string): boolean => {
    return hasPermission(menuPermission)
  }

  return {
    currentUser,
    userRoleName,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loadUserRole,
    canAccessMenu,
  }
}

