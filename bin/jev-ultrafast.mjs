#!/usr/bin/env node
/**
 * jev-ultrafast npm launcher.
 * First run: bootstraps a Python venv (uv if available, else venv+pip) inside
 * the package dir and installs the bundled Python project. Then runs `jev`.
 * Keys come from your environment (OPENROUTER_API_KEY, TEXT_MODEL_API_KEY) —
 * nothing is hardcoded or stored.
 *
 *   jev-ultrafast --url https://example.com --goal "Click the More information link"
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const venv = path.join(pkgDir, ".venv");
const isWin = process.platform === "win32";
const pyExe = path.join(venv, isWin ? "Scripts\\python.exe" : "bin/python");
const jevArgs = ["-m", "jev_ultrafast.cli"]; // console-script equivalent, robust on Windows

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: isWin, ...opts });
  if (r.error) throw r.error;
  return r.status ?? 0;
}

function have(cmd) {
  return spawnSync(cmd, ["--version"], { shell: isWin, encoding: "utf8" }).status === 0;
}

if (!fs.existsSync(pyExe)) {
  console.error("jev-ultrafast: first run — setting up Python environment (~1 min)...");
  fs.mkdirSync(venv, { recursive: true });
  if (have("uv")) {
    run("uv", ["venv", venv], { cwd: pkgDir });
    run("uv", ["pip", "install", "--python", pyExe, "-q", pkgDir], { cwd: pkgDir });
  } else {
    const py = have("python") ? "python" : "python3";
    run(py, ["-m", "venv", venv], { cwd: pkgDir });
    run(pyExe, ["-m", "pip", "install", "-q", "-e", pkgDir], { cwd: pkgDir });
  }
  console.error("jev-ultrafast: environment ready.");
}

if (!process.env.OPENROUTER_API_KEY && !process.env.TYPESAFE_API_KEY) {
  console.error(
    "jev-ultrafast: set OPENROUTER_API_KEY (or TYPESAFE_API_KEY) in your environment.\n" +
      "  PowerShell:  $env:OPENROUTER_API_KEY = '...'\n" +
      "  bash:        export OPENROUTER_API_KEY=..."
  );
  process.exit(1);
}

const urlFlag = process.argv.indexOf("--url");
const goalFlag = process.argv.indexOf("--goal");
const args = process.argv.slice(2);
if (urlFlag === -1) args.unshift("--url", process.env.JEV_URL || "https://example.com");
if (goalFlag === -1) args.unshift("--goal", process.env.JEV_GOAL || "Click the More information link");

const child = spawn(pyExe, [...jevArgs, ...args], { stdio: "inherit" });
child.on("exit", (c) => process.exit(c ?? 0));