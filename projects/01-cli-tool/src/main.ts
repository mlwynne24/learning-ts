import { parseArgs as parseArgsUtil } from "node:util";
import { parseFile } from "./parse.js";
import { validateSensorReading } from "./validate.js";
import { enrichReading, pool } from "./enrich.js";
import { generateReport } from "./report.js";
import { write, writeFile, writeFileSync } from "node:fs";

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
  const validFormats = ["csv", "json", "auto"];
  if (!validFormats.includes(values.format!)) {
    throw new Error(`--format must be one of: ${validFormats.join(", ")}`);
  }
  const validOutputs = ["stdout", "file"];
  if (!validOutputs.includes(values.output)) {
    throw new Error(`--output must be one of: ${validOutputs.join(", ")}`);
  }

  return {
    filePath: filePath,
    format: values.format,
    concurrency: concurrency,
    timeout: timeout,
    output: values.output,
    verbose: values.verbose,
  };
}

async function main(): Promise<string | void> {
  try {
    const config: Config = parseArgs();
    const fileContent: object[] = await parseFile(config.filePath, config.format);
    const sensorReadings = fileContent.map(validateSensorReading);
    const validSensorReadings = sensorReadings.filter((r) => r.ok).map((r) => r.value);
    const enrichResults = await pool(validSensorReadings, config.concurrency, (reading) =>
      enrichReading(reading, config.timeout),
    );
    const report = generateReport(config.filePath, sensorReadings, enrichResults);
    switch (config.output) {
      case "stdout":
        return report;
      case "file":
        writeFileSync(`./outputs/${Date.now()}.txt`, report);
    }
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
