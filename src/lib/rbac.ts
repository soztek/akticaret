import type { UserRole } from "@prisma/client";

// ============================================================
// RBAC — Roller ve granular yetki mimarisi
// Rol -> varsayılan yetkiler burada tanımlı (tek kaynak).
// Kullanıcıya özel EK yetkiler DB'de UserPermission ile eklenir.
// ============================================================

/** Sistem genelindeki tüm yetki anahtarları (Permission kataloğu ile hizalı). */
export const PERMISSIONS = {
  // Katalog
  PRODUCTS_READ: "products.read",
  PRODUCTS_WRITE: "products.write",
  CATEGORIES_WRITE: "categories.write",
  BRANDS_WRITE: "brands.write",
  STOCK_WRITE: "stock.write",
  PRICES_WRITE: "prices.write",
  // Satış
  ORDERS_READ: "orders.read",
  ORDERS_WRITE: "orders.write",
  QUOTES_READ: "quotes.read",
  QUOTES_WRITE: "quotes.write",
  // Müşteri / bayi
  CUSTOMERS_READ: "customers.read",
  CUSTOMERS_WRITE: "customers.write",
  DEALERS_READ: "dealers.read",
  DEALERS_WRITE: "dealers.write",
  // Pazarlama
  CAMPAIGNS_WRITE: "campaigns.write",
  COUPONS_WRITE: "coupons.write",
  BANNERS_WRITE: "banners.write",
  BLOG_WRITE: "blog.write",
  REVIEWS_MODERATE: "reviews.moderate",
  // Sistem
  BIZIMHESAP_MANAGE: "bizimhesap.manage",
  REPORTS_READ: "reports.read",
  SETTINGS_WRITE: "settings.write",
  USERS_MANAGE: "users.manage",
  AUDIT_READ: "audit.read",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Yetki kataloğu: seed + UI gruplaması için. */
export const PERMISSION_CATALOG: {
  key: PermissionKey;
  group: string;
  description: string;
}[] = [
  { key: PERMISSIONS.PRODUCTS_READ, group: "Ürünler", description: "Ürünleri görüntüle" },
  { key: PERMISSIONS.PRODUCTS_WRITE, group: "Ürünler", description: "Ürün ekle/düzenle/sil" },
  { key: PERMISSIONS.CATEGORIES_WRITE, group: "Ürünler", description: "Kategori yönet" },
  { key: PERMISSIONS.BRANDS_WRITE, group: "Ürünler", description: "Marka yönet" },
  { key: PERMISSIONS.STOCK_WRITE, group: "Ürünler", description: "Stok güncelle" },
  { key: PERMISSIONS.PRICES_WRITE, group: "Ürünler", description: "Fiyat güncelle" },
  { key: PERMISSIONS.ORDERS_READ, group: "Satış", description: "Siparişleri görüntüle" },
  { key: PERMISSIONS.ORDERS_WRITE, group: "Satış", description: "Sipariş yönet" },
  { key: PERMISSIONS.QUOTES_READ, group: "Satış", description: "Teklifleri görüntüle" },
  { key: PERMISSIONS.QUOTES_WRITE, group: "Satış", description: "Teklif yönet" },
  { key: PERMISSIONS.CUSTOMERS_READ, group: "Müşteriler", description: "Müşterileri görüntüle" },
  { key: PERMISSIONS.CUSTOMERS_WRITE, group: "Müşteriler", description: "Müşteri yönet" },
  { key: PERMISSIONS.DEALERS_READ, group: "Bayiler", description: "Bayileri görüntüle" },
  { key: PERMISSIONS.DEALERS_WRITE, group: "Bayiler", description: "Bayi onay/yönet" },
  { key: PERMISSIONS.CAMPAIGNS_WRITE, group: "Pazarlama", description: "Kampanya yönet" },
  { key: PERMISSIONS.COUPONS_WRITE, group: "Pazarlama", description: "Kupon yönet" },
  { key: PERMISSIONS.BANNERS_WRITE, group: "Pazarlama", description: "Banner yönet" },
  { key: PERMISSIONS.BLOG_WRITE, group: "Pazarlama", description: "Blog yönet" },
  { key: PERMISSIONS.REVIEWS_MODERATE, group: "Pazarlama", description: "Yorum moderasyonu" },
  { key: PERMISSIONS.BIZIMHESAP_MANAGE, group: "Sistem", description: "Bizim Hesap entegrasyonu" },
  { key: PERMISSIONS.REPORTS_READ, group: "Sistem", description: "Raporları görüntüle" },
  { key: PERMISSIONS.SETTINGS_WRITE, group: "Sistem", description: "Ayarları düzenle" },
  { key: PERMISSIONS.USERS_MANAGE, group: "Sistem", description: "Kullanıcı/yetki yönet" },
  { key: PERMISSIONS.AUDIT_READ, group: "Sistem", description: "Denetim kayıtları" },
];

const ALL_PERMISSIONS = PERMISSION_CATALOG.map((p) => p.key);

/** Rol -> varsayılan yetkiler. */
export const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS, // tam yetki
  ADMIN: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_WRITE,
    PERMISSIONS.CATEGORIES_WRITE,
    PERMISSIONS.BRANDS_WRITE,
    PERMISSIONS.STOCK_WRITE,
    PERMISSIONS.PRICES_WRITE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_WRITE,
    PERMISSIONS.QUOTES_READ,
    PERMISSIONS.QUOTES_WRITE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_WRITE,
    PERMISSIONS.DEALERS_READ,
    PERMISSIONS.DEALERS_WRITE,
    PERMISSIONS.CAMPAIGNS_WRITE,
    PERMISSIONS.COUPONS_WRITE,
    PERMISSIONS.BANNERS_WRITE,
    PERMISSIONS.BLOG_WRITE,
    PERMISSIONS.REVIEWS_MODERATE,
    PERMISSIONS.REPORTS_READ,
  ],
  STAFF: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_WRITE,
    PERMISSIONS.STOCK_WRITE,
    PERMISSIONS.QUOTES_READ,
  ],
  B2B_CUSTOMER: [],
  B2C_CUSTOMER: [],
};

/** Bu rol admin paneline erişebilir mi? */
export function isStaffRole(role: UserRole): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "STAFF";
}

/**
 * Yetki kontrolü: rol varsayılanı + kullanıcıya özel ek yetkiler.
 * @param role kullanıcının rolü
 * @param permission gereken yetki
 * @param extraPermissions DB'den gelen UserPermission anahtarları
 */
export function can(
  role: UserRole,
  permission: PermissionKey,
  extraPermissions: string[] = [],
): boolean {
  if (role === "SUPER_ADMIN") return true;
  return (
    ROLE_PERMISSIONS[role].includes(permission) ||
    extraPermissions.includes(permission)
  );
}
