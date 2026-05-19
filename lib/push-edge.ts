type ServiceAccountConfig = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

type FirestoreValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { timestampValue: string };

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

export type PushSubscriptionRecord = {
  documentName: string;
  token: string;
};

export type PushMessage = {
  title: string;
  body?: string;
  url?: string;
  image?: string;
};

const tokenEndpoint = "https://oauth2.googleapis.com/token";
const cloudPlatformScope = "https://www.googleapis.com/auth/cloud-platform";
const subscriptionsCollection = "pushSubscriptions";

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

function getServiceAccountConfig(): ServiceAccountConfig {
  const projectId =
    process.env.FCM_SERVICE_ACCOUNT_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "";
  const clientEmail = process.env.FCM_SERVICE_ACCOUNT_CLIENT_EMAIL || "";
  const privateKey =
    process.env.FCM_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64
      ? atob(process.env.FCM_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64)
      : (process.env.FCM_SERVICE_ACCOUNT_PRIVATE_KEY || "").replaceAll(
          "\\n",
          "\n",
        );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing FCM service account env vars. Set FCM_SERVICE_ACCOUNT_PROJECT_ID, FCM_SERVICE_ACCOUNT_CLIENT_EMAIL, and FCM_SERVICE_ACCOUNT_PRIVATE_KEY.",
    );
  }

  return { projectId, clientEmail, privateKey };
}

function base64UrlEncode(value: string | Uint8Array) {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function importPrivateKey(privateKey: string) {
  const keyData = privateKey
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  return crypto.subtle.importKey(
    "pkcs8",
    base64ToBytes(keyData),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function createServiceAccountJwt(config: ServiceAccountConfig) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64UrlEncode(
    JSON.stringify({
      iss: config.clientEmail,
      scope: cloudPlatformScope,
      aud: tokenEndpoint,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsignedJwt = `${header}.${claim}`;
  const key = await importPrivateKey(config.privateKey);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedJwt),
  );

  return `${unsignedJwt}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function getGoogleAccessToken() {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token;
  }

  const config = getServiceAccountConfig();
  const assertion = await createServiceAccountJwt(config);
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | { access_token?: string; expires_in?: number; error_description?: string }
    | null;

  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description || "Unable to authorize Firebase.");
  }

  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };

  return data.access_token;
}

export function getFirebaseProjectId() {
  return getServiceAccountConfig().projectId;
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function firestoreBaseUrl(projectId: string) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

function readStringField(document: FirestoreDocument, fieldName: string) {
  const field = document.fields?.[fieldName];
  return field && "stringValue" in field ? field.stringValue : "";
}

export async function savePushSubscription(token: string, userAgent: string) {
  const projectId = getFirebaseProjectId();
  const accessToken = await getGoogleAccessToken();
  const documentId = await sha256Hex(token);
  const now = new Date().toISOString();
  const url = `${firestoreBaseUrl(projectId)}/${subscriptionsCollection}/${documentId}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        token: { stringValue: token },
        userAgent: { stringValue: userAgent.slice(0, 500) },
        enabled: { booleanValue: true },
        updatedAt: { timestampValue: now },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Unable to save push token: ${response.status} ${errorText}`);
  }
}

export async function listPushSubscriptions() {
  const projectId = getFirebaseProjectId();
  const accessToken = await getGoogleAccessToken();
  const records: PushSubscriptionRecord[] = [];
  let pageToken = "";

  do {
    const params = new URLSearchParams({ pageSize: "300" });
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await fetch(
      `${firestoreBaseUrl(projectId)}/${subscriptionsCollection}?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const data = (await response.json().catch(() => null)) as
      | { documents?: FirestoreDocument[]; nextPageToken?: string }
      | null;

    if (!response.ok) {
      throw new Error("Unable to load push subscribers.");
    }

    for (const document of data?.documents || []) {
      const token = readStringField(document, "token");
      if (token) {
        records.push({ documentName: document.name, token });
      }
    }

    pageToken = data?.nextPageToken || "";
  } while (pageToken);

  return records;
}

export async function deletePushSubscription(documentName: string) {
  const accessToken = await getGoogleAccessToken();
  await fetch(`https://firestore.googleapis.com/v1/${documentName}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function sendPushToToken(token: string, message: PushMessage) {
  const projectId = getFirebaseProjectId();
  const accessToken = await getGoogleAccessToken();
  const siteUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
  const link = message.url
    ? message.url.startsWith("http")
      ? message.url
      : `${siteUrl}${message.url.startsWith("/") ? "" : "/"}${message.url}`
    : siteUrl || "/";
  const icon = siteUrl ? `${siteUrl}/web-app-manifest-192x192.png` : "/web-app-manifest-192x192.png";
  const badge = siteUrl
    ? `${siteUrl}/notification-badge.svg`
    : "/notification-badge.svg";

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: {
            title: message.title,
            body: message.body || "",
            ...(message.image ? { image: message.image } : {}),
          },
          webpush: {
            fcm_options: { link },
            notification: {
              icon,
              badge,
              ...(message.image ? { image: message.image } : {}),
            },
          },
          data: {
            url: link,
          },
        },
      }),
    },
  );

  const data = (await response.json().catch(() => null)) as
    | { error?: { status?: string; message?: string } }
    | null;

  if (!response.ok) {
    const status = data?.error?.status || "";
    const messageText = data?.error?.message || "Push send failed.";
    const invalid =
      status === "NOT_FOUND" ||
      status === "INVALID_ARGUMENT" ||
      messageText.toLowerCase().includes("registration token");

    return { ok: false, invalid, error: messageText };
  }

  return { ok: true, invalid: false, error: "" };
}
