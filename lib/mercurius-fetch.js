const { fetch } = require('undici')

const get = require('lodash.get')

const getDirective = (astNode, fetchDirective) => {
  if (Array.isArray(astNode.directives) && astNode.directives.length > 0) {
    const directive = astNode.directives.find(
      (directive) => directive.name.value === fetchDirective
    )
    return directive
  }
  return null
}

const getArguments = (inputArguments) => {
  let args = {}
  inputArguments.forEach(({ name, value }) => {
    args = { ...args, [name.value]: value.value }
  })
  if (!args.url) throw Error('URL is required')

  return args
}

const wrapFields = async (schemaType, fetchDirective) => {
  if (typeof schemaType.getFields === 'function') {
    for (const [fieldName, field] of Object.entries(schemaType.getFields())) {
      if (
        typeof field.astNode !== 'undefined' &&
        typeof fieldName === 'string'
      ) {
        const fetchDirectiveASTForField = getDirective(
          field.astNode,
          fetchDirective
        )

        if (fetchDirectiveASTForField) {
          if (fetchDirective === 'fetch') {
            field.resolve = async (_, args, context) => {
              let { url, extractFromResponse } = getArguments(
                fetchDirectiveASTForField.arguments
              )
              for (const arg in args) {
                url = url.replace(`$${arg}`, args[arg])
              }
              const resp = await fetch(url, {
                ...(context.auth_token && {
                  headers: { authorization: context.auth_token }
                })
              })
              const response = await resp.json()
              const result = extractFromResponse
                ? get(response, extractFromResponse)
                : response
              return result
            }
          }
          if (fetchDirective === 'mutate') {
            field.resolve = async (_, args, context) => {
              const {
                url,
                extractFromResponse,
                method = 'POST'
              } = getArguments(fetchDirectiveASTForField.arguments)

              const resp = await fetch(url, {
                body: JSON.stringify(args.input || args),
                method,
                ...(context.auth_token && {
                  headers: {
                    'content-type': 'application/json',
                    authorization: context.auth_token
                  }
                })
              })
              const response = await resp.json()
              const result = extractFromResponse
                ? get(response, extractFromResponse)
                : response
              return result
            }
          }
        }
      }
    }
  }
}

const registerFetchHandler = async (schema) => {
  const schemaTypeMap = schema.getTypeMap()

  for (const schemaType of Object.values(schemaTypeMap)) {
    await wrapFields(schemaType, 'fetch')
  }
  for (const schemaType of Object.values(schemaTypeMap)) {
    await wrapFields(schemaType, 'mutate')
  }
}

module.exports.registerFetchHandler = registerFetchHandler
