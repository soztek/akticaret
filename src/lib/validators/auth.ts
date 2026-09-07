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

export const registerDealerSchema = registerSchema.extend({
  companyName: z.string().min(2, "Firma adı gerekli"),
  companyType: z.enum(["SAHIS", "LIMITED", "ANONIM", "DIGER"]),
  taxOffice: z.string().optional().or(z.literal("")),
  taxNumber: z.string().min(10, "Vergi/TC no en az 10 hane"),
  city: z.string().optional().or(z.literal("")),
  district: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterDealerInput = z.infer<typeof registerDealerSchema>;
