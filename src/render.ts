import type { ProbeReport } from "./types.js";

export function renderJson(report: ProbeReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderMarkdown(report: ProbeReport): string {
  const lines = [
    `# opikprobe report: ${report.fixtureName}`,
    "",
    `- Status: ${report.ok ? "PASS" : "FAIL"}`,
    `- Input: ${report.inputPath}`,
    `- Tools: ${report.summary.tools}`,
    `- Traces: ${report.summary.traces}`,
    `- Evals: ${report.summary.evals}`,
    `- Errors: ${report.summary.violations}`,
    `- Warnings: ${report.summary.warnings}`,
    "",
    "## Findings",
    ""
  ];
  if (report.violations.length === 0) {
    lines.push("No violations found.");
  } else {
    for (const violation of report.violations) {
      lines.push(`- **${violation.severity.toUpperCase()} ${violation.code}** at \`${violation.path}\`: ${violation.message}`);
    }
  }
  lines.push("", "_Generated deterministically by opikprobe._", "");
  return lines.join("\n");
}
