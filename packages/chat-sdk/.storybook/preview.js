import "../src/styles/main.scss";

/** @type {import("@storybook/react").Preview} */
const preview = {
  parameters: {
    backgrounds: { default: "sand", values: [{ name: "sand", value: "#f7e4c8" }] },
  },
};

export default preview;
