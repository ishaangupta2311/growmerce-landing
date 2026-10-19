/** A store page's address. Store ids carry a colon, so they are encoded. */
export function storeHref(appId: string, storeId: string): string {
  return `/admin/apps/${appId}/stores/${encodeURIComponent(storeId)}`;
}

/**
 * The store id back out of the address segment. Tolerates a segment that
 * arrives already decoded, and refuses a malformed one rather than throwing.
 */
export function storeIdFromSegment(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}
