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

function resolveImageUrl(image: string, baseUrl?: string) {
  const trimmed = image.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (!baseUrl) return "";
  if (trimmed.startsWith("/")) return `${baseUrl}${trimmed}`;
  return `${baseUrl}/${trimmed}`;
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

  let payload: {
    slug?: unknown;
    title?: unknown;
    content?: unknown;
    summary?: unknown;
    image?: unknown;
  } = {};

  try {
    payload = (await request.json()) as {
      slug?: unknown;
      title?: unknown;
      content?: unknown;
      summary?: unknown;
      image?: unknown;
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
  const summary =
    typeof payload.summary === "string" ? payload.summary.trim() : "";
  const image =
    typeof payload.image === "string" ? payload.image.trim() : "";

  if (!slug || !content) {
    return NextResponse.json(
      { ok: false, error: "Missing article data" },
      { status: 400 },
    );
  }

  const excerpt = summary || getExcerpt(content);
  const readMoreUrl = baseUrl
    ? `${baseUrl}/articles/${slug}`
    : `/articles/${slug}`;

  const safeTitle = escapeHtml(title);
  const safeExcerpt = escapeHtml(excerpt);
  const safeLink = escapeHtml(readMoreUrl);
  const imageUrl = image ? resolveImageUrl(image, baseUrl) : "";
  const safeImageUrl = imageUrl ? escapeHtml(imageUrl) : "";
  const logoUrl = baseUrl ? resolveImageUrl("/logo.png", baseUrl) : "";
  const safeLogoUrl = logoUrl ? escapeHtml(logoUrl) : "";
  const headerLink = baseUrl || "/";
  const safeHeaderLink = escapeHtml(headerLink);

  const htmlContent = [
    `<!doctype html>`,
    `<html lang="ta">`,
    `<head>`,
    `<meta charset="utf-8" />`,
    `<meta name="viewport" content="width=device-width, initial-scale=1" />`,
    `<title>${safeTitle}</title>`,
    `</head>`,
    `<body style="margin:0;padding:0;background:#ffffff;color:#171717;font-family:'Noto Serif Tamil','Times New Roman',serif;">`,
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;">`,
    `<tr>`,
    `<td align="center">`,
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;border:1px solid #e5e7eb;padding:24px;">`,
    `<tr>`,
    `<td>`,
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">`,
    `<tr>`,
    `<td style="vertical-align:middle;">`,
    safeLogoUrl
      ? `<a href="${safeHeaderLink}" style="display:inline-block;text-decoration:none;"><img src="${safeLogoUrl}" alt="Kirubai Sathiyam logo" width="36" height="36" style="display:block;border:0;outline:none;text-decoration:none;" /></a>`
      : "",
    `</td>`,
    `<td style="vertical-align:middle;padding-left:6px;font-size:20px;line-height:1.2;font-weight:700;color:#171717;letter-spacing:-0.01em;">`,
    `<a href="${safeHeaderLink}" style="text-decoration:none;color:#171717;">கிருபை <span style="color:#c48900;">சத்தியம்</span></a>`,
    `</td>`,
    `</tr>`,
    `</table>`,
    `<h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;font-weight:700;color:#171717;">${safeTitle}</h1>`,
    safeImageUrl
      ? `<img src="${safeImageUrl}" alt="${safeTitle}" style="width:100%;height:auto;display:block;margin:0 0 16px;" />`
      : "",
    safeExcerpt
      ? `<p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#171717;">${safeExcerpt.replaceAll("\n", "<br />")}</p>`
      : "",
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0;">`,
    `<tr>`,
    `<td align="center" style="background:#171717;padding:12px 18px;">`,
    `<a href="${safeLink}" style="display:block;text-decoration:none;font-size:14px;font-weight:600;color:#ffffff;">மேலும் வாசிக்க</a>`,
    `</td>`,
    `</tr>`,
    `</table>`,
    `<p style="margin:24px 0 0;font-size:12px;color:#6b7280;">kirubaisathiyam.org</p>`,
    `</td>`,
    `</tr>`,
    `</table>`,
    `</td>`,
    `</tr>`,
    `</table>`,
    `</body>`,
    `</html>`,
  ]
    .filter(Boolean)
    .join("");

  const textContent = [
    title,
    excerpt,
    `மேலும் வாசிக்க: ${readMoreUrl}`,
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
