import { cors } from 'hono/cors'

const ALLOWED_ORIGINS = [
  'https://pubg.risker.co.kr',
  'http://localhost:3000',
  'http://localhost:8080',
]

export const corsMiddleware = cors({
  origin: (origin) => (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]!),
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
})
