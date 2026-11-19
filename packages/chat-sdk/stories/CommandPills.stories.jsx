import { CommandPills } from "../src/CommandPills.jsx";
const meta = { title: "Clay/CommandPills", component: CommandPills };
export default meta;

export const Default = {
  render: () => (
    <div className="clay-root" style={{ padding: 24 }}>
      <CommandPills onPick={() => undefined} onSend={() => undefined} />
    </div>
  ),
};

export const Busy = {
  render: () => (
    <div className="clay-root" style={{ padding: 24 }}>
      <CommandPills onPick={() => undefined} onSend={() => undefined} busy />
    </div>
  ),
};

export const Finished = {
  render: () => (
    <div className="clay-root" style={{ padding: 24 }}>
      <CommandPills onPick={() => undefined} onSend={() => undefined} done={{ plan: true, build: true }} />
    </div>
  ),
};
