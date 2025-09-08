
import { jest, it, describe, expect } from '@jest/globals';
import { existsSync } from 'fs';
import { join } from 'path';

describe("Smoke Test", () => {
  it("should verify project structure and dependencies", () => {
    const projectRoot = join(__dirname, "..");
    
    // Check essential files exist
    expect(existsSync(join(projectRoot, "package.json"))).toBeTruthy();
    expect(existsSync(join(projectRoot, "vite.config.js"))).toBeTruthy();
    expect(existsSync(join(projectRoot, "index.html"))).toBeTruthy();
    expect(existsSync(join(projectRoot, "src"))).toBeTruthy();
    
    // Check package.json has required scripts
    const packageJson = require(join(projectRoot, "package.json"));
    expect(packageJson.scripts.dev).toBeDefined();
    expect(packageJson.scripts.build).toBeDefined();
    expect(packageJson.scripts.test).toBeDefined();
    
    // Check key dependencies
    expect(packageJson.dependencies.react).toBeDefined();
    expect(packageJson.dependencies['react-dom']).toBeDefined();
    expect(packageJson.dependencies['react-router-dom']).toBeDefined();
    
    console.log("✓ Project structure verification passed");
  });

  it("should verify testing setup is functional", () => {
    // Test that Jest and testing utilities are working
    expect(jest).toBeDefined();
    expect(expect).toBeDefined();
    
    // Test basic JavaScript functionality
    const testArray = [1, 2, 3];
    expect(testArray.length).toBe(3);
    expect(testArray.includes(2)).toBeTruthy();
    
    // Test async functionality
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(true).toBeTruthy();
        resolve();
      }, 100);
    });
  });

  it("should verify mock functions work correctly", () => {
    const mockFn = jest.fn();
    mockFn('test');
    mockFn('test2');
    
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenCalledWith('test');
    expect(mockFn).toHaveBeenCalledWith('test2');
    
    // Test localStorage mock
    expect(global.localStorage).toBeDefined();
    expect(typeof global.localStorage.setItem).toBe('function');
    expect(typeof global.localStorage.getItem).toBe('function');
    
    console.log("✓ Mock functions verification passed");
  });

  it("should verify environment variables and configuration", () => {
    // Verify Node environment
    expect(process.env.NODE_ENV).toBeDefined();
    
    // Verify window object exists (jsdom)
    expect(window).toBeDefined();
    expect(window.location).toBeDefined();
    expect(window.location.origin).toMatch(/http:\/\/localhost/);
    
    console.log("✓ Environment configuration verification passed");
  });
});