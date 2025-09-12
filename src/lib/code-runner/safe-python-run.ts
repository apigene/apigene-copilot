"use client";

import { safe } from "ts-safe";
import {
  CodeRunnerOptions,
  CodeRunnerResult,
  LogEntry,
} from "./code-runner.interface";

// Add security validations similar to JS

function validateCodeSafety(code: string): string | null {
  if (code.includes("os.system")) return "Forbidden: os.system";
  return null;
}

// Output handlers from reference
export const OUTPUT_HANDLERS = {
  matplotlib: `
    import io
    import base64
    from matplotlib import pyplot as plt

    plt.clf()
    plt.close('all')
    plt.switch_backend('agg')

    def setup_matplotlib_output():
        def custom_show():
            if plt.gcf().get_size_inches().prod() * plt.gcf().dpi ** 2 > 25_000_000:
                print("Warning: Plot size too large, reducing quality")
                plt.gcf().set_dpi(100)

            png_buf = io.BytesIO()
            plt.savefig(png_buf, format='png')
            png_buf.seek(0)
            png_base64 = base64.b64encode(png_buf.read()).decode('utf-8')
            print(f'data:image/png;base64,{png_base64}')
            png_buf.close()

            plt.clf()
            plt.close('all')

        plt.show = custom_show
  `,
  basic: ``,
};

async function ensurePyodideLoaded(): Promise<any> {
  if ((globalThis as any).loadPyodide) {
    return (globalThis as any).loadPyodide;
  }

  const isWorker = typeof (globalThis as any).importScripts !== "undefined";

  if (isWorker) {
    try {
      (globalThis as any).importScripts(
        "https://cdn.jsdelivr.net/pyodide/v0.28.0/full/pyodide.js",
      );
      return (globalThis as any).loadPyodide;
    } catch {
      throw new Error("Failed to load Pyodide script in worker");
    }
  } else {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://cdn.jsdelivr.net/pyodide/v0.28.0/full/pyodide.js"]',
    );

    if (existingScript) {
      if ((globalThis as any).loadPyodide) {
        return (globalThis as any).loadPyodide;
      }
      await new Promise<void>((resolve, reject) => {
        existingScript.addEventListener("load", () => resolve(), {
          once: true,
        });
        existingScript.addEventListener(
          "error",
          () => reject(new Error("Failed to load Pyodide script")),
          { once: true },
        );
      });
    } else {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.28.0/full/pyodide.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error("Failed to load Pyodide script"));
        document.head.appendChild(script);
      });
    }
  }

  return (globalThis as any).loadPyodide;
}

function detectRequiredHandlers(code: string): string[] {
  const handlers: string[] = ["basic"];
  if (code.includes("matplotlib") || code.includes("plt.")) {
    handlers.push("matplotlib");
  }
  return handlers;
}

export async function safePythonRun({
  code,
  timeout = 120000, // Increased from 30000 to 120000 (2 minutes) for Pyodide + package loading
  onLog,
}: CodeRunnerOptions): Promise<CodeRunnerResult> {
  const startTime = Date.now();
  return safe(async () => {
    const logs: LogEntry[] = [];

    onLog?.({
      type: "log",
      args: [{ type: "data", value: "🚀 Starting Python execution..." }],
    });

    const securityError = validateCodeSafety(code);
    if (securityError) {
      onLog?.({
        type: "error",
        args: [
          {
            type: "data",
            value: `❌ Security validation failed: ${securityError}`,
          },
        ],
      });
      throw new Error(securityError);
    }
    onLog?.({
      type: "log",
      args: [{ type: "data", value: "✅ Code security validation passed" }],
    });

    onLog?.({
      type: "log",
      args: [{ type: "data", value: "📦 Loading Pyodide loader..." }],
    });
    const loadPyodide = await ensurePyodideLoaded();
    onLog?.({
      type: "log",
      args: [{ type: "data", value: "✅ Pyodide loader ready" }],
    });

    // Load Pyodide with progress feedback
    onLog?.({
      type: "log",
      args: [
        {
          type: "data",
          value:
            "🐍 Initializing Python runtime (this may take 10-30 seconds)...",
        },
      ],
    });
    const pyodideStartTime = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.0/full/",
    });
    const pyodideLoadTime = Date.now() - pyodideStartTime;
    onLog?.({
      type: "log",
      args: [
        {
          type: "data",
          value: `✅ Python runtime loaded successfully (${pyodideLoadTime}ms)`,
        },
      ],
    });

    // Set up stdout capture
    pyodide.setStdout({
      batched: (output: string) => {
        const type = output.startsWith("data:image/png;base64")
          ? "image"
          : "data";
        logs.push({ type: "log", args: [{ type, value: output }] });
        onLog?.({ type: "log", args: [{ type, value: output }] });
      },
    });
    pyodide.setStderr({
      batched: (output: string) => {
        logs.push({ type: "error", args: [{ type: "data", value: output }] });
        onLog?.({ type: "error", args: [{ type: "data", value: output }] });
      },
    });

    // Load packages and handlers
    onLog?.({
      type: "log",
      args: [
        { type: "data", value: "📚 Analyzing code for required packages..." },
      ],
    });
    const packageStartTime = Date.now();
    await pyodide.loadPackagesFromImports(code);
    const packageLoadTime = Date.now() - packageStartTime;
    onLog?.({
      type: "log",
      args: [
        {
          type: "data",
          value: `✅ Required packages installed successfully (${packageLoadTime}ms)`,
        },
      ],
    });

    onLog?.({
      type: "log",
      args: [{ type: "data", value: "🔧 Setting up output handlers..." }],
    });
    const requiredHandlers = detectRequiredHandlers(code);
    if (requiredHandlers.length > 0) {
      onLog?.({
        type: "log",
        args: [
          {
            type: "data",
            value: `📋 Detected handlers: ${requiredHandlers.join(", ")}`,
          },
        ],
      });
    }

    for (const handler of requiredHandlers) {
      onLog?.({
        type: "log",
        args: [{ type: "data", value: `⚙️ Setting up ${handler} handler...` }],
      });
      await pyodide.runPythonAsync(
        OUTPUT_HANDLERS[handler as keyof typeof OUTPUT_HANDLERS],
      );
      if (handler === "matplotlib") {
        onLog?.({
          type: "log",
          args: [
            { type: "data", value: "📊 Configuring matplotlib output..." },
          ],
        });
        await pyodide.runPythonAsync("setup_matplotlib_output()");
      }
      onLog?.({
        type: "log",
        args: [{ type: "data", value: `✅ ${handler} handler configured` }],
      });
    }

    // Execute code with timeout
    onLog?.({
      type: "log",
      args: [{ type: "data", value: "▶️ Executing Python code..." }],
    });
    const executionStartTime = Date.now();
    const execution = pyodide.runPythonAsync(code);
    const timer = new Promise((_, reject) =>
      setTimeout(() => {
        onLog?.({
          type: "error",
          args: [
            { type: "data", value: `⏰ Execution timeout after ${timeout}ms` },
          ],
        });
        reject(new Error("Timeout"));
      }, timeout),
    );
    const returnValue = await Promise.race([execution, timer]);
    const executionTime = Date.now() - executionStartTime;
    onLog?.({
      type: "log",
      args: [
        {
          type: "data",
          value: `✅ Code execution completed successfully (${executionTime}ms)`,
        },
      ],
    });

    const totalTime = Date.now() - startTime;
    onLog?.({
      type: "log",
      args: [
        {
          type: "data",
          value: `🎉 Python execution finished! Total time: ${totalTime}ms`,
        },
      ],
    });

    return {
      success: true,
      logs,
      executionTimeMs: Date.now() - startTime,
      result: returnValue,
    } as CodeRunnerResult;
  })
    .ifFail((err) => {
      onLog?.({
        type: "error",
        args: [
          { type: "data", value: `❌ Python execution failed: ${err.message}` },
        ],
      });
      return {
        success: false,
        error: err.message,
        logs: [
          {
            type: "error" as const,
            args: [
              {
                type: "data" as const,
                value: `Python execution failed: ${err.message}`,
              },
            ],
          },
        ],
        executionTimeMs: Date.now() - startTime,
        solution: "Python execution failed. Check syntax, imports, or timeout.",
      } as CodeRunnerResult;
    })
    .unwrap();
}
