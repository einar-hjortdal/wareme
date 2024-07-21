import Elysia from 'elysia'

new Elysia()
  .get('*', () => Bun.file('public/index.html'))
  .get('/browser.js', () => Bun.file('build/browser.js'))
  .on('start', () => console.log('Running on port 8420'))
  .listen(8420)
