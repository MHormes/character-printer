"use server"

import { randomUUID } from "crypto"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { sqliteCanvasTemplates } from "@/lib/db/schema"
import type { CanvasTemplate, CanvasTemplateWidget } from "@/lib/types/canvas"

const anyDb = db as any

type CreateCanvasTemplateInput = {
  name: string
  cols: number
  widgets: CanvasTemplateWidget[]
}

export async function listCanvasTemplates(userId: string): Promise<CanvasTemplate[]> {
  return anyDb
    .select({
      id: sqliteCanvasTemplates.id,
      userId: sqliteCanvasTemplates.userId,
      name: sqliteCanvasTemplates.name,
      cols: sqliteCanvasTemplates.cols,
      widgets: sqliteCanvasTemplates.widgets,
      createdAt: sqliteCanvasTemplates.createdAt,
      updatedAt: sqliteCanvasTemplates.updatedAt,
    })
    .from(sqliteCanvasTemplates)
    .where(eq(sqliteCanvasTemplates.userId, userId))
    .orderBy(desc(sqliteCanvasTemplates.updatedAt))
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
    .select({ id: sqliteCanvasTemplates.id })
    .from(sqliteCanvasTemplates)
    .where(and(
      eq(sqliteCanvasTemplates.userId, userId),
      eq(sqliteCanvasTemplates.name, name),
    ))
    .limit(1)

  if (existing[0]) {
    throw new Error("A template with that name already exists.")
  }

  const id = randomUUID()
  await anyDb.insert(sqliteCanvasTemplates).values({
    id,
    userId,
    name,
    cols: input.cols,
    widgets: input.widgets,
  })

  const rows = await anyDb
    .select({
      id: sqliteCanvasTemplates.id,
      userId: sqliteCanvasTemplates.userId,
      name: sqliteCanvasTemplates.name,
      cols: sqliteCanvasTemplates.cols,
      widgets: sqliteCanvasTemplates.widgets,
      createdAt: sqliteCanvasTemplates.createdAt,
      updatedAt: sqliteCanvasTemplates.updatedAt,
    })
    .from(sqliteCanvasTemplates)
    .where(eq(sqliteCanvasTemplates.id, id))
    .limit(1)

  return rows[0]
}

export async function deleteCanvasTemplate(userId: string, templateId: string): Promise<void> {
  await anyDb
    .delete(sqliteCanvasTemplates)
    .where(and(
      eq(sqliteCanvasTemplates.id, templateId),
      eq(sqliteCanvasTemplates.userId, userId),
    ))
}
