import assert from 'node:assert/strict'

const source = await (await import('node:fs/promises')).readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
assert.match(source, /dataMode==='real'/)
assert.match(source, /accepted_privacy_at/)
assert.match(source, /showNotifications&&session/)

const workflow = await (await import('node:fs/promises')).readFile(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8')
assert.match(workflow, /npm run build -- --base=\/campus-soul\//)
assert.match(workflow, /upload-pages-artifact@v3/)

const ttl = await (await import('node:fs/promises')).readFile(new URL('../supabase/migrations/202604010029_anonymous_session_ttl.sql', import.meta.url), 'utf8')
assert.match(ttl, /30 minutes/)

console.log('Smoke checks passed: data isolation, privacy gate, notifications, Pages workflow, anonymous session TTL')
