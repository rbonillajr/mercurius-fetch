'use strict'

const http = require('http')
const { test } = require('tap')
const Fastify = require('fastify')
const mercurius = require('mercurius')
const mercuriusFetch = require('..')

const mockedData = { id: 1, code: 'code', name: 'name' }
const mockedRestResponse = {
  data: mockedData,
}

const expectedMutationResponse = {
  data: { addInfo: mockedData },
}

test('mutations - should return the api response successful with params', async (t) => {
  t.plan(2)

  const app = Fastify()
  const user = 'user1'
  const server = http.createServer((req, res) => {
    t.equal('/user1', req.url)

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(mockedRestResponse))
  })
  t.teardown(async () => {
    await app.close()
    await server.close()
  })

  server.listen()

  const schema = `
    schema {
      query: Query
      mutation: Mutation
    }
    
    directive @mutate(
      url: String!
      extractFromResponse: String
    ) on OBJECT | FIELD_DEFINITION

    type Response {
      id: Int
      code: String
      name: String
    }
  
    type Query {
      _dummy: String
    }
 
    type Mutation {
      addInfo(user: String, date: String): Response @mutate(url:"http://localhost:${
        server.address().port
      }/user1", extractFromResponse:"data")
    }`

  app.register(mercurius, {
    schema,
  })
  app.register(mercuriusFetch)

  const query = `mutation {
    addInfo(user:"${user}", date:"${new Date()}") {
      id
      code
      name
    }
  }`

  const response = await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    payload: JSON.stringify({ query }),
  })

  t.same(JSON.parse(response.body), expectedMutationResponse)
})

test('mutations - should return without extracting a custom response', async (t) => {
  t.plan(2)

  const app = Fastify()
  const user = 'user1'
  const server = http.createServer((req, res) => {
    t.equal('/user1', req.url)

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(mockedData))
  })
  t.teardown(async () => {
    await app.close()
    await server.close()
  })

  server.listen()

  const schema = `
    schema {
      query: Query
      mutation: Mutation
    }
    
    directive @mutate(
      url: String!
      extractFromResponse: String
    ) on OBJECT | FIELD_DEFINITION

    type Response {
      id: Int
      code: String
      name: String
    }
  
    type Query {
      _dummy: String
    }
 
    type Mutation {
      addInfo(user: String, date: String): Response @mutate(url:"http://localhost:${
        server.address().port
      }/user1")
    }`

  app.register(mercurius, {
    schema,
  })
  app.register(mercuriusFetch)

  const query = `mutation {
    addInfo(user:"${user}", date:"${new Date()}") {
      id
      code
      name
    }
  }`

  const response = await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    payload: JSON.stringify({ query }),
  })

  t.same(JSON.parse(response.body), expectedMutationResponse)
})

test('mutations - should return with a different rest method', async (t) => {
  t.plan(2)

  const app = Fastify()
  const user = 'user1'
  const server = http.createServer((req, res) => {
    t.equal('/user1', req.url)

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(mockedData))
  })
  t.teardown(async () => {
    await app.close()
    await server.close()
  })

  server.listen()

  const schema = `
    schema {
      query: Query
      mutation: Mutation
    }
    
    directive @mutate(
      url: String!
      extractFromResponse: String
      method: String
    ) on OBJECT | FIELD_DEFINITION

    type Response {
      id: Int
      code: String
      name: String
    }
  
    type Query {
      _dummy: String
    }
 
    type Mutation {
      addInfo(user: String, date: String): Response @mutate(url: "http://localhost:${
        server.address().port
      }/user1", method: "PUT")
    }`

  app.register(mercurius, {
    schema,
  })
  app.register(mercuriusFetch)

  const query = `mutation {
    addInfo(user:"${user}", date:"${new Date()}") {
      id
      code
      name
    }
  }`

  const response = await app.inject({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: '/graphql',
    payload: JSON.stringify({ query }),
  })

  t.same(JSON.parse(response.body), expectedMutationResponse)
})

test('mutations - should use the token in the context if present', async (t) => {
  t.plan(3)

  const app = Fastify()
  const user = 'user1'
  const server = http.createServer((req, res) => {
    t.equal('/user1', req.url)

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
    schema {
      query: Query
      mutation: Mutation
    }
    
    directive @mutate(
      url: String!
      extractFromResponse: String
    ) on OBJECT | FIELD_DEFINITION

    type Response {
      id: Int
      code: String
      name: String
    }
  
    type Query {
      _dummy: String
    }
 
    type Mutation {
      addInfo(user: String, date: String): Response @mutate(url:"http://localhost:${
        server.address().port
      }/user1", extractFromResponse:"data")
    }`

  app.register(mercurius, {
    schema,
    context: (request, reply) => {
      return { token: request.headers?.authorization }
    },
  })
  app.register(mercuriusFetch)

  const query = `mutation {
    addInfo(user:"${user}", date:"${new Date()}") {
      id
      code
      name
    }
  }`

  const response = await app.inject({
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer secretotken',
    },
    url: '/graphql',
    payload: JSON.stringify({ query }),
  })

  t.same(JSON.parse(response.body), expectedMutationResponse)
})
