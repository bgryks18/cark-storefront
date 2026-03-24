import { MAX_AVATAR_BYTES, AVATAR_MIME_SET } from '@/lib/constants/avatarUpload';
import { adminGraphql } from '@/lib/shopify/admin';

/** Mağazada müşteri tanımı / Admin’de görünür olması için sabit namespace-key */
export const CUSTOMER_AVATAR_METAFIELD = {
  namespace: 'custom',
  key: 'avatar_url',
  type: 'single_line_text_field' as const,
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getCustomerAvatarUrlFromAdmin(email: string): Promise<string | null> {
  if (!process.env.SHOPIFY_ADMIN_CLIENT_ID) return null;

  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const query = `email:${normalized}`;
  const { data, errors } = await adminGraphql<{
    customers: {
      edges: {
        node: {
          id: string;
          email: string;
          metafield: { value: string } | null;
        };
      }[];
    };
  }>(
    `#graphql
    query CustomerAvatar($q: String!) {
      customers(first: 1, query: $q) {
        edges {
          node {
            id
            email
            metafield(namespace: "${CUSTOMER_AVATAR_METAFIELD.namespace}", key: "${CUSTOMER_AVATAR_METAFIELD.key}") {
              value
            }
          }
        }
      }
    }`,
    { q: query },
  );

  if (errors?.length) return null;
  const node = data?.customers?.edges?.[0]?.node;
  if (!node || normalizeEmail(node.email) !== normalized) return null;
  const v = node.metafield?.value?.trim();
  if (!v || !v.startsWith('http')) return null;
  return v;
}

async function findAdminCustomerGidForSessionEmail(email: string): Promise<string | null> {
  const normalized = normalizeEmail(email);
  const query = `email:${normalized}`;
  const { data, errors } = await adminGraphql<{
    customers: {
      edges: { node: { id: string; email: string } }[];
    };
  }>(
    `#graphql
    query FindCustomer($q: String!) {
      customers(first: 1, query: $q) {
        edges {
          node {
            id
            email
          }
        }
      }
    }`,
    { q: query },
  );

  if (errors?.length) return null;
  const node = data?.customers?.edges?.[0]?.node;
  if (!node || normalizeEmail(node.email) !== normalized) return null;
  return node.id;
}

const MEDIA_POLL_INTERVAL_MS = 400;
const MEDIA_POLL_MAX_ATTEMPTS = 25;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * fileCreate sonrası Shopify görseli bazen asenkron işler; READY olana kadar node sorgusu.
 */
async function waitForMediaImageCdnUrl(mediaImageGid: string): Promise<string | null> {
  const query = `#graphql
    query AvatarMediaPoll($id: ID!) {
      node(id: $id) {
        __typename
        ... on MediaImage {
          fileStatus
          image {
            url
          }
        }
      }
    }
  `;

  for (let i = 0; i < MEDIA_POLL_MAX_ATTEMPTS; i++) {
    const { data, errors } = await adminGraphql<{
      node: {
        __typename: string;
        fileStatus?: string;
        image?: { url: string | null } | null;
      } | null;
    }>(query, { id: mediaImageGid });

    if (errors?.length) return null;
    const node = data?.node;
    if (node?.__typename !== 'MediaImage') return null;

    if (node.fileStatus === 'FAILED') return null;

    const url = node.image?.url?.trim();
    if (url) return url;

    await sleep(MEDIA_POLL_INTERVAL_MS);
  }
  return null;
}

async function uploadImageViaStagedUploads(
  bytes: ArrayBuffer,
  filename: string,
  mimeType: string,
): Promise<string> {
  const stagedMutation = `#graphql
    mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const { data: stagedData, errors: stagedErrors } = await adminGraphql<{
    stagedUploadsCreate: {
      stagedTargets: {
        url: string;
        resourceUrl: string;
        parameters: { name: string; value: string }[];
      }[];
      userErrors: { message: string }[];
    };
  }>(stagedMutation, {
    input: [
      {
        filename,
        mimeType,
        httpMethod: 'POST',
        resource: 'IMAGE',
      },
    ],
  });

  if (stagedErrors?.length) {
    throw new Error(stagedErrors.map((e) => e.message).join(', '));
  }
  const userErrors = stagedData?.stagedUploadsCreate?.userErrors ?? [];
  if (userErrors.length) {
    throw new Error(userErrors.map((e) => e.message).join(', '));
  }

  const target = stagedData?.stagedUploadsCreate?.stagedTargets?.[0];
  if (!target?.url || !target.resourceUrl) {
    throw new Error('staged_upload_failed');
  }

  const form = new FormData();
  for (const p of target.parameters) {
    form.append(p.name, p.value);
  }
  form.append('file', new Blob([bytes], { type: mimeType }), filename);

  const up = await fetch(target.url, { method: 'POST', body: form });
  if (!up.ok) {
    throw new Error(`staged_upload_http_${up.status}`);
  }

  const fileCreateMutation = `#graphql
    mutation FileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          __typename
          ... on MediaImage {
            id
            fileStatus
            image {
              url
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const { data: fileData, errors: fileErrors } = await adminGraphql<{
    fileCreate: {
      files: ({
        __typename: string;
        id?: string;
        fileStatus?: string;
        image?: { url: string | null } | null;
      } | null)[];
      userErrors: { message: string }[];
    };
  }>(fileCreateMutation, {
    files: [
      {
        originalSource: target.resourceUrl,
        contentType: 'IMAGE',
      },
    ],
  });

  if (fileErrors?.length) {
    throw new Error(fileErrors.map((e) => e.message).join(', '));
  }
  const fe = fileData?.fileCreate?.userErrors ?? [];
  if (fe.length) {
    throw new Error(fe.map((e) => e.message).join(', '));
  }

  const file = fileData?.fileCreate?.files?.[0];
  if (!file || file.__typename !== 'MediaImage' || !file.id) {
    throw new Error('file_create_no_media');
  }

  const immediate = file.image?.url?.trim();
  if (immediate) return immediate;

  const polled = await waitForMediaImageCdnUrl(file.id);
  if (!polled) {
    throw new Error(
      file.fileStatus === 'FAILED' ? 'file_processing_failed' : 'file_create_timeout',
    );
  }
  return polled;
}

async function setAvatarMetafield(customerGid: string, imageUrl: string): Promise<void> {
  const mutation = `#graphql
    mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const { data, errors } = await adminGraphql<{
    metafieldsSet: {
      metafields: { id: string }[];
      userErrors: { message: string }[];
    };
  }>(mutation, {
    metafields: [
      {
        ownerId: customerGid,
        namespace: CUSTOMER_AVATAR_METAFIELD.namespace,
        key: CUSTOMER_AVATAR_METAFIELD.key,
        type: CUSTOMER_AVATAR_METAFIELD.type,
        value: imageUrl,
      },
    ],
  });

  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join(', '));
  }
  const ue = data?.metafieldsSet?.userErrors ?? [];
  if (ue.length) {
    throw new Error(ue.map((e) => e.message).join(', '));
  }
}

export type SaveCustomerAvatarResult =
  | { ok: true; avatarUrl: string }
  | { ok: false; code: 'config' | 'session' | 'validation' | 'not_found' | 'shopify'; message: string };

/**
 * Oturumdaki e-posta ile Admin müşterisini bulur; dosyayı Shopify Files’a yükler; avatar URL metafield yazar.
 * İstemciden müşteri id kabul edilmez.
 */
export async function saveCustomerAvatarForSessionEmail(
  sessionEmail: string,
  file: File,
): Promise<SaveCustomerAvatarResult> {
  if (!process.env.SHOPIFY_ADMIN_CLIENT_ID || !process.env.SHOPIFY_ADMIN_CLIENT_SECRET) {
    return { ok: false, code: 'config', message: 'admin_not_configured' };
  }

  const email = normalizeEmail(sessionEmail);
  if (!email) {
    return { ok: false, code: 'session', message: 'no_email' };
  }

  if (!file || typeof file.size !== 'number' || file.size === 0) {
    return { ok: false, code: 'validation', message: 'no_file' };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, code: 'validation', message: 'file_too_large' };
  }

  const mimeType = file.type || 'application/octet-stream';
  if (!AVATAR_MIME_SET.has(mimeType)) {
    return { ok: false, code: 'validation', message: 'invalid_type' };
  }

  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const filename = `avatar-${Date.now()}.${ext}`;

  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    return { ok: false, code: 'validation', message: 'read_failed' };
  }

  let customerGid: string | null;
  try {
    customerGid = await findAdminCustomerGidForSessionEmail(email);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'shopify_error';
    return { ok: false, code: 'shopify', message: msg };
  }

  if (!customerGid) {
    return { ok: false, code: 'not_found', message: 'customer_not_found' };
  }

  let imageUrl: string;
  try {
    imageUrl = await uploadImageViaStagedUploads(bytes, filename, mimeType);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upload_failed';
    return { ok: false, code: 'shopify', message: msg };
  }

  try {
    await setAvatarMetafield(customerGid, imageUrl);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'metafield_failed';
    return { ok: false, code: 'shopify', message: msg };
  }

  return { ok: true, avatarUrl: imageUrl };
}
