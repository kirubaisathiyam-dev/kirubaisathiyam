import { NextResponse } from "next/server";

export const runtime = "edge";

const listContactsLimit = 500;
const sendBatchSize = 100;

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

  let payload: { slug?: unknown; title?: unknown; content?: unknown } = {};

  try {
    payload = (await request.json()) as {
      slug?: unknown;
      title?: unknown;
      content?: unknown;
    };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const slug =
    typeof payload.slug === "string" ? payload.slug.trim() : "";
  const title =
    typeof payload.title === "string" && payload.title.trim()
      ? payload.title.trim()
      : slug;
  const content =
    typeof payload.content === "string" ? payload.content : "";

  if (!slug || !content) {
    return NextResponse.json(
      { ok: false, error: "Missing article data" },
      { status: 400 },
    );
  }

  const excerpt = getExcerpt(content);
  const readMoreUrl = baseUrl
    ? `${baseUrl}/articles/${slug}`
    : `/articles/${slug}`;

  const safeTitle = escapeHtml(title);
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
    title,
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
        subject: title,
        htmlContent,
        textContent,
        bcc: batch,
      });
    }

    return NextResponse.json({
      ok: true,
      sent: recipients.length,
      article: slug,
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
