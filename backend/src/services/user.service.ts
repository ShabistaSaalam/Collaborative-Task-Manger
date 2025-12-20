// src/services/user.service.ts
import prisma from "../../prisma/client";
import bcrypt from "bcrypt";

export type UpdateProfileInput = {
  name?: string | undefined;
  email?: string | undefined;
  password?: string | undefined;
};

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
}

export async function updateUserProfile(userId: string, input: UpdateProfileInput) {
  const data: Partial<{ name: string; email: string; password: string }> = {};

  if (input.name) data.name = input.name;
  if (input.email) data.email = input.email;
  if (input.password) data.password = await bcrypt.hash(input.password, 10);

  // return updated user
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true },
  });
}

export async function getAllUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });
}