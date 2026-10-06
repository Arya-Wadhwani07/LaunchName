import { describe, expect, it } from "vitest";
import { filterDomains, isAvailable } from "@/lib/domainFilters";

const items = [
  { domainName: "a.com", purchasable: true, categories: ["popular"] },
  { domainName: "a.ai", purchasable: true, categories: ["ai"] },
  { domainName: "a.co", purchasable: false, categories: ["popular"] },
  { domainName: "a.io", purchasable: true, errorMessage: "lookup failed", categories: ["startup"] },
];

describe("domain filters", () => {
  it("treats lookup errors as not available", () => {
    expect(isAvailable(items[3])).toBe(false);
  });

  it("counts available and taken within the chosen extension group", () => {
    expect(filterDomains(items, "all", "all").counts).toEqual({ all: 4, available: 2, taken: 2 });
    expect(filterDomains(items, "popular", "all").counts).toEqual({ all: 2, available: 1, taken: 1 });
  });

  it("shows only available domains", () => {
    expect(filterDomains(items, "all", "available").visible.map((d) => d.domainName)).toEqual(["a.com", "a.ai"]);
  });

  it("shows only taken domains", () => {
    expect(filterDomains(items, "all", "taken").visible.map((d) => d.domainName)).toEqual(["a.co", "a.io"]);
  });

  it("combines the extension and availability filters", () => {
    expect(filterDomains(items, "popular", "taken").visible.map((d) => d.domainName)).toEqual(["a.co"]);
  });
});
