import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"

async function loginAction() {
  "use server"
  redirect("/characters")
}

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center gap-6 rounded-xl border border-border bg-card p-10 shadow-sm">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Character Printer</h1>
        <p className="text-sm text-muted-foreground">Sign in to manage your characters</p>
      </div>
      <form action={loginAction} className="w-full">
        <Button type="submit" className="w-full" size="lg">
          Login
        </Button>
      </form>
    </div>
  )
}
