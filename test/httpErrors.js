'use strict'

const http = require('http')
const { test } = require('tap')
const Fastify = require('fastify')
const mercurius = require('mercurius')
const mercuriusFetch = require('..')

test('basic - should return error 302', async (t) => {
  t.plan(1)

  const app = Fastify()

  const server = http.createServer((req, res) => {
    res.statusCode = 302
    res.end()
  })
  t.teardown(async () => {
    await app.close()
    await server.close()
  })

  server.listen()

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
      info: [Response] @fetch(url:"http://localhost:${
        server.address().port
      }", extractFromResponse:"data")
    }`

  app.register(mercurius, {
    schema
  })
  app.register(mercuriusFetch)

  const query = `query {
      info {
        id
        code
        name
      }
    }`

  const response = await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    payload: JSON.stringify({ query })
  })

  t.same(JSON.parse(response.body).errors.length > 0, true)
})

test('basic - should fail without a url', async (t) => {
  t.plan(2)

  const app = Fastify()

  const server = http.createServer((req, res) => {
    res.statusCode = 302
    res.end()
  })
  t.teardown(async () => {
    await app.close()
    await server.close()
  })

  server.listen()

  const schema = `
    directive @fetch(
      extractFromResponse: String
    ) on OBJECT | FIELD_DEFINITION
  
    type Response {
      id: Int
      code: String
      name: String
    }
  
    type Query {
      info: [Response] @fetch(extractFromResponse:"data")
    }`

  app.register(mercurius, {
    schema
  })
  app.register(mercuriusFetch)

  const query = `query {
      info {
        id
        code
        name
      }
    }`

  const response = await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    payload: JSON.stringify({ query })
  })

  t.same(JSON.parse(response.body).errors.length > 0, true)
  t.same(JSON.parse(response.body).errors[0].message, 'URL is required')
})
