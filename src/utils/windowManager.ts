/**
 * Opens a detached window for a specific listing using Tauri WebviewWindow or browser popup fallback.
 */
export async function openDetachedListingWindow(
  listingId: string,
  title: string
): Promise<boolean> {
  const url = `/?listingId=${encodeURIComponent(listingId)}`;
  const windowName = `listing_${listingId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  try {
    const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
    const webview = new WebviewWindow(windowName, {
      url,
      title: `Vatrio — ${title}`,
      width: 920,
      height: 720,
      resizable: true,
    });
    return !!webview;
  } catch {
    // Browser fallback
    const popup = window.open(
      url,
      windowName,
      'width=920,height=720,resizable=yes,scrollbars=yes'
    );
    return !!popup;
  }
}
