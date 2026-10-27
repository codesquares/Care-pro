/**
 * Where "select this package" should send a visitor from the public package cards.
 *
 * With a tier, the destination is the priced package view (/marketplace, filtered to that
 * category and tier). A signed-in visitor goes straight there; an anonymous visitor is sent
 * through the same /register?returnTo=… flow the assessment CTA uses, so they land on that priced
 * view once signed in.
 *
 * Without a tier (the card's no-data fallback) there is nothing specific to select, so everyone
 * goes to the category's marketplace view. It shows the packages when signed in, and its own
 * sign-in wall (which carries returnTo) when not — never a silent signup redirect.
 */
export const getPackageSelectNavigation = ({ isAuthenticated, category, tierLabel }) => {
  const params = new URLSearchParams({ category });
  if (tierLabel) params.set("q", tierLabel);
  const destination = `/marketplace?${params.toString()}`;
  if (!tierLabel || isAuthenticated) return destination;
  return `/register?returnTo=${encodeURIComponent(destination)}`;
};
