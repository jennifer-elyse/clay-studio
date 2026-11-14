/**
 * @param {object} event
 * @param {object} sink
 * @param {(seat: object) => void} sink.setSeat
 * @param {(status: string) => void} sink.setPreviewStatus
 * @param {(url: string) => void} sink.setPreviewUrl
 * @param {(update: [] | ((list: object[]) => object[])) => void} sink.setEvents
 * @param {(busy: boolean) => void} sink.setBusy
 */
export function applyStudioEvent(event, sink) {
  if (event.type === "seat" && event.seat) sink.setSeat(event.seat);
  if (event.type === "preview" && event.preview) {
    sink.setPreviewStatus(event.preview.status);
    if (event.preview.url) sink.setPreviewUrl(event.preview.url);
  }
  if (event.type === "clear") {
    sink.setEvents([]);
    sink.setBusy(false);
    return;
  }
  if (event.type === "run_started") sink.setBusy(true);
  if (event.type === "run_finished" || event.type === "error") sink.setBusy(false);
  sink.setEvents((list) => [...list, event]);
}
