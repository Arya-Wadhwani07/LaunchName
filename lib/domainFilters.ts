export type Availability = "all" | "available" | "taken";

interface FilterableDomain {
  purchasable: boolean;
  errorMessage?: string;
  categories?: string[];
}

/** Registrable right now: name.com says purchasable and the lookup didn't error. */
export function isAvailable(d: FilterableDomain): boolean {
  return d.purchasable && !d.errorMessage;
}

export function filterDomains<T extends FilterableDomain>(items: T[], category: string, availability: Availability) {
  const inCategory = items.filter((d) => category === "all" || d.categories?.includes(category));
  const counts: Record<Availability, number> = {
    all: inCategory.length,
    available: inCategory.filter(isAvailable).length,
    taken: inCategory.filter((d) => !isAvailable(d)).length,
  };
  const visible = inCategory.filter((d) => availability === "all" || (availability === "available" ? isAvailable(d) : !isAvailable(d)));
  return { visible, counts };
}
