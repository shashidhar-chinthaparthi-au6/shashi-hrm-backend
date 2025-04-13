export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  HR_MANAGER = 'HR_MANAGER',
  DEPARTMENT_MANAGER = 'DEPARTMENT_MANAGER',
  EMPLOYEE = 'EMPLOYEE'
}

export interface RolePermissions {
  [key: string]: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
}

export const rolePermissions: Record<Role, RolePermissions> = {
  [Role.SUPER_ADMIN]: {
    employees: { read: true, write: true, delete: true },
    departments: { read: true, write: true, delete: true },
    roles: { read: true, write: true, delete: true },
    attendance: { read: true, write: true, delete: true },
    leaves: { read: true, write: true, delete: true },
    payroll: { read: true, write: true, delete: true },
    settings: { read: true, write: true, delete: true },
  },
  [Role.ADMIN]: {
    employees: { read: true, write: true, delete: true },
    departments: { read: true, write: true, delete: true },
    roles: { read: true, write: true, delete: false },
    attendance: { read: true, write: true, delete: true },
    leaves: { read: true, write: true, delete: true },
    payroll: { read: true, write: true, delete: true },
    settings: { read: true, write: true, delete: false },
  },
  [Role.HR_MANAGER]: {
    employees: { read: true, write: true, delete: false },
    departments: { read: true, write: false, delete: false },
    roles: { read: true, write: false, delete: false },
    attendance: { read: true, write: true, delete: false },
    leaves: { read: true, write: true, delete: false },
    payroll: { read: true, write: true, delete: false },
    settings: { read: true, write: false, delete: false },
  },
  [Role.DEPARTMENT_MANAGER]: {
    employees: { read: true, write: false, delete: false },
    departments: { read: true, write: false, delete: false },
    roles: { read: true, write: false, delete: false },
    attendance: { read: true, write: true, delete: false },
    leaves: { read: true, write: true, delete: false },
    payroll: { read: true, write: false, delete: false },
    settings: { read: true, write: false, delete: false },
  },
  [Role.EMPLOYEE]: {
    employees: { read: true, write: false, delete: false },
    departments: { read: true, write: false, delete: false },
    roles: { read: true, write: false, delete: false },
    attendance: { read: true, write: true, delete: false },
    leaves: { read: true, write: true, delete: false },
    payroll: { read: true, write: false, delete: false },
    settings: { read: true, write: false, delete: false },
  },
}; 