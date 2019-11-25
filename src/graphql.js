const visit = require("unist-util-visit");
const graphql = require("graphql");
const fs = require("fs");

module.exports = attacher;

function attacher(opts = {}) {
  const { schemaPath } = opts;
  if (!schemaPath) {
    throw new Error("Missing required field `schemaPath` in config");
  }
  const schema = graphql.buildSchema(fs.readFileSync(schemaPath).toString());
  return transformer;

  function transformer(ast, file) {
    visit(ast, "code", visitor);
    function visitor(node) {
      if (node.lang !== "gql" && node.lang !== "graphql") {
        return;
      }

      const query = node.value;

      try {
        const parsed = graphql.parse(query);

        const validationErrors = graphql.validate(schema, parsed);

        if (validationErrors.length) {
          validationErrors.forEach(error => {
            // TODO: check that it's a GraphQLError
            var location = node;
            if (
              error.locations &&
              error.locations[0] &&
              error.locations[0].line
            ) {
              location = {
                line: node.position.start.line + error.locations[0].line,
                column: error.locations[0].column
              };
            }
            file.message(error.message, location);
          });
        }
      } catch (err) {
        console.error("Unexpected error parsing query", err);
        throw err;
      }
    }
  }
}
