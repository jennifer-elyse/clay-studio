import { ChatPane } from "./ChatPane.jsx";
import { ClayHeader } from "./ClayHeader.jsx";
import { PreviewPane } from "./PreviewPane.jsx";
import { SeatModal } from "./SeatModal.jsx";
import { useClaySession } from "./use-clay-session.js";
import "./tokens.css";
import "./ClayChat.css";

/** @param {import("./use-clay-session.js").ClayChatProps} props */
export function ClayChat(props) {
  const session = useClaySession(props);
  return (
    <div className="clay-root">
      <div className={`clay-shell${session.minimized ? " is-minimized" : ""}`}>
        <ClayHeader
          clip={session.clip}
          minimized={session.minimized}
          seat={props.seat}
          onToggle={() => session.setMinimized((value) => !value)}
          onOpenSeats={() => session.openSeats(props.seat?.provider)}
        />
        <ChatPane
          hidden={session.minimized}
          items={session.items}
          steps={session.steps}
          working={session.working}
          clip={session.clip}
          run={session.run}
          draft={session.draft}
          onDraft={session.setDraft}
          onSend={session.send}
          onPick={session.pick}
          onSeats={() => session.openSeats()}
          thinkFirst={session.thinkFirst}
          onApprove={props.onApprovePlan}
          onAdjust={() => session.adjust()}
        />
        <PreviewPane url={props.previewUrl} status={props.previewStatus} debug={session.debug} log={props.log} />
        <SeatModal
          open={session.seatsOpen}
          product={session.seatProduct}
          current={props.seat?.provider}
          onProduct={session.setSeatProduct}
          onUse={session.useSeat}
          onClose={() => session.setSeatsOpen(false)}
        />
      </div>
    </div>
  );
}
