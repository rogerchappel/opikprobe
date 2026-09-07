import { constants } from "node:fs";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const workspace = await mkdtemp(join(tmpdir(), "opikprobe-package-smoke-"));

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", stdio: "pipe" });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed\n${result.stdout}${result.stderr}`);
  }
  return result.stdout;
}

try {
  const packResult = JSON.parse(run("npm", ["pack", "--json", "--pack-destination", workspace], process.cwd()))[0];
  const paths = new Set(packResult.files.map(({ path }) => path));
  for (const requiredPath of ["dist/src/cli.js", "dist/src/index.js", "dist/src/index.d.ts", "fixtures/pass/probe.json"]) {
    if (!paths.has(requiredPath)) throw new Error(`Packed artifact is missing required file: ${requiredPath}`);
  }

  const consumer = join(workspace, "consumer");
  await mkdir(consumer);
  await writeFile(join(consumer, "package.json"), `${JSON.stringify({ private: true, type: "module" }, null, 2)}\n`);

  const tarball = join(workspace, packResult.filename);
  run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--no-package-lock", tarball], consumer);

  const bin = join(consumer, "node_modules", ".bin", "opikprobe");
  await access(bin, constants.X_OK);
  const help = run(bin, ["--help"], consumer);
  if (!help.includes("opikprobe inspect")) throw new Error("Installed CLI help did not contain the inspect command");

  const fixture = join(consumer, "node_modules", "opikprobe", "fixtures", "pass");
  const report = JSON.parse(run(bin, ["inspect", fixture, "--format", "json"], consumer));
  if (report.ok !== true) throw new Error("Installed CLI did not successfully inspect the packaged pass fixture");

  await writeFile(join(consumer, "verify-export.mjs"), [
    'import { inspectFixture } from "opikprobe";',
    'if (typeof inspectFixture !== "function") throw new Error("inspectFixture export is unavailable");',
    "",
  ].join("\n"));
  run(process.execPath, ["verify-export.mjs"], consumer);

  const installedManifest = JSON.parse(await readFile(join(consumer, "node_modules", "opikprobe", "package.json"), "utf8"));
  if (installedManifest.bin?.opikprobe !== "./dist/src/cli.js" || installedManifest.exports?.["."]?.import !== "./dist/src/index.js") {
    throw new Error("Installed package manifest does not expose the expected CLI and library entrypoints");
  }

  process.stdout.write(`Verified disposable consumer installation of ${packResult.filename}\n`);
} finally {
  await rm(workspace, { recursive: true, force: true });
}
