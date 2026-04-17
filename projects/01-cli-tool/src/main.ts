import { parseArgs as parseArgsUtil } from "node:util";
import { parseFile } from "./parse.js";
import { validateSensorReading } from "./validate.js";
import { enrichReading, pool } from "./enrich.js";
import { generateReport } from "./report.js";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "path";

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

function writeToTextFile(outputDir: string, content: string): void {
  const now = new Date();
  const fileName = `${now.toISOString()}.txt`;
  const outputPath = path.join(outputDir, fileName);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, content);
}

async function main(): Promise<string | void> {
  try {
    const config: Config = parseArgs();
    const fileContent: object[] = await parseFile(config.filePath, config.format);
    const sensorReadings = fileContent.map((row, i) => {
      const result = validateSensorReading(row);
      if (config.verbose) {
        const status = result.ok ? "valid" : `INVALID: ${result.error.message}`;
        console.log(`[verbose] Row ${i}: ${status}`);
      }
      return result;
    });
    const validSensorReadings = sensorReadings.filter((r) => r.ok).map((r) => r.value);
    const enrichResults = await pool(validSensorReadings, config.concurrency, async (reading) => {
      const result = await enrichReading(reading, config.timeout);
      if (config.verbose) {
        const cause = !result.ok && result.error.cause instanceof Error ? ` (${result.error.cause.message})` : "";
        const status = result.ok ? "enriched" : `FAILED: ${result.error.message}${cause}`;
        console.log(`[verbose] ${reading.deviceId} @ ${reading.timestamp}: ${status}`);
      }
      return result;
    });
    const report = generateReport(config.filePath, sensorReadings, enrichResults);
    switch (config.output) {
      case "stdout":
        return report;
      case "file":
        writeToTextFile("./outputs", report);
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
