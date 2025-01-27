

import {jest, it, describe, expect}from '@jest/globals';
import { execSync, spawn } from "node:child_process";
import { join } from "path";
import waitOn from "wait-on"; // Add wait-on module



jest.setTimeout(150000); // Increase global timeout to 150 seconds

describe("Smoke Test", () => {
  it(
    "starts and stops the Vite dev server without errors",
    async () => {
      const frontendPath = join(__dirname, ".."); // Path to vite-project
      process.chdir(frontendPath);

      console.log("Starting the Vite dev server...");

      const viteProcess = spawn("npm", ["run", "dev"], {
        // stdio: "inherit",
        cwd: frontendPath,
      });

      // Wait for the Vite dev server to be up
      console.log("Waiting for the server to start...");
      await waitOn({ resources: ["http://localhost:5173"] }); // Wait for the server to be ready

      console.log("Stopping the Vite dev server...");

      // Kill the server process gracefully
      viteProcess.kill("SIGTERM");

      // Wait for the process to exit
      await new Promise((resolve, reject) => {
        viteProcess.on("exit", resolve);
        viteProcess.on("error", reject);
      });

      // Ensure the process is fully terminated
      expect(viteProcess.killed).toBeTruthy();

      console.log("Vite dev server stopped successfully.");

      // Add a small delay to ensure Jest exits cleanly
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 seconds
    },
    150000 // Further extend this specific test's timeout to 150 seconds
  );
});