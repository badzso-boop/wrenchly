import { render, screen } from "@testing-library/react";
import MarketingPage, { metadata } from "../page";
import MarketingLayout from "../layout";
import { getServerSession } from "next-auth";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

describe("Marketing Page & Layout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exports valid metadata", () => {
    expect(metadata.title).toBe("Wrenchly - Marketing");
    expect(metadata.description).toBe("Welcome to Wrenchly");
  });

  it("renders MarketingLayout wrapping children", () => {
    const { container } = render(
      <MarketingLayout>
        <div data-testid="child">Child Content</div>
      </MarketingLayout>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(container.querySelector(".marketing-layout")).toBeInTheDocument();
  });

  it("checks auth session via getServerSession and renders content when unauthenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const jsx = await MarketingPage();
    render(jsx);

    expect(getServerSession).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: /welcome to wrenchly/i })).toBeInTheDocument();
  });

  it("checks auth session via getServerSession and displays session user info when authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    const jsx = await MarketingPage();
    render(jsx);

    expect(getServerSession).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/signed in as test@example.com/i)).toBeInTheDocument();
  });
});