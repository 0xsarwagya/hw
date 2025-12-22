// Simple toast utility - can be replaced with sonner later
export const toast = {
  success: (message: string) => {
    // Simple alert for now - can be replaced with a proper toast library
    console.log("✅", message);
  },
  error: (message: string) => {
    // Simple alert for now - can be replaced with a proper toast library
    console.error("❌", message);
    alert(message);
  },
  info: (message: string) => {
    console.log("ℹ️", message);
  },
};
