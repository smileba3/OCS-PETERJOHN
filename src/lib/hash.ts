import 'server-only'

export async function hashPassword(password: string, callback?: (err: any | null, result: string) => void): Promise<string|void> {
  const salt = crypto.getRandomValues(new Uint8Array(18));
  const storedSalt = Buffer.from(salt).toString('base64');
  const passwordSalted = new TextEncoder().encode(password + storedSalt);

  try {
    const hashPasswordSalted = await crypto.subtle.digest('SHA-256', passwordSalted);
    const hashPasswordSaltedBase64 = `${Buffer.from(hashPasswordSalted).toString('base64')}${storedSalt}`;
    if (callback) {
      callback(null, hashPasswordSaltedBase64);
    } else {
      return hashPasswordSaltedBase64;
    }
  } catch (err) {
    if (callback) {
      callback(err, '');
    } else {
      throw err;
    }
  }
}

export async function compare(password: string, storedPassword: string, callback?: (err: any | null, result: boolean) => void): Promise<boolean|void> {
  const oldStoredSalt = storedPassword.slice(storedPassword.length - 24);
  const passwordSalted = new TextEncoder().encode(password + oldStoredSalt);

  try {
    const hashPasswordSalted = await crypto.subtle.digest('SHA-256', passwordSalted);
    const passwordSaltedBase64 = Buffer.from(hashPasswordSalted).toString('base64');
    const isVerified = storedPassword.slice(0, storedPassword.length - 24) === passwordSaltedBase64;
    if (callback) {
      callback(null, isVerified);
    } else {
      return isVerified;
    }
  } catch (err) {
    if (callback) {
      callback(err, false);
    } else {
      throw err;
    }
  }
}