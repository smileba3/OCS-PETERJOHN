import { JWTPayload } from 'jose';
import { z } from 'zod';
import { Roles, UserDocument } from './modelInterfaces';

export interface TableColumnProps {
  label: string
  field: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  searchable?: boolean
  searchMap?: Record<any, any>
  render?: (row: any) => JSX.Element|string
}

export type SortDirection = 'asc' | 'desc'

export type ViewLayout = "grid"|"list"


export const SignupFormSchema = z.object({
  employeeId: z.string().trim(),
  password: z.string(),
  role: z.enum([Roles.Admin, Roles.SuperAdmin, Roles.Faculty]),
  email: z.string().trim().email({ message: 'Invalid Email' }),
  prefixName: z.string().trim().optional(),
  suffixName: z.string().trim().optional(),
  firstName: z.string().trim(),
  middleName: z.string().trim().optional(),
  lastName: z.string().trim(),
  departmentIds: z.array(z.string()).optional(),
})

export const LoginFormSchema = z.object({
  role: z.enum([Roles.Admin, Roles.SuperAdmin, Roles.Faculty]),
  employeeId: z.string().trim(),
  password: z.string()
    .min(1, { message: 'Fill in password' })
    .trim(),
});


export const ChangePasswordFormSchema = z.object({
  role: z.enum([Roles.Admin, Roles.SuperAdmin, Roles.Faculty]),
  current_password: z.string()
    .min(1, { message: 'Fill in current password' })
    .trim(),
  new_password: z.string()
    .min(8, { message: 'Be at least 8 characters long' })
    .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
    .regex(/[0-9]/, { message: 'Contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, {
      message: 'Contain at least one special character.',
    })
    .trim(),
  confirm_password: z.string()
    .min(1, { message: 'Fill in confirm password' })
    .trim()
});


export type LoginFormState =
| {
    success?: boolean,
    errors?: {
      role?: string[]
      employeeId?: string[]
      password?: string[]
      credentials?: string[]
    }
    message?: string
  }
| undefined

export type ResponseFormState =
| {
    errors?: {
      role?: string[]
    } & { [key: string]: string[] };
    message?: string,
    success?: boolean
  }
| undefined


export interface SessionPayloadProp extends JWTPayload {
  user: UserDocument & { fullName: string; }
  expiresAt: Date|string
}

export type SessionPayload = SessionPayloadProp | undefined

export type AuthenticationStatus = 'authenticated' | 'unauthenticated' | 'loading' | 'error'

export enum HighestPosition {
  Admin = "Admin",
  President = "Office of the President",
  VicePresident = "Office of the Vice President"
}