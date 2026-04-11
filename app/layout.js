export const metadata = {
  title: "RowLab — Build Faster Boats",
  description: "Not just who crossed first — calculates who moved the boat faster. The seat race calculator built for competitive rowing.",
  openGraph: {
    title: "RowLab — Build Faster Boats",
    description: "Not just who crossed first — calculates who moved the boat faster. The seat race calculator built for competitive rowing.",
    siteName: "RowLab",
  },
  twitter: {
    card: "summary_large_image",
    title: "RowLab — Build Faster Boats",
    description: "Not just who crossed first — calculates who moved the boat faster. The seat race calculator built for competitive rowing.",
  },
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
