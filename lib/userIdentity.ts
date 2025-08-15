import UserModel from "@/lib/models/user.schema";

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function findUserByUsernameCI(username: string) {
  if (!username) return null;
  const regex = new RegExp(`^${escapeRegex(username)}$`, "i");
  return UserModel.findOne({ username: regex }).exec();
}

export async function findUserByEmailCI(email: string) {
  if (!email) return null;
  const regex = new RegExp(`^${escapeRegex(email)}$`, "i");
  return UserModel.findOne({ email: regex }).exec();
}

export async function isUsernameTakenCI(username: string): Promise<boolean> {
  const user = await findUserByUsernameCI(username);
  return !!user;
}

export async function isEmailTakenCI(email: string): Promise<boolean> {
  const user = await findUserByEmailCI(email);
  return !!user;
}