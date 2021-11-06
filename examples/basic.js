'use strict'

const Fastify = require('fastify')
const mercurius = require('mercurius')
const mercuriusFetch = require('..')

const app = Fastify({
    logger: true
})

const schema = `
  directive @fetch(
    url: String
    extractFromResponse: String
  ) on OBJECT | FIELD_DEFINITION

  type Response {
    id: Int
    code: String
    name: String
  }

  type Query {
    info: [Response] @fetch(url:"http://localhost:3000/info", extractFromResponse:"data")
  }`

app.register(mercurius, {
  schema
})

app.get('/info', async function () {
    return { data: [{ id: 1, code: 'code', name: 'name' }]};
});
  
app.register(mercuriusFetch)


app.listen(3000)
