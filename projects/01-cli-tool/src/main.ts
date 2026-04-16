import { parseArgs as parseArgsUtil } from "node:util";

type Config = {
  format: string;
  concurrency: number;
  timeout: number;
  output: string;
  verbose: boolean;
};

function parseArgs(): Config {
  const { values, positionals } = parseArgsUtil({
    args: process.argv.slice(2),
    options: {
      format: { type: "string", short: "f", default: "auto" },
      concurrency: { type: "string", short: "n", default: "3" },
      timeout: { type: "string", short: "t", default: "2000" },
      output: { type: "string", short: "o", default: "stdout" },
      verbose: { type: "boolean", short: "v", default: false },
    },
    allowPositionals: true,
  });

  const filePath = positionals[0];
  if (!filePath) {
    console.error("Usage: datapipe <file> [options]");
    process.exit(1);
  }

  const concurrency = Number(values.concurrency);
  const timeout = Number(values.timeout);

  return {
    format: values.format,
    concurrency: concurrency,
    timeout: timeout,
    output: values.output,
    verbose: values.verbose,
  };
}

async function main(): Promise<void> {
  const config: Config = parseArgs();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
