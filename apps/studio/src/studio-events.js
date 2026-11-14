/**
 * @param {object} event
 * @param {object} sink
 * @param {(seat: object) => void} sink.setSeat
 * @param {(status: string) => void} sink.setPreviewStatus
 * @param {(url: string) => void} sink.setPreviewUrl
 * @param {(message: string) => void} [sink.setPreviewMessage]
 * @param {(update: [] | ((list: object[]) => object[])) => void} sink.setEvents
 * @param {(busy: boolean) => void} sink.setBusy
 */
export function applyStudioEvent(event, sink) {
  if (event.type === "seat" && event.seat) sink.setSeat(event.seat);
  if (event.type === "preview" && event.preview) {
    const status = event.preview.status;
    const failed = status === "error" || status === "stopped";
    sink.setPreviewStatus(status);
    sink.setPreviewUrl(failed || status === "starting" ? "" : event.preview.url ?? "");
    sink.setPreviewMessage?.(failed ? event.preview.message ?? "The app didn't start." : "");
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
