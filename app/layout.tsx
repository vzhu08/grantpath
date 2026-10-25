import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "GrantPath · Research workspace",
  description:
    "Source-checkable grant planning, evidence, checklists and editable proposal drafts.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
