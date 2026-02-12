import { database } from "./database";
import { User, IUser } from "./models/user";
import { encryptToken } from "./encryption";

export interface UserSessionData {
  githubId: number;
  username: string;
  email: string;
  avatarUrl: string;
  accessToken: string;
}

export async function createOrUpdateUser(userData: UserSessionData): Promise<IUser> {
  await database.connect();
  
  const encryptedToken = encryptToken(userData.accessToken);
  
  const user = await User.findOneAndUpdate(
    { githubId: userData.githubId },
    {
      ...userData,
      accessToken: encryptedToken
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

export async function updateUserToken(githubId: number, accessToken: string): Promise<void> {
  await database.connect();
  
  const encryptedToken = encryptToken(accessToken);
  
  await User.findOneAndUpdate(
    { githubId },
    { accessToken: encryptedToken },
    { runValidators: true }
  );
}

export async function deleteUserSession(githubId: number): Promise<void> {
  await database.connect();
  
  await User.findOneAndDelete({ githubId });
}