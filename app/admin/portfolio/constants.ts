export const PORTFOLIO_CATEGORIES = [
  "AI/ML",
  "Web Scraping",
  "Mobile App",
  "Web App",
  "Creative/Motion",
  "Other",
] as const;

export type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number];
