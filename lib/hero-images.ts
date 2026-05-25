import {
  getFirebaseProjectId,
  getGoogleAccessToken,
} from "@/lib/push-edge";
import {
  getUnsplashImage,
  type UnsplashContext,
  type UnsplashImage,
} from "@/lib/unsplash";

type FirestoreValue =
  | { stringValue: string }
  | { timestampValue: string };

type FirestoreDocument = {
  fields?: Record<string, FirestoreValue>;
};

const heroImagesCollection = "heroImages";

function firestoreBaseUrl(projectId: string) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

function getDocumentId(context: UnsplashContext, cacheKey: string) {
  return `${context}-${cacheKey}`;
}

function getStringValue(
  document: FirestoreDocument | null,
  fieldName: string,
): string {
  const field = document?.fields?.[fieldName];
  return field && "stringValue" in field ? field.stringValue : "";
}

function toStoredImage(document: FirestoreDocument | null): UnsplashImage | null {
  const url = getStringValue(document, "url");
  if (!url) {
    return null;
  }

  const photographerName = getStringValue(document, "photographerName");
  const photographerUrl = getStringValue(document, "photographerUrl");
  const unsplashUrl = getStringValue(document, "unsplashUrl");

  return {
    url,
    photographerName: photographerName || null,
    photographerUrl: photographerUrl || null,
    unsplashUrl: unsplashUrl || null,
  };
}

function toFirestoreFields(
  context: UnsplashContext,
  cacheKey: string,
  image: UnsplashImage,
) {
  return {
    context: { stringValue: context },
    cacheKey: { stringValue: cacheKey },
    url: { stringValue: image.url },
    photographerName: { stringValue: image.photographerName || "" },
    photographerUrl: { stringValue: image.photographerUrl || "" },
    unsplashUrl: { stringValue: image.unsplashUrl || "" },
    updatedAt: { timestampValue: new Date().toISOString() },
  } satisfies Record<string, FirestoreValue>;
}

function canPersistHeroImages() {
  return Boolean(
    process.env.FCM_SERVICE_ACCOUNT_CLIENT_EMAIL &&
      (process.env.FCM_SERVICE_ACCOUNT_PRIVATE_KEY ||
        process.env.FCM_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64) &&
      (process.env.FCM_SERVICE_ACCOUNT_PROJECT_ID ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  );
}

async function readHeroImageRecord(
  context: UnsplashContext,
  cacheKey: string,
): Promise<UnsplashImage | null> {
  if (!canPersistHeroImages()) {
    return null;
  }

  const projectId = getFirebaseProjectId();
  const accessToken = await getGoogleAccessToken();
  const documentId = getDocumentId(context, cacheKey);
  const response = await fetch(
    `${firestoreBaseUrl(projectId)}/${heroImagesCollection}/${documentId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to load hero image record.");
  }

  const document = (await response.json().catch(() => null)) as
    | FirestoreDocument
    | null;

  return toStoredImage(document);
}

async function createHeroImageRecord(
  context: UnsplashContext,
  cacheKey: string,
  image: UnsplashImage,
): Promise<UnsplashImage> {
  if (!canPersistHeroImages()) {
    return image;
  }

  const projectId = getFirebaseProjectId();
  const accessToken = await getGoogleAccessToken();
  const documentId = getDocumentId(context, cacheKey);
  const response = await fetch(
    `${firestoreBaseUrl(projectId)}/${heroImagesCollection}?documentId=${encodeURIComponent(documentId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: toFirestoreFields(context, cacheKey, image),
      }),
    },
  );

  if (response.ok) {
    return image;
  }

  if (response.status === 409) {
    const existingImage = await readHeroImageRecord(context, cacheKey);
    if (existingImage) {
      return existingImage;
    }
  }

  throw new Error("Unable to save hero image record.");
}

export async function getStoredHeroImage(
  context: UnsplashContext,
  cacheKey: string,
): Promise<UnsplashImage | null> {
  try {
    return await readHeroImageRecord(context, cacheKey);
  } catch {
    return null;
  }
}

export async function getOrCreateHeroImage(
  context: UnsplashContext,
  cacheKey: string,
): Promise<UnsplashImage> {
  const storedImage = await getStoredHeroImage(context, cacheKey);
  if (storedImage?.url) {
    return storedImage;
  }

  const freshImage = await getUnsplashImage(context, cacheKey);

  try {
    return await createHeroImageRecord(context, cacheKey, freshImage);
  } catch {
    return freshImage;
  }
}
