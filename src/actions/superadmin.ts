'use server';
import connectDB from "@/lib/database";
import { DocumentType, Roles, UserDocument } from "@/lib/modelInterfaces";
import Department from "@/lib/models/Department";
import ESignature from "@/lib/models/ESignature";
import Template from "@/lib/models/Template";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";

const role = Roles.SuperAdmin;

export interface ActionResponseType {
  success?: string, error?: string
}

export async function addDepartment(prevState: ActionResponseType, formData: FormData): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!session) {
      return {
        error: 'Invalid Session'
      }
    }
    const name = formData.get('name')
    if (!name) {
      return {
        error: 'Department Name is required'
      }
    }
    // check if department already exists
    const department = await Department.findOne({ name }).exec()
    if (department) {
      return {
        error: 'Department already exists'
      }
    }
    const create = await Department.create({
      name,
    })
    if (!!create) {
      return {
        success: 'Department added successfully'
      }
    }
  } catch (e) {}
  return {
    error: 'Failed to add department'
  }
}

export async function addAccountDepartment(id: string, prevState: ActionResponseType, formData: FormData): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!session) {
      return {
        error: 'Invalid Session'
      }
    }
    const departmentId = formData.get('departmentId')
    if (!departmentId) {
      return {
        error: 'Department is required'
      }
    }
    const user = await User.findOne({ _id: id }).exec()
    if (!user) {
      return {
        error: 'Invalid Account ID'
      }
    }
    const prevDeptCount = user.departmentIds.length
    user.departmentIds.push(departmentId);
    const updated = await user.save();
    if (updated.departmentIds.length > prevDeptCount) {
      return {
        success: 'Department added successfully'
      }
    }
  } catch (e) {}
  return {
    error: 'Failed to add department'
  }
}

export async function addUserAccount(userRole: Roles, prevState: ActionResponseType, formData: FormData): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!session) {
      return {
        error: 'Invalid Session'
      }
    }
    const data = {
      role: userRole,
      employeeId: formData.get('employeeId'),
      email: formData.get('email'),
      highestPosition: formData.get('highestPosition'),
      prefixName: formData.get('prefixName') || '',
      suffixName: formData.get('suffixName') || '',
      firstName: formData.get('firstName'),
      middleName: formData.get('middleName') || '',
      lastName: formData.get('lastName'),
      // password format = [lowercase first letter of first name][uppercase first letter of last name][employee ID]
      password: (formData.get('firstName') as string)[0].toLowerCase() + (formData.get('lastName') as string)[0].toUpperCase() + (formData.get('employeeId') as string),
    }
    // check if user already exists
    const user = await User.findOne({ employeeId: data.employeeId }).exec()
    if (user) {
      return {
        error: data.role + ' account already exists'
      }
    }
    const create = await User.create(data)
    if (!!create) {
      return {
        success: data.role + ' account added successfully'
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to add account'
  }
}

export async function removeAccountDepartment({ id, departmentId }: { id: string, departmentId: string }): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!session) {
      return {
        error: 'Invalid Session'
      }
    }
    if (!id || !departmentId) {
      return {
        error: 'Invalid Account ID or Department ID'
      }
    }
    const user = await User.findByIdAndUpdate(id, { $pull: { departmentIds: departmentId } }, { new: true, upsert: false, runValidators: true }).exec()
    if (!!user) {
      return {
        success: 'Department removed from account successfully'
      }
    }
  } catch (e) {}
  return {
    error: 'Failed to remove department from account'
  }
}

export async function updateDepartment(id: string|undefined, prevState: ActionResponseType, formData: FormData): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!session) {
      return {
        error: 'Invalid Session'
      }
    }
    const name = formData.get('name')
    if (!name) {
      return {
        error: 'Department Name is required'
      }
    }
    if (!id) {
      return {
        error: 'Invalid Department ID'
      }
    }
    // check if department already exists
    const department = await Department.findOne({ _id: id }).exec()
    if (!department) {
      return {
        error: 'Invalid Department ID'
      }
    }
    department.name = name
    const updated = await department.save({ runValidators: true });
    if (!!updated) {
      return {
        success: 'Department updated successfully'
      }
    }
  } catch (e) {}
  return {
    error: 'Failed to update department'
  }
}

export async function updateAccount(id: string|undefined, prevState: ActionResponseType, formData: FormData): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!session) {
      return {
        error: 'Invalid Session'
      }
    }
    const data = {
      $set: {
        email: formData.get('email'),
        highestPosition: formData.get('highestPosition'),
        prefixName: formData.get('prefixName') || '',
        suffixName: formData.get('suffixName') || '',
        firstName: formData.get('firstName'),
        middleName: formData.get('middleName') || '',
        lastName: formData.get('lastName'),
      }
    }
    const account = User.findByIdAndUpdate(id, data, { new: true, upsert: false, runValidators: true }).exec();
    if (!!account) {
      return {
        success: 'Account updated successfully'
      }
    }
  } catch (e) {}
  return {
    error: 'Failed to update department'
  }
}

export async function dissolveDepartment(id: string|undefined): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!session) {
      return {
        error: 'Invalid Session'
      }
    }
    if (!id) {
      return {
        error: 'Invalid Department ID'
      }
    }
    // check if department already exists
    await Department.deleteOne({ _id: id }).exec()
    return {
      success: 'Department dissolved successfully'
    }
  } catch (e) {}
  return {
    error: 'Failed to dissolve department'
  }
}

export async function toogleActiveAccount(id: string): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!session) {
      return {
        error: 'Invalid Session'
      }
    }
    if (!id) {
      return {
        error: 'Invalid Account ID'
      }
    }
    // check if department already exists
    const account = await User.findById(id).exec();
    account.deactivated = !account.deactivated;
    const update = await account.save();
    if (!!update) {
      return {
        success: 'Account ' + (update.deactivated ? 'deactivated' : 'activated') + ' successfully'
      }
    }
  } catch (e) {}
  return {
    error: 'Failed to dissolve department'
  }
}

export async function saveTemplate(departmentId: string, doctype: DocumentType, formData: FormData): Promise<ActionResponseType & { templateId?: string }>
{
  await connectDB()
  try {
    const session = await getSession(Roles.SuperAdmin)
    if (!!session?.user) {
      const department = await Department.findById(departmentId).exec()
      if (!department) {
        return {
          error: 'Department not found'
        }
      }
      const content = formData.get('content')
      const title = formData.get('title')
      const validity = new Date()
      validity.setFullYear(validity.getFullYear() + 1)
      if (!content) {
        return {
          error: 'Template should not be empty'
        }
      }
      if (doctype === DocumentType.Memo) {
        const template = await Template.create({
          title,
          documentType: doctype,
          content: content,
          validity: validity,
        })
        if (!!template?._id) {
          department.memoTemplates.push(template._id.toHexString())
          const updated = await department.save({ new: true, upsert: false, runValidators: true })
          if (!!updated) {
            return {
              success: 'Template Successfully Updated',
              templateId: template._id.toHexString()
            }
          }
        }
      } else if (doctype === DocumentType.Letter) {
        const template = await Template.create({
          title,
          documentType: doctype,
          content: content,
          validity: validity,
        })
        if (!!template?._id) {
          department.letterTemplates.push(template._id.toHexString())
          const updated = await department.save({ new: true, upsert: false, runValidators: true })
          if (!!updated) {
            return {
              success: 'Template Successfully Saved',
              templateId: template._id.toHexString()
            }
          }
        }
      } else {
        return {
          error: 'Invalid document type'
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to save template'
  }
}

export async function saveIndividualTemplate(formData: FormData): Promise<ActionResponseType & { templateId?: string }>
{
  await connectDB()
  try {
    const session = await getSession(Roles.SuperAdmin)
    if (!!session?.user) {
      const content = formData.get('content')
      const title = formData.get('title')
      const validity = new Date()
      validity.setFullYear(validity.getFullYear() + 1)
      if (!content) {
        return {
          error: 'Template should not be empty'
        }
      }
      const template = await Template.create({
        title,
        isForIndividual: true,
        content: content,
        validity: validity,
      })
      if (template?._id) {
        return {
          success: 'Template Successfully Saved',
          templateId: template._id.toHexString()
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to save template'
  }
}

export async function updateTemplate(templateId: string, doctype: DocumentType, formData: FormData): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(Roles.SuperAdmin)
    if (!!session?.user) {
      const template = await Template.findOne({ _id: templateId, documentType: doctype }).exec()
      if (!template) {
        return {
          error: 'Template not found'
        }
      }
      const content = formData.get('content')
      if (!content) {
        return {
          error: 'Template should not be empty'
        }
      }
      template.content = content
      const updated = await template.save({ new: true, upsert: false, runValidators: true })
      if (!!updated) {
        return {
          success: 'Template Successfully Updated',
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to update template'
  }
}