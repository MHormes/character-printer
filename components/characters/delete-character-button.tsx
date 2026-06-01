"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Props = {
  charId: string;
  charName?: string;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function DeleteCharacterButton({ charId, charName, deleteAction }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    const fd = new FormData();
    fd.set("id", charId);
    startTransition(() => deleteAction(fd));
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        type="button"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-3.5 text-primary-foreground/70" />
      </Button>
      <ConfirmDialog
        open={open}
        title="Delete Character"
        description={
          charName
            ? `"${charName}" will be permanently deleted.`
            : "This character will be permanently deleted."
        }
        confirmLabel={pending ? "Deleting…" : "Delete"}
        pending={pending}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
