import path from "path";
import { EnrichedReading, type SensorReading } from "./types.js";
import { type Result } from "./validate.js";

function formatErrorRow(errors: string[]): string[] {
  return errors.map((r, i) => `Row ${i}: ${r}`);
}

function generateReport(
  filePath: string,
  validateResults: Result<SensorReading>[],
  enrichResults: PromiseSettledResult<EnrichedReading>[],
): string {
  const fileName = path.basename(filePath);
  const numReadings = validateResults.length;
  const invalidResults = validateResults.filter((r) => !r.ok);
  const numInvalid = invalidResults.length;
  const numValid = numReadings - numInvalid;
  const enrichFailedResults = enrichResults.filter((r) => r.status === "rejected");
  const numEnrichFailed = enrichFailedResults.length;
  const numEnriched = enrichResults.length - numEnrichFailed;

  const validationErrors = invalidResults.map((r) => r.error.message);
  const enrichmentFailures = enrichFailedResults.map((r) => r.reason);

  const validationErrorsFormatted = formatErrorRow(validationErrors);
  const enrichmentFailuresFormatted = formatErrorRow(enrichmentFailures);

  return [
    "=== Data Pipeline Report ===",
    `Input:         ${fileName} (${numReadings} rows)`,
    `Valid:         ${numValid}`,
    `Invalid:       ${numInvalid}`,
    `Enriched:      ${numEnriched}`,
    `Enrich failed: ${numEnrichFailed}`,
    "",
    "=== Validation errors ===",
    `${validationErrorsFormatted.join("\n")}`,
    "",
    "=== Enrichment failures ===",
    `${enrichmentFailuresFormatted.join("\n")}`,
  ].join("\n");
}
