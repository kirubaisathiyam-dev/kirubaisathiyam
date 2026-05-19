import { loadAdminArticles } from "@/lib/admin-articles";
import SendNewsletterForm, {
  type NewsletterArticle,
} from "./send-newsletter-form";

export default function SendNewsletterPage() {
  const articles: NewsletterArticle[] = loadAdminArticles();

  return (
    <div className="max-w-2xl space-y-3">
      <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
        Send Newsletter
      </h1>
      <p style={{ color: "var(--muted-foreground)" }}>
        Select an article and send it as a newsletter.
      </p>

      <SendNewsletterForm articles={articles} />
    </div>
  );
}
