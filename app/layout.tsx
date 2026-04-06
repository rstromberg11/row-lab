export const metadata = {
  title: "RowLab",
  description: "Seat race calculator for rowers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
