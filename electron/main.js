const { app, BrowserWindow, nativeTheme, shell } = require("electron");
const path = require("node:path");
const { fileURLToPath } = require("node:url");

function createWindow() {
  nativeTheme.themeSource = "light";

  const window = new BrowserWindow({
    width: 1480,
    height: 980,
    minWidth: 1100,
    minHeight: 760,
    backgroundColor: "#ded4c4",
    title: "Negative Lab Converter",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:")) {
      shell.openExternal(url);
      return { action: "deny" };
    }

    if (url.startsWith("file:")) {
      shell.openPath(fileURLToPath(url));
      return { action: "deny" };
    }

    return { action: "allow" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (url === window.webContents.getURL()) {
      return;
    }

    event.preventDefault();

    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:")) {
      shell.openExternal(url);
    }
  });

  window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

app.whenReady().then(() => {
  app.setName("Negative Lab Converter");

  if (process.platform === "win32") {
    app.setAppUserModelId("com.negativelab.converter");
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
