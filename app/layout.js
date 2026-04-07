export const metadata = {
  title: "RowLab",
  description: "Seat race calculator for rowers",
  openGraph: {
    title: "RowLab — Seat Race Calculator",
    description: "Enter times for both pieces. RowLab compares each athlete's total time — not just who crossed first.",
    siteName: "RowLab",
  },
  twitter: {
    card: "summary_large_image",
    title: "RowLab — Seat Race Calculator",
    description: "Enter times for both pieces. RowLab compares each athlete's total time — not just who crossed first.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
