/** A store page's address. Store ids carry a colon, so they are encoded. */
export function storeHref(appId: string, storeId: string): string {
  return `/admin/apps/${appId}/stores/${encodeURIComponent(storeId)}`;
}

/**
 * The store id back out of its address segment. Next hands the segment over
 * with the colon still encoded ("shopify%3Anorthwind…"; checked on Next 16),
 * so it is decoded here. A malformed segment is kept as it came and simply
 * matches no store.
 */
export function storeIdFromSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
