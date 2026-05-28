import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

const handler = NextAuth(authOptions)

export async function GET(req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) {
  return handler(req, { params: await ctx.params })
}

export async function POST(req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) {
  return handler(req, { params: await ctx.params })
}
