import { useRef } from "react";
import { SettingsHeader } from "./SettingsHeader.jsx";
import { SettingsPanel } from "./SettingsPanel.jsx";
import { SettingsTabs } from "./SettingsTabs.jsx";
import { useDismiss } from "./use-dismiss.js";

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} props.section
 * @param {(id: string) => void} props.onSection
 * @param {string} [props.product]
 * @param {string} [props.current]
 * @param {boolean} [props.busy]
 * @param {string} [props.projectsRoot]
 * @param {(id: string) => void} props.onProduct
 * @param {(id: string) => void} props.onUse
 * @param {object | null} [props.seatSettings]
 * @param {(input: object) => Promise<{ ok: boolean, message?: string }>} [props.onSaveSettings]
 * @param {() => void} props.onClose
 */
export function SettingsModal(props) {
  const dialog = useRef(/** @type {HTMLDivElement | null} */ (null));
  useDismiss(props.open, dialog, props.onClose);
  if (!props.open) return null;
  const seat = {
    product: props.product ?? "",
    current: props.current ?? "",
    busy: props.busy ?? false,
    seatSettings: props.seatSettings ?? null,
    onProduct: props.onProduct,
    onUse: props.onUse,
  };
  return (
    <div className="clay-modal-backdrop">
      <div ref={dialog} className="clay-modal clay-settings-modal" role="dialog" aria-modal="true" aria-labelledby="clay-settings-title">
        <SettingsHeader onClose={props.onClose} />
        <div className="clay-settings-body">
          <SettingsTabs section={props.section} onSection={props.onSection} />
          <SettingsPanel section={props.section} projectsRoot={props.projectsRoot ?? ""} onClose={props.onClose} seat={seat} onSaveSettings={props.onSaveSettings} />
        </div>
      </div>
    </div>
  );
}
