import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { ToastProvider } from "@/components/ui/toast";
import { getSession } from "@/lib/auth";
import { getNavMode, getSelectedCycle, listCycles } from "@/lib/cycle";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [cycles, selectedCycle, mode] = await Promise.all([
    listCycles(),
    getSelectedCycle(),
    getNavMode(),
  ]);

  return (
    <ToastProvider>
      <AppShell
        role={session.role}
        mode={mode}
        cycles={cycles}
        selectedCycleCode={selectedCycle?.code ?? ""}
        user={{ name: session.name, email: session.email }}
      >
        {children}
      </AppShell>
    </ToastProvider>
  );
}
