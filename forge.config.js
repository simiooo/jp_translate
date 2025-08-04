import {execSync} from 'node:child_process'

export default {
    hooks: {
        prePackage: async (forgeConfig) => {
            // execSync("pnpm", ["build-electron"])
            // execSync("pnpm", ["build"])
        }
    },
    "packagerConfig": {
        "name": "Risu Reader",
        "dir": "./dist-electron",
        "extraResource": [
            "./build/client",
            "./dist-electron"
        ]
    },
    "makers": [
        {
            "name": "@electron-forge/maker-squirrel",
            "config": {
                "name": "jp_translate"
            }
        },
        {
            "name": "@electron-forge/maker-zip",
            "platforms": [
                "darwin"
            ]
        },
        {
            "name": "@electron-forge/maker-deb",
            "config": {}
        },
        {
            "name": "@electron-forge/maker-rpm",
            "config": {}
        }
    ]
}