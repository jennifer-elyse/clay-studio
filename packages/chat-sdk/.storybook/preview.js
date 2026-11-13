import "../src/tokens.css";
import "../src/ClayChat.css";

/** @type {import("@storybook/react").Preview} */
const preview = {
  parameters: {
    backgrounds: { default: "sand", values: [{ name: "sand", value: "#f7e4c8" }] },
  },
};

export default preview;
