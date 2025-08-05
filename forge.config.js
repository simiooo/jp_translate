import {execSync} from 'node:child_process'

export default {
    hooks: {
        prePackage: async (forgeConfig) => {
            // Ensure the build directories exist before packaging
            execSync("pnpm build-electron", { stdio: 'inherit' })
            execSync("pnpm build", { stdio: 'inherit' })
        }
    },
    "packagerConfig": {
        // icon: "",
        "name": "Risu Reader",
        "dir": "./dist-electron",
        override: true,
        ignore: [
            /(?!package\.json|node_modules|dist-electron|build)/
        ],
        "prune": true,
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