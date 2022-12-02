'use strict'

const Fastify = require('fastify')
const mercurius = require('mercurius')
const mercuriusFetch = require('..')

const app = Fastify({
  logger: true
})

const schema = `
  directive @fetch(
    url: String!
    extractFromResponse: String
  ) on OBJECT | FIELD_DEFINITION

  type Response {
    id: Int
    code: String
    name: String
  }

  type Query {
    info(user:String): [Response] @fetch(url:"http://localhost:3000/info/$user", extractFromResponse:"data")
  }`

app.register(mercurius, {
  schema
})

app.get('/info/:user', async function (req, rep) {
  return { data: [{ id: 2, code: 'code', name: req.params.user }] }
})

app.register(mercuriusFetch)

app.listen(3000)
