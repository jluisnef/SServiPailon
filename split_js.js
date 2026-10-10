const fs = require('fs');
const path = require('path');

const srcJsPath = path.join(__dirname, 'src', 'js');
if (!fs.existsSync(srcJsPath)) {
    fs.mkdirSync(srcJsPath, { recursive: true });
}

const appJsContent = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

const regexStorage = /class StorageManager \{[\s\S]*?(?=\/\/ ============================================================================[\r\n]+\/\/ 2\. CLASE TALENT MANAGER)/;
const regexTalent = /class TalentManager \{[\s\S]*?(?=\/\/ ============================================================================[\r\n]+\/\/ 3\. CLASE UI CONTROLLER)/;
const regexUI = /class UIController \{[\s\S]*?(?=\/\/ ============================================================================[\r\n]+\/\/ 4\. CLASE APP)/;
const regexApp = /class App \{[\s\S]*?(?=\/\/ ============================================================================[\r\n]+\/\/ INICIALIZACIÓN)/;

const storageMatch = appJsContent.match(regexStorage)[0];
const talentMatch = appJsContent.match(regexTalent)[0];
const uiMatch = appJsContent.match(regexUI)[0];
const appMatch = appJsContent.match(regexApp)[0];

fs.writeFileSync(path.join(srcJsPath, 'StorageManager.js'), 'export ' + storageMatch);

fs.writeFileSync(path.join(srcJsPath, 'TalentManager.js'), 'export ' + talentMatch);

fs.writeFileSync(path.join(srcJsPath, 'UIController.js'), 'export ' + uiMatch);

const appJsContentNew = `import { StorageManager } from './StorageManager.js';
import { TalentManager } from './TalentManager.js';
import { UIController } from './UIController.js';

export ` + appMatch;
fs.writeFileSync(path.join(srcJsPath, 'App.js'), appJsContentNew);

const mainJsContent = `import { App } from './App.js';

document.addEventListener('DOMContentLoaded', () => {
    window.ServiPailonApp = new App();
});
`;
fs.writeFileSync(path.join(srcJsPath, 'main.js'), mainJsContent);

console.log("Archivos separados correctamente en src/js/");
