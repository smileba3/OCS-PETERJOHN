import 'server-only';
import { Roles } from './modelInterfaces';
import Department from './models/Department';
import DocFile from './models/DocFile';
import ESignature from './models/ESignature';
import Letter from './models/Letter';
import Memo from './models/Memo';
import PhotoFile from './models/PhotoFile';
import Template from './models/Template';
import User from './models/User';
export async function seed() {
  try {
    const sadmin = await User.findOne({
      role: Roles.SuperAdmin,
    })
    if (!sadmin) {
      await User.create({
        employeeId: 1,
        password: 'password',
        role: Roles.SuperAdmin,
        email: 'admin@smccnasipit.edu.ph',
        firstName: 'Admin',
        lastName: 'EDP',
      })
    }
  } catch (e) {}
  // try {
  //   const admin = await User.findOne({
  //     role: Roles.Admin,
  //   })
  //   if (!admin) {
  //     await User.create({
  //       employeeId: 2,
  //       password: 'password',
  //       role: Roles.Admin,
  //       email: 'admin@gmail.com',
  //       firstName: 'Admin',
  //       lastName: 'User',
  //     })
  //   }
  // } catch (e) {}
  // try {
  //   const faculty = await User.findOne({
  //     role: Roles.Faculty,
  //   })
  //   if (!faculty) {
  //     await User.create({
  //       employeeId: 3,
  //       password: 'password',
  //       role: Roles.Faculty,
  //       email: 'faculty@gmail.com',
  //       firstName: 'Faculty',
  //       lastName: 'Admin',
  //     })
  //   }
  // } catch (e) {}
  try {
    await PhotoFile.countDocuments()
  } catch (e) {}
  try {
    await Department.countDocuments()
  } catch (e) {}
  try {
    await ESignature.countDocuments()
  } catch (e) {}
  try {
    await Template.countDocuments()
  } catch (e) {}
  try {
    await Memo.countDocuments()
  } catch (e) {}
  try {
    await Letter.countDocuments()
  } catch (e) {}
  try {
    await DocFile.countDocuments()
  } catch (e) {}
}
