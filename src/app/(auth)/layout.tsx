import Link from "next/link";
import { Brand } from "@/components/shell/brand";
import { ToastProvider } from "@/components/ui/toast";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <ToastProvider>
      <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="mb-8 rounded-lg">
          <Brand size="lg" />
        </Link>
        <div className="w-full max-w-sm">{children}</div>
        <p className="text-ink-tertiary mt-8 text-center text-xs">
          BMS Institute of Technology and Management · Yelahanka, Bengaluru
        </p>
      </main>
    </ToastProvider>
  );
}
