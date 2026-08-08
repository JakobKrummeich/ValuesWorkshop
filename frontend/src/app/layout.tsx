import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { chooseLanguage } from "../domain/i18n/chooseLanguage";
import { languageCookieName } from "../domain/i18n/language";
import { LanguageProvider } from "./i18n/LanguageProvider";
import "./tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "ValuesWorkshop",
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
    <html lang={language}>
      <body>
        <LanguageProvider initialLanguage={language}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
