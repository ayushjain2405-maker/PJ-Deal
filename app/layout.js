import "./globals.css";

export const metadata = {
  title: "Metal Deal Tracker",
  description:
    "Track customer and vendor gold or silver deals with synced delivery status across devices.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
