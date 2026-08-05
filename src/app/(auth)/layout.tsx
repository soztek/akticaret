import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-dark px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo variant="boxed" priority />
        </div>
        <div className="rounded-2xl bg-paper p-6 shadow-xl sm:p-8">{children}</div>
      </div>
    </div>
  );
}
