const fp = require('fastify-plugin')
const { registerFetchHandler } = require('./lib/fetch')

const mercuriusFetch = fp(
  async (fastify) => {
    registerFetchHandler(fastify.graphql.schema)
  },
  {
    name: 'mercurius-fetch',
    fastify: '>=3.x',
    dependencies: ['mercurius']
  }
)

module.exports = mercuriusFetch
module.exports.mercuriusFetch = mercuriusFetch
module.exports.default =  mercuriusFetch
