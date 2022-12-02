'use strict'

const http = require('http')
const { test } = require('tap')
const Fastify = require('fastify')
const mercurius = require('mercurius')
const mercuriusFetch = require('..')

const mockedData = [{ id: 1, code: 'code', name: 'name' }]
const mockedDataOnProperty = [{ id: 1, code: 'code', name: 'name-mock' }]
const mockedRestResponse = {
  data: mockedData
}

const expectedQueryResponse = {
  data: { info: mockedData }
}

const expectedQueryResponseOnProperty = {
  data: { info: mockedDataOnProperty }
}

test('basic - should return the api response successful', async (t) => {
  t.plan(1)

  const app = Fastify()

  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(mockedRestResponse))
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

  t.same(JSON.parse(response.body), expectedQueryResponse)
})

test('basic - should return the api response successful with params', async (t) => {
  t.plan(2)

  const app = Fastify()
  const user = 'user1'
  const server = http.createServer((req, res) => {
    t.equal(`/${user}`, req.url)

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(mockedRestResponse))
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
    info(user: String, date: String): [Response] @fetch(url:"http://localhost:${
      server.address().port
    }/$user", extractFromResponse:"data")
  }`

  app.register(mercurius, {
    schema
  })
  app.register(mercuriusFetch)

  const query = `query{
    info(user:"${user}") {
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

  t.same(JSON.parse(response.body), expectedQueryResponse)
})

test('basic - should return the api response into specific property', async (t) => {
  t.plan(1)

  const app = Fastify()

  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ data: 'name-mock' }))
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
    name: String @fetch(url:"http://localhost:${
      server.address().port
    }", extractFromResponse:"data")
  }

  type Query {
    info: [Response]
  }`

  const resolvers = {
    Query: {
      info: async () => {
        return [
          {
            id: 1,
            code: 'code'
          }
        ]
      }
    }
  }

  app.register(mercurius, {
    schema,
    resolvers
  })
  app.register(mercuriusFetch)

  const query = `query{
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

  t.same(JSON.parse(response.body), expectedQueryResponseOnProperty)
})

test('basic - should return without extracting a custom response', async (t) => {
  t.plan(2)

  const app = Fastify()
  const user = 'user1'
  const server = http.createServer((req, res) => {
    t.equal(`/${user}`, req.url)

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(mockedData))
  })
  t.teardown(async () => {
    await app.close()
    await server.close()
  })

  server.listen()

  const schema = `
  directive @fetch(
    url: String!
  ) on OBJECT | FIELD_DEFINITION

  type Response {
    id: Int
    code: String
    name: String
  }

  type Query {
    info(user: String, date: String): [Response] @fetch(url:"http://localhost:${
      server.address().port
    }/$user")
  }`

  app.register(mercurius, {
    schema
  })
  app.register(mercuriusFetch)

  const query = `query{
    info(user:"${user}") {
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

  t.same(response.body, JSON.stringify(expectedQueryResponse))
})

test('basic - should return data without directive', async (t) => {
  t.plan(1)

  const app = Fastify()
  t.teardown(app.close.bind(app))

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
    info: [Response]
  }`

  const resolvers = {
    Query: {
      info: async () => {
        return [
          {
            id: 1,
            code: 'code',
            name: 'name'
          }
        ]
      }
    }
  }

  app.register(mercurius, {
    schema,
    resolvers
  })
  app.register(mercuriusFetch)

  const query = `query{
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
  t.same(JSON.parse(response.body).data.info.length, 1)
})

test('basic - should use the token in the context if present', async (t) => {
  t.plan(2)

  const app = Fastify()

  const server = http.createServer((req, res) => {
    t.equal(req.headers.authorization, 'Bearer secretotken')
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('authorization', req.headers.authorization)
    res.end(JSON.stringify(mockedRestResponse))
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
    schema,
    context: (request, reply) => {
      return { auth_token: request.headers?.authorization }
    }
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
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer secretotken'
    },
    url: '/graphql',
    payload: JSON.stringify({ query })
  })

  t.same(JSON.parse(response.body), expectedQueryResponse)
})
