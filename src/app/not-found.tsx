import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-navy-dark px-4 text-center text-paper">
      <span className="text-6xl font-extrabold text-orange">404</span>
      <h1 className="mt-4 text-2xl font-bold">Sayfa bulunamadı</h1>
      <p className="mt-2 max-w-md text-mist/70">
        Aradığınız sayfa taşınmış veya kaldırılmış olabilir. Bu bölüm çok yakında
        hizmetinizde olacak.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-orange px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
        >
          <Home className="h-4 w-4" /> Ana Sayfa
        </Link>
        <Link
          href="/kategoriler"
          className="inline-flex items-center gap-2 rounded-lg border border-paper/25 px-6 py-3 font-semibold transition hover:border-orange"
        >
          <Search className="h-4 w-4" /> Kategoriler
        </Link>
      </div>
    </main>
  );
}
