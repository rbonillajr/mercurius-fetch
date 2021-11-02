const { request } = require('undici')
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
      if (typeof field.astNode !== 'undefined') {
        const fetchDirectiveASTForField = getDirective(
          field.astNode,
          fetchDirective
        )

        if (fetchDirectiveASTForField !== null) {
          // TODO add method for get arguments into directive
          let url = fetchDirectiveASTForField.arguments[0].value.value
          const extractFromResponse =
            fetchDirectiveASTForField.arguments[1].value.value

          field.resolve = async (parent, args) => {
            for (const arg in args) {
              url = url.replace(`$${arg}`, args[arg])
            }
            const { body } = await request(url)
            let response = ''
            for await (const chunk of body) {
              response += String(chunk)
            }
            const result = get(JSON.parse(response), extractFromResponse)
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
