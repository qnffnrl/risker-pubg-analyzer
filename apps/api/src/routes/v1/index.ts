import { Hono } from 'hono'
import { players } from './players.js'
import { jobs } from './jobs.js'
import { compare } from './compare.js'

const v1 = new Hono()

v1.get('/', (c) => c.json({ version: 'v1', service: 'risker-pubg-analyzer' }))

v1.route('/players', players)
v1.route('/jobs', jobs)
v1.route('/compare', compare)

export { v1 }
