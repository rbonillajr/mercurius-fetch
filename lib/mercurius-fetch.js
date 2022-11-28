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

const defaultArguments = {
  extractFromResponse: 'data',
}

const getArguments = (arguments) => {
  let args = defaultArguments
  if (arguments.length < 1) return {}
  arguments.forEach(({ name, value }) => {
    args = { ...args, [name.value]: value.value }
  })

  return args
}

const wrapFields = async (schemaType, fetchDirective = 'fetch') => {
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
              const { url, extractFromResponse } = getArguments(
                fetchDirectiveASTForField.arguments
              )
              for (const arg in args) {
                url = url.replace(`$${arg}`, args[arg])
              }
              const resp = await fetch(url, {
                ...(context.token && {
                  headers: { authorization: `Bearer ${context.token}` },
                }),
              })
              const response = await resp.json()
              const result = get(response, extractFromResponse)
              return result
            }
          }
          if (fetchDirective === 'mutate') {
            field.resolve = async (_, args, context) => {
              const {
                url,
                extractFromResponse,
                method = 'POST',
              } = getArguments(fetchDirectiveASTForField.arguments)

              const resp = await fetch(url, {
                body: args,
                method,
                ...(context.token && {
                  headers: { authorization: `Bearer ${context.token}` },
                }),
              })
              const response = await resp.json()
              const result = get(response, extractFromResponse)
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
