/** @type {import("@storybook/react-vite").StorybookConfig} */
const config = {
  stories: ["../stories/**/*.stories.jsx"],
  addons: ["@storybook/addon-essentials"],
  framework: { name: "@storybook/react-vite", options: {} },
  staticDirs: [
    { from: "../../../apps/studio/public/assets/animations", to: "/assets/animations" },
  ],
};

export default config;
