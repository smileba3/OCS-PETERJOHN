import { DepartmentDocument, PhotoFileDocument } from "@/lib/modelInterfaces";

export interface DashboardDataProps {
  departmentsCount: string|number|JSX.Element,
  adminAccountsCount: string|number|JSX.Element,
  facultyAccountsCount: string|number|JSX.Element,
  eSignatureCount: string|number|JSX.Element,
  totalMemorandumsCount: string|number|JSX.Element,
  totalLettersCount: string|number|JSX.Element,
}

export interface DepartmentColumns {
  _id: string;
  name: string;
  memorandums: number;
  letters: number;
  status: string;
  [key: string]: any;
}

export interface AccountsColumns {
  _id: string;
  employeeId: string;
  email: string
  prefixName: string
  suffixName: string
  firstName: string
  middleName: string
  lastName: string
  departmentIds: DepartmentDocument[]
  photo: PhotoFileDocument|null,
  deactivated: boolean;
  hasRegisteredESignature?: boolean;
  [key: string]: any;
}