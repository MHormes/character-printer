"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LogoutButton({ variant = "ghost", size = "sm", className }: { variant?: "ghost" | "secondary"; size?: "sm" | "xs"; className?: string }) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => signOut({ callbackUrl: "/login" })}
      title="Sign out"
    >
      <LogOut className="size-3.5" />
      Sign out
    </Button>
  )
}
