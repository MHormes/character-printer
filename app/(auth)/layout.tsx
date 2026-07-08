export const dynamic = "force-dynamic"

import { AppFooter } from "@/components/footer"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 flex items-center justify-center py-10 px-4">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
