import path from "path";
import { EnrichedReading, type SensorReading } from "./types.js";
import { type Result, type SensorReading as SR, type EnrichedReading as ER } from "./types.js";

function getFormattedErrors(results: Result<SR | ER>[]): string[] {
  const errorCause = (e: Error): string => (e.cause ? ` - ${e.cause}` : "");
  let formattedErrors = [];
  for (let i = 0; i < results.length; i++) {
    let result = results[i];
    if (!result.ok) {
      let e = result.error;
      let formattedError = `Row ${i}: ${e.name} - ${e.message}${errorCause(e)}`;
      formattedErrors.push(formattedError);
    }
  }
  return formattedErrors;
}

export function generateReport(
  filePath: string,
  validateResults: Result<SensorReading>[],
  enrichResults: Result<EnrichedReading>[],
): string {
  const fileName = path.basename(filePath);
  const numReadings = validateResults.length;
  const invalidResults = validateResults.filter((r) => !r.ok);
  const numInvalid = invalidResults.length;
  const numValid = numReadings - numInvalid;
  const enrichFailedResults = enrichResults.filter((r) => !r.ok);
  const numEnrichFailed = enrichFailedResults.length;
  const numEnriched = enrichResults.length - numEnrichFailed;
  const validationErrorsFormatted = getFormattedErrors(validateResults);
  const enrichmentFailuresFormatted = getFormattedErrors(enrichFailedResults);

  let report = [
    "=== Data Pipeline Report ===",
    `Input:         ${fileName} (${numReadings} rows)`,
    `Valid:         ${numValid}`,
    `Invalid:       ${numInvalid}`,
    `Enriched:      ${numEnriched}`,
    `Enrich failed: ${numEnrichFailed}`,
  ];
  if (!(validationErrorsFormatted.length === 0)) {
    report.push("\n=== Validation errors ===", `${validationErrorsFormatted.join("\n")}`);
  }
  if (!(enrichmentFailuresFormatted.length === 0)) {
    report.push("\n=== Enrichment failures ===", `${enrichmentFailuresFormatted.join("\n")}`);
  }
  return report.join("\n");
}
