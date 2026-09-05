import { getCurrentUser } from "@/lib/auth";
import { getPriceView } from "@/lib/pricing-server";
import { db } from "@/lib/db";
import { CheckoutForm } from "./checkout-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Ödeme" };

export default async function CheckoutPage() {
  const [user, view] = await Promise.all([getCurrentUser(), getPriceView()]);

  // Girişli kullanıcının varsayılan adresi (varsa)
  let defaultAddress = null;
  if (user) {
    defaultAddress = await db.address.findFirst({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      select: { fullName: true, phone: true, city: true, district: true, addressLine: true },
    });
  }

  return (
    <div className="container-ak py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink">Ödeme</h1>
      <CheckoutForm
        isDealer={view.isDealer}
        loggedIn={!!user}
        defaults={{
          name: defaultAddress?.fullName ?? user?.name ?? "",
          phone: defaultAddress?.phone ?? user?.phone ?? "",
          city: defaultAddress?.city ?? "",
          district: defaultAddress?.district ?? "",
          address: defaultAddress?.addressLine ?? "",
        }}
      />
    </div>
  );
}
