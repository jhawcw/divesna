const { app, BrowserWindow, ipcMain, Menu, screen } = require("electron");
const path = require("path");
const isDev = import("electron-is-dev");
const si = require("systeminformation");

// THIS IS HOT MODULE RELOAD, FOR DEVELOPMENT USAGE ONLY
if (isDev) {
  try {
    const electronReload = require("electron-reloader")(module);
  } catch (err) {
    console.log(err);
  }
}

// // promises style - new since version 3
// si.cpu()
//   .then((data) => console.log(data))
// aaa
//   .catch((error) => console.error(error));

const devices = [
  {
    school: "edgefield secondary school",
    name: "tan ah gao",
    uuid: "12343-invalid-1234234-99999",
    serial: "123456789",
  },
  {
    school: "dive analytics",
    name: "jason haw chin wei",
    uuid: "fd4a2adf-8cea-5adc-89d1-78a2643b76ee",
    serial: "M903LH9YXT",
  },
  {
    school: "jason windows",
    name: "jason haw chin wei",
    uuid: "f0960000-0000-1000-8000-d49390141869",
    serial: "NKNP50PNJ00000002F00113",
  },
];

const windowDimension = {
  width: 1200,
  height: 1000,
};

const system = si.system().then((res) => console.log(res)); // get the uuid, serial number may result in conflict instead

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: windowDimension.width,
    height: windowDimension.height,
    // webPreferences: {
    //   preload: path.join(__dirname, "preload.js"),
    // },
  });
  const system = await si.system();

  if (isDev) {
    // console.log("running in development");
    // console.log(system);
    if (system.serial !== devices[2].serial || system.uuid !== devices[2].uuid) {
      console.log("uuid and serial doesnt match");
      mainWindow.loadFile(path.join(__dirname, "error.html"));
    } else {
      // mainWindow.loadFile(path.join(__dirname, "result-app", "public", "index.html")); // react app
      console.log("uuid and serial matches");
      mainWindow.loadFile(path.join(__dirname, "edgefield-sna-2024", "index.html")); // original sna app
    }
  } else {
    // mainWindow.loadFile(path.join(__dirname, "result-app", "build", "index.html")); // react app
    mainWindow.loadFile(path.join(__dirname, "edgefield-sna-2024", "index.html"));
    // console.log("running in production");
  }

  mainWindow.webContents.openDevTools();
  // mainWindow.webContents.reloadIgnoringCache();
}

app.whenReady().then(async () => {
  ipcMain.handle("ping", () => "pong");
  await createWindow();
  // Menu.setApplicationMenu(null);

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// darwin === macOS
// linux === linux
// win32 === windows

// when electron js executes, "[64067:0408/104138.282249:ERROR:CONSOLE(1)] "Request Autofill.enable failed. {"code":-32601,"message":"'Autofill.enable' wasn't found"}", source: devtools://devtools/bundled/core/protocol_client/protocol_client.js (1)" will be fired, this is a known issue and the developers has set it to "wontfix" since it does not affect the functionality.
