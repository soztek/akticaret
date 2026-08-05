import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { MobileNav } from "@/components/shop/mobile-nav";
import { WhatsAppFloat } from "@/components/shop/whatsapp-float";

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col bg-mist">
      <Header />
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <Footer />
      <MobileNav />
      <WhatsAppFloat />
    </div>
  );
}
