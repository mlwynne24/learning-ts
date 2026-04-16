import {
  parseArgs,
  ParseArgsConfig,
  ParseArgsOptionDescriptor,
  ParseArgsOptionsConfig,
} from "node:util";

const options = {
  format: {
    type: "string",
    short: "f",
    default: "csv",
  },
  concurrency: {
    type: "number",
    short: "n",
    default: 3,
  },
  timeout: {
    type: "number",
    short: "t",
    default: 2000,
  },
  output: {
    type: "string",
    short: "o",
    default: "stdout",
  },
  verbose: {
    type: "boolean",
    short: "v",
    default: false,
  },
};

function parseAndLog(args: ParseArgsConfig, options: ParseArgsOptionsConfig) {
  console.log("---");
  try {
    console.log("args:", args);
    const { values, positionals } = parseArgs({ args, options });
    console.log(values, positionals);
  } catch (e) {
    console.error(e);
  }
}
