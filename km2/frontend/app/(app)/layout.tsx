import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { FloatingAssistant } from "@/components/assistant/FloatingAssistant";
import { FarmProvider } from "@/lib/farm-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FarmProvider>
      <div className="flex min-h-screen bg-[#faf9f6]">
        <Sidebar />
        <div className="flex-1 pb-16 md:pb-0">
          <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">{children}</main>
        </div>
      </div>
      <MobileNav />
      <FloatingAssistant />
    </FarmProvider>
  );
}
