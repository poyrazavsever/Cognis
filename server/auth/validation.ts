import { z } from "zod";

export const authCredentialsSchema = z.object({
  email: z.email().transform((value) => normalizeAuthEmail(value)),
  password: z.string().min(8).max(128),
});

export type AuthCredentials = z.infer<typeof authCredentialsSchema>;

export function parseAuthCredentials(formData: FormData): AuthCredentials {
  return authCredentialsSchema.parse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export function normalizeAuthEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function getDefaultDisplayName(email: string): string {
  return email.split("@")[0] || "Neta Kullanıcısı";
}

