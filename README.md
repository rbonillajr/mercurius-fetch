# mercurius-fetch

Mercurius fetch is Plugin for adds fetch to a rest api directly on query or properties of query.

[Undici](https://github.com/nodejs/undici) fetch is being used for requests to rest apis. 

Define the fetch directive in the queries or in properties of the query to consume apis without using a resolver

## Requiriment
Use nodejs >= 16.x

## Install

```bash
npm i fastify mercurius mercurius-fetch
```

## Quick Start

```js
const Fastify = require('fastify')
const mercurius = require('mercurius')
const mercuriusFetch = require('mercurius-fetch')

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
  return { data: [{ id: 1, code: 'code', name: 'name' }] }
})

app.register(mercuriusFetch)

app.listen(3000)
```

## License

MIT
