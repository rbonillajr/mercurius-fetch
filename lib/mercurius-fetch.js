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
            field.resolve = async (_, args) => {
              // TODO add method for get arguments into directive
              let url = fetchDirectiveASTForField.arguments[0].value.value
              const extractFromResponse =
                fetchDirectiveASTForField.arguments[1].value.value
              for (const arg in args) {
                url = url.replace(`$${arg}`, args[arg])
              }
              const resp = await fetch(url)
              const response = await resp.json()
              const result = get(response, extractFromResponse)
              return result
            }
          }
          if (fetchDirective === 'mutate') {
            field.resolve = async (_, args) => {
              console.log(fetchDirectiveASTForField.arguments)
              console.log(args)
              // TODO add method for get arguments into directive
              const url = fetchDirectiveASTForField.arguments[0].value.value
              const extractFromResponse =
                fetchDirectiveASTForField.arguments[1].value.value

              const resp = await fetch(url, { body: args, method: 'POST' })
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
