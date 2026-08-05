import type {
  BizimHesapAdapter,
  BHProduct,
  BHCategory,
  BHCustomer,
  BHConnectionStatus,
  BHOrderInput,
  BHOrderResult,
} from "./types";

// ============================================================
// MOCK ADAPTER — gerçek API olmadan geliştirme/entegrasyon testi için.
// Deterministik örnek veri üretir. BİZİM HESAP'ı taklit eder ama
// gerçek bir bağlantı KURMAZ (sahte "çalışan entegrasyon" iddiası yok;
// testConnection açıkça mock döndürür).
// ============================================================

const MOCK_CATEGORIES: BHCategory[] = [
  { id: "bh-cat-1", name: "Yapı Malzemeleri" },
  { id: "bh-cat-2", name: "Çimento", parentId: "bh-cat-1" },
  { id: "bh-cat-3", name: "Alçı", parentId: "bh-cat-1" },
  { id: "bh-cat-4", name: "Hırdavat" },
  { id: "bh-cat-5", name: "Vida", parentId: "bh-cat-4" },
  { id: "bh-cat-6", name: "El Aletleri" },
];

const MOCK_PRODUCTS: BHProduct[] = [
  {
    id: "bh-p-1001",
    sku: "CIM-425-50",
    barcode: "8690000000011",
    name: "Portland Çimento 42.5 - 50 kg",
    description: "Genel amaçlı yüksek dayanımlı portland çimento.",
    categoryId: "bh-cat-2",
    categoryName: "Çimento",
    brand: "AKÇANSA",
    purchasePrice: 140,
    salePrice: 179.9,
    vatRate: 20,
    stock: 320,
    unit: "torba",
    isActive: true,
  },
  {
    id: "bh-p-1002",
    sku: "ALC-SAT-25",
    barcode: "8690000000028",
    name: "Saten Alçı 25 kg",
    description: "İnce yüzey kaplama alçısı.",
    categoryId: "bh-cat-3",
    categoryName: "Alçı",
    brand: "LAFARGE",
    purchasePrice: 95,
    salePrice: 124.5,
    vatRate: 20,
    stock: 210,
    unit: "torba",
    isActive: true,
  },
  {
    id: "bh-p-1003",
    sku: "VDA-YHB-4x40",
    barcode: "8690000000035",
    name: "Yıldız Havşa Baş Vida 4x40 (100 adet)",
    description: "Galvaniz kaplama ahşap vidası.",
    categoryId: "bh-cat-5",
    categoryName: "Vida",
    brand: "GENERİK",
    purchasePrice: 28,
    salePrice: 39.9,
    vatRate: 20,
    stock: 1500,
    unit: "kutu",
    isActive: true,
  },
  {
    id: "bh-p-1004",
    sku: "EL-PENSE-180",
    barcode: "8690000000042",
    name: "Kombine Pense 180 mm",
    description: "İzoleli sap, krom vanadyum çelik.",
    categoryId: "bh-cat-6",
    categoryName: "El Aletleri",
    brand: "BOSCH",
    purchasePrice: 210,
    salePrice: 289,
    vatRate: 20,
    stock: 64,
    unit: "adet",
    isActive: true,
  },
];

export class MockBizimHesapAdapter implements BizimHesapAdapter {
  readonly mode = "mock" as const;

  async testConnection(): Promise<BHConnectionStatus> {
    return {
      connected: true,
      mode: "mock",
      message:
        "Mock modu aktif. Gerçek Bizim Hesap API'sine bağlı DEĞİL. Örnek veri kullanılıyor.",
    };
  }

  async listProducts(params?: { page?: number; pageSize?: number }) {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 100;
    const start = (page - 1) * pageSize;
    const items = MOCK_PRODUCTS.slice(start, start + pageSize);
    return { items, hasMore: start + pageSize < MOCK_PRODUCTS.length };
  }

  async listCategories(): Promise<BHCategory[]> {
    return MOCK_CATEGORIES;
  }

  async getStockLevels() {
    return MOCK_PRODUCTS.map((p) => ({
      bizimHesapProductId: p.id,
      stock: p.stock,
    }));
  }

  async getPrices() {
    return MOCK_PRODUCTS.map((p) => ({
      bizimHesapProductId: p.id,
      salePrice: p.salePrice,
      purchasePrice: p.purchasePrice,
    }));
  }

  async getCustomer(id: string): Promise<BHCustomer | null> {
    return {
      id,
      name: "Örnek Bayi Ltd. Şti.",
      taxNumber: "1234567890",
      taxOffice: "Merkez",
      balance: -1250.75,
    };
  }

  async createOrder(order: BHOrderInput): Promise<BHOrderResult> {
    return { bizimHesapOrderId: `bh-mock-order-${order.websiteOrderId}` };
  }
}
