export const metadata = {
  title: "RowLab — Settle Seat Races Fast",
  description: "Not just who crossed first — who actually moved the boat. The seat race calculator built for competitive rowing.",
  openGraph: {
    title: "RowLab — Settle Seat Races Fast",
    description: "Not just who crossed first — who actually moved the boat. The seat race calculator built for competitive rowing.",
    siteName: "RowLab",
  },
  twitter: {
    card: "summary_large_image",
    title: "RowLab — Settle Seat Races Fast",
    description: "Not just who crossed first — who actually moved the boat. The seat race calculator built for competitive rowing.",
  },
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
