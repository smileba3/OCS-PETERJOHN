'use server';
import type { SessionPayload } from '@/lib/types';
import { type JWTPayload, SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import connectDB from './database';
import { NotificationDocument, Roles, UserDocument } from './modelInterfaces';
import User from './models/User';
const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

export async function encrypt(payload: SessionPayload | { [key: string]: any }, hours: number = 8) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${hours}h`)
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = ''): Promise<SessionPayload | JWTPayload | { [key: string]: any } | undefined> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload
  } catch (error) {
    return undefined
    // console.log('Failed to verify session')
  }
}

export async function generateSessionPayload(role: Roles, userId: string, expHours: number = 8) {
  await connectDB();
  try {
    const user = await User.findOne({ role, _id: userId })
      .select('-password -departmentIds -readMemos -readLetters -deactivated -notification')
      .lean<UserDocument>()
      .exec()
    if (user) {
      return {
        user: {
          ...user,
          fullName: [user.prefixName, user.firstName, user.middleName?.[0] ? user.middleName[0] + "." : '', user.lastName, user.suffixName].filter((v) => !!v).join(" "),
        },
        expiresAt: new Date(Date.now() + expHours * 60 * 60 * 1000)
      }
    }
  } catch (e) {}
  return null;
}

export async function createSession(role: Roles, userId: string, expHours: number = 8): Promise<boolean> {
  const payload = await generateSessionPayload(role, userId, expHours);
  if (!payload) {
    return false;
  }

  const session = await encrypt(payload, expHours)

  cookies().set('ocs-' + role, session, {
    httpOnly: true,
    secure: true,
    expires: payload.expiresAt as Date,
    sameSite: 'lax',
    path: '/' + role,
  })

  return true;
}

export async function getSession(role: Roles): Promise<JWTPayload | SessionPayload | { [key: string]: any } | null> {
  const cookie = cookies().get('ocs-' + role)
  if (cookie && cookie.value) {
    const session = await decrypt(cookie.value)
    if (session && (Math.floor(Date.now() / 1000) > (session as any).exp)) {
      await destroySession(role)
      return null;
    }
    return session
  }
  return null;
}

export async function destroySession(role: Roles) {
  cookies().delete('ocs-' + role)
  const expires = new Date()
  expires.setFullYear(1901, 1, 1)
  cookies().set('ocs-' + role, '', {
    httpOnly: true,
    secure: true,
    expires,
    sameSite: 'lax',
    path: '/' + role,
  })
}

export async function updateSession(role: Roles): Promise<boolean> {
  const session = await getSession(role);
  if (session?.user) {
    const result = await createSession(role, session.user._id)
    return result;
  }
  return false;
}

export async function getMyNotifications(role: Roles, unreadOnly?: boolean): Promise<NotificationDocument[]|null> {
  await connectDB();
  try {
    const session = await getSession(role);
    if (!session) {
      return null
    }
    // correct this code next line
    const user = await User.findOne({ email: session.user.email, role }).lean<UserDocument>().exec();
    if (!user) {
      return []
    }
    const notifications = user.notification.reverse()
    if (!unreadOnly) {
      return notifications;
    }
    const filtered = notifications.filter((n: any) => !n.read);
    return filtered
  } catch (e) {
    console.log("ERROR:", e);
  }
  return null;
}