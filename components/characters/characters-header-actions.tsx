"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Shield, BookOpen, Settings } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { NewCharacterDialog } from "@/components/characters/new-character-dialog";
import { LogoutButton } from "@/components/auth/logout-button";

type Props = {
  isAdmin: boolean;
  createAction: (formData: FormData) => Promise<void>;
  startTourAction: () => Promise<void>;
};

export function CharactersHeaderActions({ isAdmin, createAction, startTourAction }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative">
      <div className="hidden md:flex items-center gap-2">
        {isAdmin && (
          <Link
            href="/admin/users"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <Shield className="size-3.5" />
            Admin
          </Link>
        )}
        <NewCharacterDialog createAction={createAction} size="sm" />
        <form action={startTourAction}>
          <button
            type="submit"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
            aria-label="Start guide"
          >
            <BookOpen className="size-3.5" />
            Guide
          </button>
        </form>
        <Link
          href="/settings"
          className={buttonVariants({ variant: "secondary", size: "icon-sm" })}
          aria-label="Settings"
        >
          <Settings className="size-3.5" />
        </Link>
        <LogoutButton variant="secondary" />
      </div>

      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="md:hidden shrink-0 text-primary-foreground/80 hover:text-primary-foreground transition-colors"
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {menuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[60px] z-50">
          <div className="fixed inset-0 -z-10" onClick={() => setMenuOpen(false)} />
          <div className="bg-section border-b border-border shadow-lg px-4 py-3 flex flex-col gap-2">
            {isAdmin && (
              <Link
                href="/admin/users"
                className={buttonVariants({ variant: "secondary", size: "sm", className: "w-full" })}
                onClick={() => setMenuOpen(false)}
              >
                <Shield className="size-3.5" />
                Admin
              </Link>
            )}
            <NewCharacterDialog createAction={createAction} size="sm" className="w-full" />
            <Link
              href="/settings"
              className={buttonVariants({ variant: "secondary", size: "sm", className: "w-full" })}
              onClick={() => setMenuOpen(false)}
            >
              <Settings className="size-3.5" />
              Settings
            </Link>
            <LogoutButton variant="secondary" className="w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
