import { parseArgs as parseArgsUtil } from "node:util";
import { parseFile } from "./parse.js";
import { validateSensorReading } from "./validate.js";
import { enrichReading, pool } from "./enrich.js";
import { generateReport } from "./report.js";

type Config = {
  filePath: string;
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
    throw new Error("Usage: datapipe <file> [options]");
  }
  const concurrency = Number(values.concurrency);
  const timeout = Number(values.timeout);

  // if (!(values.format in ["csv", "json"])) {
  //   throw new Error("--format must be 'csv' or 'json'");
  // }

  return {
    filePath: filePath,
    format: values.format,
    concurrency: concurrency,
    timeout: timeout,
    output: values.output,
    verbose: values.verbose,
  };
}

async function main(): Promise<void> {
  try {
    const config: Config = parseArgs();
    const fileContent: object[] = await parseFile(config.filePath, config.format);
    const sensorReadings = fileContent.map(validateSensorReading);
    const validSensorReadings = sensorReadings.filter((r) => r.ok).map((r) => r.value);
    const enrichResults = await pool(validSensorReadings, config.concurrency, enrichReading);
    const report = generateReport(config.filePath, sensorReadings, enrichResults);
    console.log(report);
  } catch (err) {
    if (err instanceof Error) {
      console.log(`Error: ${err.message}`);
      if (err.cause instanceof Error) {
        console.log(`Caused by: ${err.cause.name}: ${err.cause.message}`);
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
