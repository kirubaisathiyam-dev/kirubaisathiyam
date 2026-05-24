import { loadAdminArticles } from "@/lib/admin-articles";
import NotificationsForm, {
  type NotificationArticle,
} from "./notifications-form";

export default function NotificationsPage() {
  const articles: NotificationArticle[] = loadAdminArticles();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
          Push Notifications
        </h1>
        <p className="max-w-2xl text-sm" style={{ color: "var(--muted-foreground)" }}>
          Send manual push notifications for today&apos;s verse, today&apos;s
          devotion, new articles, or a custom message.
        </p>
      </div>

      <NotificationsForm articles={articles} />
    </div>
  );
}
