
'use server'

import connectDB from "@/lib/database";
import { Roles } from "@/lib/modelInterfaces";
import PhotoFile from "@/lib/models/PhotoFile";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { ActionResponseType } from "./superadmin";

export async function uploadProfilePhoto(role: Roles, id: string, prevState: ActionResponseType, formData: FormData): Promise<ActionResponseType>
{
  const photoFile = formData.get("photo")
  if (!photoFile) {
    return {
      error: 'No photo selected'
    }
  }
  try {
    await connectDB()
    const session = await getSession(role)
    if (!session) {
      return {
        error: 'Invalid session'
      }
    }
    const user = await User.findById(id)
    if (!user) {
      return {
        error: 'User not found'
      }
    }
    if (user.photo) {
      await PhotoFile.findByIdAndDelete(user.photo);
    }
    const photoArrayBuffer = await (photoFile as File).arrayBuffer()
    const file = Buffer.from(photoArrayBuffer)
    const mimeType = (photoFile as File).type
    const size = (photoFile as File).size
    const uploaded = await PhotoFile.create({
      file,
      mimeType,
      size
    });
    if (!uploaded) {
      return {
        error: 'Failed to upload photo'
      }
    }
    const photo = uploaded._id.toHexString()
    const data = {
      $set: {
        photo: photo
      }
    }
    const updated = await User.findByIdAndUpdate(id, data, {
      new: true,
      upsert: false,
      runValidators: true
    })
    if (!!updated) {
      return {
        success: 'Profile photo uploaded successfully'
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: "Failed to upload photo"
  }
}

export async function updateProfileAccount(role: Roles, id: string, formData: FormData): Promise<ActionResponseType>
{
  const dataForm = Object.entries({
    prefixName: formData.get('prefixName'),
    firstName: formData.get('firstName'),
    middleName: formData.get('middleName'),
    lastName: formData.get('lastName'),
    suffixName: formData.get('suffixName'),
    email: formData.get('email'),
    password: formData.get('password'),
  }).filter(([key, value]) => (key !== 'password') || (key === 'password' && !!value));

  try {
    await connectDB()
    const session = await getSession(role)
    if (!session) {
      return {
        error: 'Invalid session'
      }
    }
    const data = {
      $set: { ...Object.fromEntries(dataForm) }
    }

    const updated = await User.findByIdAndUpdate(id, data, { new: true, upsert: false, runValidators: true  })

    if (!!updated) {
      return {
        success: 'Profile updated successfully'
      }
    }
  } catch (e) {
    console.log(e)
  }

  return {
    error: "Failed to update profile"
  }
}
