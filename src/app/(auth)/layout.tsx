import Link from "next/link";
import { Brand } from "@/components/shell/brand";
import { ToastProvider } from "@/components/ui/toast";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col px-3 pb-3 sm:px-5 sm:pb-5">
        <header className="pt-3 sm:pt-5">
          <div className="bg-surface-raised shadow-card flex h-16 items-center justify-between gap-4 rounded-full px-5 sm:px-6">
            <Link href="/">
              <Brand />
            </Link>
            <span className="label-xs text-ink-tertiary hidden sm:block">
              Est. 2025—26
            </span>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-10">
          <div className="bg-surface-raised shadow-card w-full max-w-md rounded-2xl px-8 py-10">
            {children}
          </div>
        </main>

        <footer className="text-ink-tertiary flex flex-wrap justify-between gap-3 px-6 py-4 text-sm">
          <span>BMS Institute of Technology and Management</span>
          <span className="hidden sm:block">Yelahanka, Bengaluru 560119</span>
        </footer>
      </div>
    </ToastProvider>
  );
}
