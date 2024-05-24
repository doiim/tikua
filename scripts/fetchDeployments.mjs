import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const deploymentsPath = path.join(__dirname, '..', 'node_modules', '@cartesi', 'rollups', 'deployments');
const applicationPath = path.join(__dirname, '..', 'node_modules', '@cartesi', 'rollups', 'export', 'artifacts', 'contracts', 'dapp', 'CartesiDApp.sol');
const deploymentsDestPath = path.join(__dirname, '..', 'src', 'deployments');
const abisDestPath = path.join(__dirname, '..', 'src', 'abis');

// Delete all files in src/abis and src/deployments
function deleteFilesInDirectory(directoryPath) {
    if (fs.existsSync(directoryPath)) {
        const files = fs.readdirSync(directoryPath);
        files.forEach(file => {
            const filePath = path.join(directoryPath, file);
            if (fs.statSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
            }
        });
    }
}

deleteFilesInDirectory(abisDestPath);
deleteFilesInDirectory(deploymentsDestPath);

// Fetch deployments and ABIs
fs.readdir(deploymentsPath, (err, folders) => {
    if (err) {
        console.error(err);
        return;
    }

    folders.forEach(folder => {
        const folderPath = path.join(deploymentsPath, folder);
        fs.readdir(folderPath, async (err, files) => {

            if (err) {
                console.error(err);
                return;
            }
            const addresses = {}
            for (const file of files) {
                const filePath = path.join(folderPath, file);
                if (file === 'AuthorityFactory.json') continue
                const f = fs.readFileSync(filePath, 'utf8')
                const address = JSON.parse(f).address
                const abi = JSON.parse(f).abi
                if (address) {
                    addresses[file.split('.').shift()] = address
                }
                if (abi) {
                    const jsonDestAbi = path.join(abisDestPath, `${file.split('.').shift()}.json`);
                    fs.writeFileSync(jsonDestAbi, JSON.stringify(abi, null, 2), 'utf8');
                }
            }
            const jsonDestDeployments = path.join(deploymentsDestPath, `${folder}.json`);
            fs.writeFileSync(jsonDestDeployments, JSON.stringify(addresses, null, 2), 'utf8');
        });
    });

    const file = 'CartesiDApp.json'
    const filePath = path.join(applicationPath, file);
    const f = fs.readFileSync(filePath, 'utf8')
    const abi = JSON.parse(f).abi
    const destPath = path.join(abisDestPath, file);
    fs.writeFileSync(destPath, JSON.stringify(abi, null, 2), 'utf8');
});

