import { type DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
    accessTokenExpired?: number
    refreshTokenExpired?: number
    error?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    accessTokenExpired?: number
    refreshTokenExpired?: number
    error?: string
    user?: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}