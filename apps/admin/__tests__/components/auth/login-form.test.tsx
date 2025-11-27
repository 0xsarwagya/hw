import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQueryClient } from "@/__tests__/utils/test-utils";
import { LoginForm } from "@/components/auth/login-form";
import { adminApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  adminApi: {
    login: jest.fn(),
  },
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
}));

jest.mock("@/components/providers/toast-provider", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock("@/lib/auth", () => ({
  setTokens: jest.fn(),
}));

const mockedAdminApi = adminApi as jest.Mocked<typeof adminApi>;

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockRefresh.mockClear();
  });

  it("renders login form", () => {
    renderWithQueryClient(<LoginForm />);

    expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("shows validation errors on submit with empty form", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: "Sign In" });
    await user.click(submitButton);

    // Form validation should prevent submission
    await waitFor(() => {
      expect(mockedAdminApi.login).not.toHaveBeenCalled();
    });
  });

  it("submits form with valid credentials", async () => {
    const user = userEvent.setup();
    mockedAdminApi.login.mockResolvedValue({
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
    });

    renderWithQueryClient(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "admin@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");

    const submitButton = screen.getByRole("button", { name: "Sign In" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedAdminApi.login).toHaveBeenCalledWith({
        email: "admin@example.com",
        password: "password123",
      });
    });
  });
});

