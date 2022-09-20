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
const wrapFields = async (schemaType, fetchDirective) => {
  if (typeof schemaType.getFields === 'function') {
    for (const [fieldName, field] of Object.entries(schemaType.getFields())) {
      if (typeof field.astNode !== 'undefined' && typeof fieldName === 'string') {
        const fetchDirectiveASTForField = getDirective(
          field.astNode,
          fetchDirective
        )

        if (fetchDirectiveASTForField) {
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
      }
    }
  }
}

const registerFetchHandler = async (schema) => {
  const schemaTypeMap = schema.getTypeMap()

  for (const schemaType of Object.values(schemaTypeMap)) {
    wrapFields(schemaType, 'fetch')
  }
}

module.exports.registerFetchHandler = registerFetchHandler
