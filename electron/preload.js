const { contextBridge } = require("electron");
const packageJson = require("../package.json");

contextBridge.exposeInMainWorld("nlcDesktop", {
  appName: "Negative Lab Converter",
  appVersion: packageJson.version,
  isDesktop: true,
  platform: process.platform,
  versions: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    node: process.versions.node,
  },
});
