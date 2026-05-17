import { createHmac } from 'crypto'

export function generateToken(password: string): string {
  const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return createHmac('sha256', password).update(date).digest('hex')
}

export function verifyToken(token: string, password: string): boolean {
  // Accept today's and yesterday's token (timezone edge cases)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const todayToken = generateToken(password)
  const yestDate = yesterday.toISOString().slice(0, 10)
  const yestToken = createHmac('sha256', password).update(yestDate).digest('hex')
  return token === todayToken || token === yestToken
}
