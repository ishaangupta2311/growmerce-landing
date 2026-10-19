/** A store page's address. Store ids carry a colon, so they are encoded. */
export function storeHref(appId: string, storeId: string): string {
  return `/admin/apps/${appId}/stores/${encodeURIComponent(storeId)}`;
}
