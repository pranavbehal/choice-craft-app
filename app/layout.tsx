import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Choice Craft",
  description: "Embark on immersive missions with AI companions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        {/* UserWay Accessibility Widget Configuration */}
        <Script id="userway-config" strategy="beforeInteractive">
          {`
            window.UserWayWidgetApp = {
              account: 'FSY3fD98w9',
              position: 'bottom-left',
              size: 'medium',
              color: '#ffffff',
              trigger: 'accessible'
            };
          `}
        </Script>

        {/* UserWay Accessibility Widget Implementation for All Pages */}
        <Script
          src="https://cdn.userway.org/widget.js"
          data-account="FSY3fD98w9"
          strategy="afterInteractive"
        />

        {/* Additional UserWay positioning enforcement */}
        <Script id="userway-position-fix" strategy="afterInteractive">
          {`
            // Function to ensure UserWay widget stays in bottom-left
            function enforceUserWayPosition() {
              const userWayElements = document.querySelectorAll('iframe[title*="UserWay"], iframe[src*="userway"], div[id*="userway"], div[class*="userway"], [data-uw-feature-button]');
              
              userWayElements.forEach(element => {
                if (element) {
                  element.style.position = 'fixed';
                  element.style.bottom = '20px';
                  element.style.left = '20px';
                  element.style.top = 'auto';
                  element.style.right = 'auto';
                  element.style.zIndex = '2147483647';
                }
              });
            }

            // Run when DOM is ready
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', enforceUserWayPosition);
            } else {
              enforceUserWayPosition();
            }

            // Also run periodically to catch any repositioning
            setInterval(enforceUserWayPosition, 2000);

            // Run when window loads
            window.addEventListener('load', enforceUserWayPosition);
          `}
        </Script>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
