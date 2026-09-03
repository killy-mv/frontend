import { start as startSameSite } from './same-site.mjs'
import { start as startPartner } from './third-party.mjs'

// Two servers, one process, so `npm run api` is the only thing to remember.
startPartner()
startSameSite()

console.log('\nlog in with  ada@example.com / password\n')
