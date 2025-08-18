import { z } from 'zod';

export const usernameValidation = z
  .string()
  .min(1, 'username must be at least 1 character')
  .max(20, 'username must be no more than 20 characters')
  .regex(/^[a-z0-9_]+$/, 'username must be lowercase letters, numbers, underscore');

export const colorHexValidation = z
  .string()
  .regex(/^#(?:[0-9a-f]{6})$/i, 'color must be a 6-digit hex like #RRGGBB');

export const profileCustomisationsSchema = z.object({
  username: usernameValidation.optional(),
  displayName: z.string().min(1).max(50).optional(),
  profileColor: colorHexValidation.optional(),
  textColor: colorHexValidation.optional(),
  profileQuote: z.string().max(150).optional(),
});