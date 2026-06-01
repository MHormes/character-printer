"use server"

import { randomUUID } from "crypto"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { dbCanvasTemplates } from "@/lib/db/tables"
import type { CanvasTemplate, CanvasTemplateWidget } from "@/lib/types/canvas"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any

type CreateCanvasTemplateInput = {
  name: string
  cols: number
  widgets: CanvasTemplateWidget[]
}

export async function listCanvasTemplates(userId: string): Promise<CanvasTemplate[]> {
  return anyDb
    .select({
      id: dbCanvasTemplates.id,
      userId: dbCanvasTemplates.userId,
      name: dbCanvasTemplates.name,
      cols: dbCanvasTemplates.cols,
      widgets: dbCanvasTemplates.widgets,
      createdAt: dbCanvasTemplates.createdAt,
      updatedAt: dbCanvasTemplates.updatedAt,
    })
    .from(dbCanvasTemplates)
    .where(eq(dbCanvasTemplates.userId, userId))
    .orderBy(desc(dbCanvasTemplates.updatedAt))
}

export async function createCanvasTemplate(
  userId: string,
  input: CreateCanvasTemplateInput,
): Promise<CanvasTemplate> {
  const name = input.name.trim()
  if (!name) {
    throw new Error("Template name is required.")
  }

  const existing = await anyDb
    .select({ id: dbCanvasTemplates.id })
    .from(dbCanvasTemplates)
    .where(and(
      eq(dbCanvasTemplates.userId, userId),
      eq(dbCanvasTemplates.name, name),
    ))
    .limit(1)

  if (existing[0]) {
    throw new Error("A template with that name already exists.")
  }

  const id = randomUUID()
  await anyDb.insert(dbCanvasTemplates).values({
    id,
    userId,
    name,
    cols: input.cols,
    widgets: input.widgets,
  })

  const rows = await anyDb
    .select({
      id: dbCanvasTemplates.id,
      userId: dbCanvasTemplates.userId,
      name: dbCanvasTemplates.name,
      cols: dbCanvasTemplates.cols,
      widgets: dbCanvasTemplates.widgets,
      createdAt: dbCanvasTemplates.createdAt,
      updatedAt: dbCanvasTemplates.updatedAt,
    })
    .from(dbCanvasTemplates)
    .where(eq(dbCanvasTemplates.id, id))
    .limit(1)

  return rows[0]
}

export async function deleteCanvasTemplate(userId: string, templateId: string): Promise<void> {
  await anyDb
    .delete(dbCanvasTemplates)
    .where(and(
      eq(dbCanvasTemplates.id, templateId),
      eq(dbCanvasTemplates.userId, userId),
    ))
}
