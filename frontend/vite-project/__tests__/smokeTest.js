

import {jest, it, describe, expect}from '@jest/globals';
import { execSync } from "node:child_process";
import { join } from "path";


jest.setTimeout(30000); // Extend timeout for slower operations


describe("Smoke Test", () => {
  it("runs the Vite app without throwing errors", () => {
    const frontendPath = join(__dirname, ".."); // Go up one level from __tests__ to vite-project

    expect(() => {
      try {
        // Change to the vite-project directory
        process.chdir(frontendPath);

        // Install dependencies and start the dev server
        execSync("npm install", { stdio: "inherit" });
        execSync("npm run dev", { stdio: "inherit" });
      } catch (error) {
        throw new Error(`Smoke Test failed: ${error.message}`);
      }
    }).not.toThrow();
  });
});

