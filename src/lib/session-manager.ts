import { database } from "./database";
import { User, IUser } from "./models/user";
import { encryptToken, decryptToken } from "./encryption";

export interface UserSessionData {
  githubId: number;
  username: string;
  email: string;
  avatarUrl: string;
  accessToken: string;
}

export interface SessionValidationResult {
  isValid: boolean;
  user?: IUser;
  error?: string;
}

export async function createOrUpdateUser(userData: UserSessionData): Promise<IUser> {
  await database.connect();
  
  const encryptedToken = encryptToken(userData.accessToken);
  
  const user = await User.findOneAndUpdate(
    { githubId: userData.githubId },
    {
      ...userData,
      accessToken: encryptedToken,
      lastLoginAt: new Date()
    },
    { 
      upsert: true, 
      returnDocument: 'after',
      runValidators: true
    }
  );

  return user;
}

export async function getUserByGithubId(githubId: number): Promise<IUser | null> {
  await database.connect();
  
  return User.findOne({ githubId }).select('+accessToken');
}

export async function getUserWithDecryptedToken(githubId: number): Promise<{ user: IUser; accessToken: string } | null> {
  const user = await getUserByGithubId(githubId);
  if (!user || !user.accessToken) {
    return null;
  }

  try {
    const decryptedToken = decryptToken(user.accessToken);
    return { user, accessToken: decryptedToken };
  } catch (error) {
    console.error('Failed to decrypt user token:', error);
    return null;
  }
}

export async function validateUserSession(githubId: number): Promise<SessionValidationResult> {
  try {
    const user = await getUserByGithubId(githubId);
    
    if (!user) {
      return { isValid: false, error: 'User not found' };
    }

    if (!user.accessToken) {
      return { isValid: false, error: 'No access token found' };
    }

    // Try to decrypt the token to ensure it's valid
    try {
      decryptToken(user.accessToken);
    } catch (error) {
      return { isValid: false, error: 'Invalid access token' };
    }

    // Update last seen timestamp
    await User.findByIdAndUpdate(user._id, { lastSeenAt: new Date() });

    return { isValid: true, user };
  } catch (error) {
    console.error('Session validation error:', error);
    return { isValid: false, error: 'Session validation failed' };
  }
}

export async function updateUserToken(githubId: number, accessToken: string): Promise<void> {
  await database.connect();
  
  const encryptedToken = encryptToken(accessToken);
  
  await User.findOneAndUpdate(
    { githubId },
    { 
      accessToken: encryptedToken,
      lastLoginAt: new Date()
    },
    { runValidators: true }
  );
}

export async function refreshUserSession(githubId: number): Promise<boolean> {
  try {
    const user = await getUserByGithubId(githubId);
    if (!user) {
      return false;
    }

    // Update session timestamp
    await User.findByIdAndUpdate(user._id, { 
      lastSeenAt: new Date() 
    });

    return true;
  } catch (error) {
    console.error('Failed to refresh user session:', error);
    return false;
  }
}

export async function deleteUserSession(githubId: number): Promise<void> {
  await database.connect();
  
  await User.findOneAndDelete({ githubId });
}

export async function cleanupExpiredSessions(daysOld: number = 30): Promise<number> {
  await database.connect();
  
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  
  const result = await User.deleteMany({
    lastSeenAt: { $lt: cutoffDate }
  });

  return result.deletedCount || 0;
}

// Helper function to check if user has required permissions
export async function checkUserPermissions(githubId: number, requiredPermissions: string[] = []): Promise<boolean> {
  const user = await getUserByGithubId(githubId);
  if (!user) {
    return false;
  }

  // For now, all authenticated users have all permissions
  // In the future, you could implement role-based access control here
  return true;
}