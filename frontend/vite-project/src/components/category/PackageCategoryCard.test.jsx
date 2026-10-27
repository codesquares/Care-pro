import { render, screen, fireEvent } from "@testing-library/react";
import PackageCategoryCard from "./PackageCategoryCard";

const category = { category: "Live-in Package", name: "Live-in Care", slug: "pkg-live-in-package" };
const tiers = [
  { tierLabel: "Aux Package", requiredCaregiverType: "AuxiliaryNurse", description: "Live-in Auxiliary Nurse package. Full details ... to be added — not specified." },
  { tierLabel: "Nurse Package", requiredCaregiverType: "RegisteredNurse", description: "Round-the-clock nursing support at home." },
];

describe("PackageCategoryCard", () => {
  it("shows category, tiers and caregiver-type chips, with no price and a real icon", () => {
    const { container } = render(<PackageCategoryCard category={category} tiers={tiers} onSelect={() => {}} />);
    expect(screen.getByText("Live-in Care")).toBeTruthy();
    expect(screen.getByText("Aux Package")).toBeTruthy();
    expect(screen.getByText("Auxiliary Nurse")).toBeTruthy();
    expect(screen.getByText("Registered Nurse")).toBeTruthy();
    expect(container.querySelector(".pkg-cat-card__art svg")).not.toBeNull();
    expect(container.textContent).not.toMatch(/₦|\d{2,3},\d{3}/);
  });

  it("never publishes a placeholder description, but shows a real one", () => {
    const { container } = render(<PackageCategoryCard category={category} tiers={tiers} onSelect={() => {}} />);
    expect(container.textContent).not.toMatch(/to be added/i);
    expect(container.textContent).toContain("Round-the-clock nursing support at home.");
  });

  it("only the select button leaves the card, passing the category and the tier", () => {
    const onSelect = jest.fn();
    render(<PackageCategoryCard category={category} tiers={tiers} onSelect={onSelect} />);
    expect(onSelect).not.toHaveBeenCalled(); // viewing/expanding is informational
    fireEvent.click(screen.getAllByText(/View pricing/)[1]);
    expect(onSelect).toHaveBeenCalledWith(category, tiers[1]);
  });

  it("still renders (with a browse button) when no tier data has loaded", () => {
    const onSelect = jest.fn();
    render(<PackageCategoryCard category={category} tiers={[]} onSelect={onSelect} />);
    fireEvent.click(screen.getByText(/Browse Live-in Care packages/));
    expect(onSelect).toHaveBeenCalledWith(category, null);
  });

  it("shows prices only when showPrice is on AND the tier carries one (safe with either data source)", () => {
    const priced = [{ ...tiers[1], basePrice: 300000, additionalDayPrice: 20000 }];
    const { container, rerender } = render(<PackageCategoryCard category={category} tiers={priced} onSelect={() => {}} />);
    expect(container.textContent).not.toMatch(/₦/); // homepage mode ignores any price it is handed
    rerender(<PackageCategoryCard category={category} tiers={priced} onSelect={() => {}} showPrice />);
    expect(container.textContent).toContain("From ₦300,000");
    expect(container.textContent).toContain("+₦20,000 per additional day");
    rerender(<PackageCategoryCard category={category} tiers={tiers} onSelect={() => {}} showPrice />);
    expect(container.textContent).not.toMatch(/₦/); // price-free tiers never render one
  });

  it("has a visible expand indicator on every tier row and a configurable select label", () => {
    const { container } = render(<PackageCategoryCard category={category} tiers={tiers} onSelect={() => {}} selectLabel="Select this package" />);
    expect(container.querySelectorAll("summary .pkg-cat-card__chevron").length).toBe(tiers.length);
    expect(screen.getAllByText(/Select this package/).length).toBe(tiers.length);
  });
});
