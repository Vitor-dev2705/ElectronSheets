const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("fs");
const { spawn } = require("child_process");

let win;

async function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 800,
    icon: path.join(__dirname, "../assets/images/electronsheets.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  win.loadFile(path.join(__dirname, "../renderer/templates/index.html"));
  win.webContents.openDevTools();

  // Evento para fechar a janela e parar inserção
  win.on("close", () => {
    console.log("Janela fechada, encerrando inserção.");
    app.quit();
  });

  // Carregar o arquivo JSON e enviar para o front-end quando a janela carregar
  win.webContents.on("did-finish-load", () => {
    const jsonPath = path.join(__dirname, "../assets/docs/cargos.json");
    fs.readFile(jsonPath, "utf-8", (err, data) => {
      if (err) {
        console.error("Erro ao ler o arquivo JSON:", err);
        win.webContents.send("fromMain", {
          error: "Erro ao ler o arquivo JSON",
        });
      } else {
        try {
          const response = JSON.parse(data);
          win.webContents.send("fromMain", response);
        } catch (parseError) {
          console.error("Erro ao parsear o JSON:", parseError);
          win.webContents.send("fromMain", { error: "Erro ao parsear o JSON" });
        }
      }
    });
    
  });
}

// Criar a janela quando o app estiver pronto

ipcMain.on("toMain", (event, input_field) => {
  console.log("Dados recebidos no Electron:", input_field);

  // Garantir que o objeto JSON seja corretamente codificado
  const jsonString = JSON.stringify(input_field, null, 2); // Converte o objeto para JSON formatado

  // Garantir que os dados sejam enviados como UTF-8
  const pythonProcess = spawn("python", [path.join(__dirname, "insert.py")], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      LANG: "en_US.UTF-8", // Define a codificação no ambiente do processo Python
    },
  });

  pythonProcess.stdin.write(jsonString, "utf-8"); // Enviar JSON codificado como UTF-8
  pythonProcess.stdin.end(); // Finalizar a entrada do processo Python

  pythonProcess.stdout.on("data", (data) => {
    console.log(`Resposta do Python: ${data}`);
    event.reply("fromMain", data.toString()); // Envia resposta ao frontend
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`Erro no script Python: ${data}`);
  });

  pythonProcess.on("close", (code) => {
    console.log(`Script Python finalizado com código: ${code}`);
  });
});

app.whenReady().then(createWindow);
