// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Suppress console.error in tests (can be overridden in specific tests)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Dashboard data fetch error")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
