import type { Metadata } from "next";
import { toAbsoluteUrl } from "@/lib/seo";

const shareImage = toAbsoluteUrl("/logo-light.svg");

export const metadata: Metadata = {
  title: "Privacy Policy & Terms",
  description:
    "Read the privacy policy and terms for Kirubai Sathiyam, including details about comments and Firebase login.",
  alternates: {
    canonical: "/privacy-terms",
  },
  openGraph: {
    type: "website",
    url: "/privacy-terms",
    title: "Privacy Policy & Terms",
    description:
      "Read the privacy policy and terms for Kirubai Sathiyam, including details about comments and Firebase login.",
    siteName: "Kirubai Sathiyam",
    images: [{ url: shareImage }],
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy & Terms",
    description:
      "Read the privacy policy and terms for Kirubai Sathiyam, including details about comments and Firebase login.",
    images: [shareImage],
  },
};

export default function PrivacyTermsPage() {
  return (
    <article className="space-y-6">
      <header className="space-y-2 text-center">
        <p
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--muted-foreground)" }}
        >
          Legal
        </p>
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
          Privacy Policy & Terms
        </h1>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Last updated: February 26, 2026
        </p>
      </header>

      <div className="prose prose-neutral max-w-3xl mx-auto">
        <h2>Privacy Policy</h2>
        <p>
          This policy explains what information we collect and how we use it
          when you visit Kirubai Sathiyam and use the comments feature.
        </p>

        <h3>Information we collect</h3>
        <ul>
          <li>Comment and reply content you submit, plus timestamps.</li>
          <li>
            Basic profile details from Google sign-in through Firebase
            Authentication, such as your display name, email address, profile
            photo, and unique user ID.
          </li>
          <li>Theme preferences stored in your browser (local storage).</li>
        </ul>

        <h3>How we use information</h3>
        <ul>
          <li>To publish and display your comments and replies.</li>
          <li>To identify you as the author of your comments.</li>
          <li>To keep the site secure and prevent abuse.</li>
          <li>To remember your theme preference.</li>
        </ul>

        <h3>Third-party services</h3>
        <p>
          We use Firebase (Google) for authentication and storing comments and
          replies. These providers process data on our behalf to operate the
          service.
        </p>

        <h3>Cookies and local storage</h3>
        <p>
          We use cookies and local storage to enable sign-in and remember your
          preferences. You can disable cookies in your browser, but some
          features may not work as expected.
        </p>

        <h3>Data retention</h3>
        <p>
          We keep comments and replies until they are deleted. You can delete
          your own comments and replies in the app. If you need additional
          removal, contact us using the details provided on this site.
        </p>

        <h3>Your choices</h3>
        <ul>
          <li>You can browse the site without signing in.</li>
          <li>Signing in with Google is required to post comments.</li>
          <li>You may edit or delete your comments and replies at any time.</li>
        </ul>

        <h2>Terms of Service</h2>
        <h3>Using the site</h3>
        <p>
          By using this site, you agree to these terms. If you do not agree,
          please do not use the site.
        </p>

        <h3>Comments and community guidelines</h3>
        <ul>
          <li>Be respectful and lawful.</li>
          <li>Do not post abusive, harmful, or spam content.</li>
          <li>
            You are responsible for what you post. We may remove content that
            violates these terms.
          </li>
        </ul>

        <h3>Content license</h3>
        <p>
          When you submit a comment or reply, you grant us a non-exclusive
          license to display and distribute that content on this site.
        </p>

        <h3>Availability and changes</h3>
        <p>
          We may update the site or these terms from time to time. The updated
          date above will reflect the latest version.
        </p>

        <h3>Contact</h3>
        <p>
          If you have questions about this policy or these terms, contact us
          using the details provided on this site.
        </p>
      </div>
    </article>
  );
}
