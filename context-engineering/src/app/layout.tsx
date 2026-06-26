import './globals.css';

export const metadata = {
  title: 'Context Engineering Playground',
  description: 'An interactive developer dashboard for Context Engineering in modern Agent Runtimes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com" defer></script>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
