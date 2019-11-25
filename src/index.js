var glob = require("glob");
const to_vfile = require("to-vfile");
const report = require("vfile-reporter");
const unified = require("unified");
const markdownParse = require("remark-parse");
const markdownStringify = require("remark-stringify");

const validate = require("./graphql");

const yargs = require("yargs");

const options = yargs
  .usage("Usage: -f <files> -s <schema>")
  .option("f", {
    alias: "files",
    describe: "Files name in glob patter **/*.md",
    type: "string",
    demandOption: true
  })
  .option("s", {
    alias: "schema",
    describe: "File path were gql schema is specified",
    type: "string",
    demandOption: true
  }).argv;

var parser = unified()
  .use(markdownParse)
  .use(validate, { schemaPath: options.schema })
  .use(markdownStringify);

glob(options.files, function(er, files) {
  if (er) {
    console.log("Error finding files");
    process.exit(1);
  }
  if (files.length == 0) {
    console.log("No files matching glob pattern");
    process.exit(1);
  }
  var returnErrorCode = 0;
  files.forEach(file => {
    parser.process(to_vfile.readSync(file), (err, file) => {
      console.error(report(err || file));
      if (file.messages.length != 0) {
        returnErrorCode = 1;
      }
    });
  });
  process.exit(returnErrorCode);
});
