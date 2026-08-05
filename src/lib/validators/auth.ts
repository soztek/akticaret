import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(1, "Şifre gerekli"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Ad Soyad en az 2 karakter"),
  email: z.string().email("Geçerli bir e-posta girin"),
  phone: z
    .string()
    .min(10, "Geçerli bir telefon girin")
    .optional()
    .or(z.literal("")),
  password: z.string().min(6, "Şifre en az 6 karakter"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
