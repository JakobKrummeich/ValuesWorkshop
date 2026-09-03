import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies, headers } from "next/headers";
import { chooseLanguage } from "../domain/i18n/chooseLanguage";
import { languageCookieName } from "../domain/i18n/language";
import { LanguageProvider } from "./i18n/LanguageProvider";
import "./tokens.css";
import "./globals.css";

const fraunces = localFont({
  src: "./fonts/Fraunces-latin.woff2",
  variable: "--font-fraunces",
  weight: "300 900",
  display: "swap",
});

const manrope = localFont({
  src: "./fonts/Manrope-latin.woff2",
  variable: "--font-manrope",
  weight: "400 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Values Workshop",
  description:
    "Facilitated workshop producing company values and everyday actions",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = chooseLanguage(
    (await cookies()).get(languageCookieName)?.value,
    (await headers()).get("accept-language") ?? undefined,
  );

  return (
    <html
      lang={language}
      className={`${fraunces.variable} ${manrope.variable}`}
    >
      <body>
        <LanguageProvider initialLanguage={language}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
