import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isAuthenticated,
  getUserFromToken,
} from "@/lib/auth";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("auth utilities", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("getAccessToken", () => {
    it("returns null when no token is stored", () => {
      expect(getAccessToken()).toBeNull();
    });

    it("returns stored access token", () => {
      localStorageMock.setItem("admin_access_token", "test-token");
      expect(getAccessToken()).toBe("test-token");
    });
  });

  describe("getRefreshToken", () => {
    it("returns null when no token is stored", () => {
      expect(getRefreshToken()).toBeNull();
    });

    it("returns stored refresh token", () => {
      localStorageMock.setItem("admin_refresh_token", "refresh-token");
      expect(getRefreshToken()).toBe("refresh-token");
    });
  });

  describe("setTokens", () => {
    it("stores both tokens", () => {
      setTokens("access-token", "refresh-token");
      expect(localStorageMock.getItem("admin_access_token")).toBe("access-token");
      expect(localStorageMock.getItem("admin_refresh_token")).toBe("refresh-token");
    });
  });

  describe("clearTokens", () => {
    it("removes both tokens", () => {
      setTokens("access-token", "refresh-token");
      clearTokens();
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("returns false when no token is stored", () => {
      expect(isAuthenticated()).toBe(false);
    });

    it("returns true when token is stored", () => {
      setTokens("access-token", "refresh-token");
      expect(isAuthenticated()).toBe(true);
    });
  });

  describe("getUserFromToken", () => {
    it("returns null when no token is stored", () => {
      expect(getUserFromToken()).toBeNull();
    });

    it("decodes JWT token and returns user info", () => {
      // Create a mock JWT token (header.payload.signature)
      // Payload: {"sub":"123","email":"test@example.com","role":"admin"}
      const payload = {
        sub: "123",
        email: "test@example.com",
        role: "admin",
      };
      // Base64URL encode the payload
      const base64Url = btoa(JSON.stringify(payload))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
      const mockToken = `header.${base64Url}.signature`;
      localStorageMock.setItem("admin_access_token", mockToken);

      const user = getUserFromToken();
      expect(user).toEqual({
        id: "123",
        email: "test@example.com",
        role: "admin",
      });
    });

    it("returns null for invalid token", () => {
      localStorageMock.setItem("admin_access_token", "invalid-token");
      expect(getUserFromToken()).toBeNull();
    });
  });
});

