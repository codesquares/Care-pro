import { getPackageSelectNavigation } from "./packageSelectNavigation";

describe("getPackageSelectNavigation", () => {
  it("sends a signed-in visitor straight to the priced package view for that tier", () => {
    expect(
      getPackageSelectNavigation({ isAuthenticated: true, category: "Post Surgery Care", tierLabel: "Essential Recovery" })
    ).toBe("/marketplace?category=Post+Surgery+Care&q=Essential+Recovery");
  });

  it("sends an anonymous visitor to signup with the same destination as returnTo", () => {
    const path = getPackageSelectNavigation({ isAuthenticated: false, category: "Adult/Elder Care", tierLabel: "Essential Companion" });
    const url = new URL(path, "http://x");
    expect(url.pathname).toBe("/register");
    expect(url.searchParams.get("returnTo")).toBe("/marketplace?category=Adult%2FElder+Care&q=Essential+Companion");
  });

  it("with no tier (no-data fallback) goes to the category view for everyone — never a silent signup redirect", () => {
    const expected = "/marketplace?category=Live-in+Package";
    expect(getPackageSelectNavigation({ isAuthenticated: true, category: "Live-in Package" })).toBe(expected);
    expect(getPackageSelectNavigation({ isAuthenticated: false, category: "Live-in Package" })).toBe(expected);
  });

  it("keeps a returnTo that the login/register safety check accepts (in-app relative path)", () => {
    const path = getPackageSelectNavigation({ isAuthenticated: false, category: "Post-Partum Care", tierLabel: "Premium Confinement" });
    const returnTo = new URL(path, "http://x").searchParams.get("returnTo");
    expect(/^\/(?!\/|\\)/.test(returnTo)).toBe(true);
  });
});
