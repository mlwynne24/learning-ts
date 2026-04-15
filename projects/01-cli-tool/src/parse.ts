import * as fs from "fs/promises";
import path from "path";

function parseJson(json: string): Promise<object> {
  try {
    return JSON.parse(json);
  } catch (err) {
    const cause = err instanceof Error ? err : new Error(String(err));
    throw new Error("Error parsing JSON content", { cause });
  }
}

function parseCsv(csv: string): Record<string, string>[] {
  try {
    const lines = csv.trim().split("\n");
    if (lines.length === 0) return [];

    const headers = lines[0].split(",").map((h) => h.trim());

    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());

      const row: Record<string, string> = {};
      headers.forEach((header, i) => {
        row[header] = values[i] ?? "";
      });

      return row;
    });
  } catch (err) {
    const cause = err instanceof Error ? err : new Error(String(err));
    throw new Error("Error parsing JSON content", { cause });
  }
}

async function parseFile(filePath: string): Promise<unknown> {
  const suffix = path.extname(filePath);
  const content = await fs.readFile(filePath, "utf-8");
  switch (suffix) {
    case ".json":
      return parseJson(content);
    case ".csv":
      return parseCsv(content);
    default:
      throw new Error(`Invalid file type: ${suffix}`);
  }
}
