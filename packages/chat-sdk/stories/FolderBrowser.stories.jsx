import { FolderBrowser } from "../src/FolderBrowser.jsx";
import "../src/ClayChat.css";

const meta = { title: "Clay/FolderBrowser", component: FolderBrowser };
export default meta;

const entries = [
  { name: "frostly", path: "/Users/me/Projects/frostly" },
  { name: "studio-app", path: "/Users/me/Projects/studio-app" },
];

/** New project folder defaults to Projects plus the slugged name. */
export const NewProject = {
  args: {
    path: "/Users/me/Projects",
    parent: "/Users/me",
    selected: "/Users/me/Projects/route-board",
    entries,
    projectFolders: ["studio-app"],
    pending: "route-board",
    onOpen: () => undefined,
  },
};
