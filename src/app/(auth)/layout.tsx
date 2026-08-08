import Link from "next/link";
import { Brand } from "@/components/shell/brand";
import { Marquee } from "@/components/motion/marquee";
import { ToastProvider } from "@/components/ui/toast";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col">
        <header className="border-ink flex items-center justify-between border-b px-6 py-4">
          <Link href="/">
            <Brand />
          </Link>
          <span className="label-xs text-ink-tertiary hidden sm:block">
            Est. 2025—26
          </span>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-md">{children}</div>
        </main>

        <footer className="border-ink border-t">
          <div className="label-xs text-ink-tertiary py-2">
            <Marquee>
              <span className="flex items-center gap-8">
                <span>BMS Institute of Technology and Management</span>
                <span className="text-primary">✳</span>
                <span>Yelahanka, Bengaluru 560119</span>
                <span className="text-primary">✳</span>
                <span>Department of Computer Science and Engineering</span>
                <span className="text-primary">✳</span>
                <span>Project Tracking &amp; Allocation</span>
                <span className="text-primary">✳</span>
              </span>
            </Marquee>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}
