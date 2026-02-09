import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { NextResponse } from "next/server";

type ArticleData = {
  title?: unknown;
  date?: unknown;
  author?: unknown;
  send_newsletter?: unknown;
};

type LatestArticle = {
  slug: string;
  title: string;
  date: Date;
  content: string;
  sendNewsletter: boolean;
};

const articlesDirectory = path.join(process.cwd(), "content/articles");
const listContactsLimit = 500;
const sendBatchSize = 100;

function parseDate(value: unknown, fallback: Date) {
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  return fallback;
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getExcerpt(content: string) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.slice(0, 3).join("\n");
}

function getLatestArticle(): LatestArticle | null {
  if (!fs.existsSync(articlesDirectory)) {
    return null;
  }

  const fileNames = fs
    .readdirSync(articlesDirectory)
    .filter((fileName) => fileName.endsWith(".md"));

  let latest: LatestArticle | null = null;

  for (const fileName of fileNames) {
    const slug = fileName.replace(/\.md$/, "");
    const fullPath = path.join(articlesDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);
    const { title, date, send_newsletter } = data as ArticleData;
    const stats = fs.statSync(fullPath);
    const articleDate = parseDate(date, stats.mtime);

    const candidate: LatestArticle = {
      slug,
      title: typeof title === "string" ? title : slug,
      date: articleDate,
      content,
      sendNewsletter: send_newsletter === true,
    };

    if (!latest || candidate.date > latest.date) {
      latest = candidate;
    }
  }

  return latest;
}

async function fetchListContacts(listId: number, apiKey: string) {
  const contacts: { email?: string }[] = [];
  let offset = 0;

  while (true) {
    const response = await fetch(
      `https://api.brevo.com/v3/contacts/lists/${listId}/contacts?limit=${listContactsLimit}&offset=${offset}`,
      {
        headers: {
          Accept: "application/json",
          "api-key": apiKey,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch contacts: ${response.status} ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      contacts?: { email?: string }[];
      count?: number;
    };

    const batch = Array.isArray(data.contacts) ? data.contacts : [];
    contacts.push(...batch);

    offset += listContactsLimit;
    const totalCount =
      typeof data.count === "number" ? data.count : contacts.length;

    if (contacts.length >= totalCount || batch.length === 0) {
      break;
    }
  }

  return contacts;
}

async function sendEmailBatch(options: {
  apiKey: string;
  senderEmail: string;
  senderName: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  bcc: string[];
}) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": options.apiKey,
    },
    body: JSON.stringify({
      sender: {
        email: options.senderEmail,
        name: options.senderName,
      },
      to: [{ email: options.senderEmail, name: options.senderName }],
      bcc: options.bcc.map((email) => ({ email })),
      subject: options.subject,
      htmlContent: options.htmlContent,
      textContent: options.textContent,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send email: ${response.status} ${errorText}`);
  }
}

export async function POST(request: Request) {
  const adminKey = process.env.NEWSLETTER_ADMIN_KEY;
  const providedKey = request.headers.get("x-admin-key");

  if (adminKey && providedKey !== adminKey) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listIdRaw = process.env.BREVO_LIST_ID;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "Newsletter";
  const baseUrl = process.env.SITE_URL?.replace(/\/$/, "");

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Missing BREVO_API_KEY" },
      { status: 500 },
    );
  }

  if (!listIdRaw || !Number.isFinite(Number(listIdRaw))) {
    return NextResponse.json(
      { ok: false, error: "Missing BREVO_LIST_ID" },
      { status: 500 },
    );
  }

  if (!senderEmail) {
    return NextResponse.json(
      { ok: false, error: "Missing BREVO_SENDER_EMAIL" },
      { status: 500 },
    );
  }

  const latest = getLatestArticle();
  if (!latest) {
    return NextResponse.json(
      { ok: false, error: "No articles found" },
      { status: 404 },
    );
  }

  if (!latest.sendNewsletter) {
    return NextResponse.json(
      { ok: false, error: "Latest article not marked for newsletter" },
      { status: 400 },
    );
  }

  const excerpt = getExcerpt(latest.content);
  const readMoreUrl = baseUrl
    ? `${baseUrl}/articles/${latest.slug}`
    : `/articles/${latest.slug}`;

  const safeTitle = escapeHtml(latest.title);
  const safeExcerpt = escapeHtml(excerpt);
  const safeLink = escapeHtml(readMoreUrl);

  const htmlContent = [
    `<h1>${safeTitle}</h1>`,
    safeExcerpt ? `<p>${safeExcerpt.replaceAll("\n", "<br />")}</p>` : "",
    `<p><a href="${safeLink}">Read more</a></p>`,
  ]
    .filter(Boolean)
    .join("");

  const textContent = [
    latest.title,
    excerpt,
    `Read more: ${readMoreUrl}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const contacts = await fetchListContacts(Number(listIdRaw), apiKey);
    const recipients = contacts
      .map((contact) => contact.email)
      .filter((email): email is string => Boolean(email));

    if (recipients.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No contacts in list" },
        { status: 400 },
      );
    }

    for (let i = 0; i < recipients.length; i += sendBatchSize) {
      const batch = recipients.slice(i, i + sendBatchSize);
      await sendEmailBatch({
        apiKey,
        senderEmail,
        senderName,
        subject: latest.title,
        htmlContent,
        textContent,
        bcc: batch,
      });
    }

    return NextResponse.json({
      ok: true,
      sent: recipients.length,
      article: latest.slug,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Newsletter send failed";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 502 },
    );
  }
}
