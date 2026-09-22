import assert from 'node:assert/strict'

const read = async path => (await import('node:fs/promises')).readFile(new URL(path, import.meta.url), 'utf8')

const appContext = await read('../src/context/AppProvider.tsx')
assert.match(appContext, /accepted_privacy_at/)
assert.match(appContext, /matchId/)

const discovery = await read('../src/routes/Discovery.tsx')
assert.match(discovery, /dataMode==='real'/)

const messages = await read('../src/routes/Messages.tsx')
assert.match(messages, /initialMatchId/)

const app = await read('../src/App.tsx')
assert.match(app, /showNotifications && session/)
assert.match(app, /HashRouter/)
assert.doesNotMatch(app, /history\.pushState/)

const workflow = await read('../.github/workflows/deploy-pages.yml')
assert.match(workflow, /npm run build -- --base=\/campus-soul\//)
assert.match(workflow, /upload-pages-artifact@v3/)

const ttl = await read('../supabase/migrations/202604010029_anonymous_session_ttl.sql')
assert.match(ttl, /30 minutes/)

console.log('Smoke checks: router migration, data isolation, privacy gate, notifications, Pages workflow, anonymous session TTL')
