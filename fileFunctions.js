/**
 * Copyright (c) 2018-present, https://github.com/devloco
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

const fs = require("fs-extra");
const path = require("path");
const { rm, cp } = require("shelljs");
const wpThemePostInstallerInfo = require("@devloco/react-scripts-wptheme-utils/postInstallerInfo");

const _doNotEditFile = "../!DO_NOT_EDIT_THESE_FILES!.txt";
const _readyToDeployFile = "../!READY_TO_DEPLOY!.txt";

const fileFunctions = {
    copyPublicFolder: function(paths) {
        fs.copySync(paths.appPublic, paths.appBuild, {
            dereference: true,
            filter: (file) => file !== paths.appHtml && file.indexOf("index.html") == -1 && file.indexOf(wpThemePostInstallerInfo.postInstallerName) == -1
        });
    },
    copyToThemeFolder: function(paths, forBuild) {
        const copyFrom = path.join(paths.appBuild, "/*");
        cp("-rf", copyFrom, "..");

        if (forBuild === true) {
            fileFunctions.cleanThemeFolder(paths, true);
            fileFunctions.deleteDeployFolder(paths);

            const themeName = require(paths.appPackageJson).name;
            const deployFolder = path.join("..", themeName);
            fs.ensureDirSync(deployFolder);

            cp("-rf", copyFrom, deployFolder);
        }
    },
    cleanThemeFolder: function(paths, forBuild) {
        rm("-rf", path.join("..", "static"));

        if (forBuild === true) {
            rm("-f", _doNotEditFile);
            rm("-f", _readyToDeployFile);
            rm("-r", path.join("..", "precache*"));

            const assetManifest = path.join("..", "asset-manifest*");
            const favIconIco = path.join("..", "favicon.ico");
            const indexPhp = path.join("..", "index.php");
            const manifestJson = path.join("..", "manifest.json");
            const screenShotPng = path.join("..", "screenshot.png");
            const styleCss = path.join("..", "style.css");
            const serviceWorker = path.join("..", "service-worker.js");

            rm("-r", assetManifest);
            rm("-r", favIconIco);
            rm("-r", indexPhp);
            rm("-r", manifestJson);
            rm("-r", screenShotPng);
            rm("-r", styleCss);
            rm("-r", serviceWorker);
        }
    },
    deleteDeployFolder: function(paths) {
        const themeName = require(paths.appPackageJson).name;
        const deployFolder = path.join("..", themeName);
        if (fs.existsSync(deployFolder)) {
            rm("-rf", deployFolder);
        }
    },
    setupCopyToThemeFolder: function(paths) {
        const indexPhp = path.join(paths.appPublic, "index.php");
        const styleCss = path.join(paths.appPublic, "style.css");
        const screenShotPng = path.join(paths.appPublic, "screenshot.png");
        const favIconIco = path.join(paths.appPublic, "favicon.ico");
        cp("-rf", indexPhp, "..");
        cp("-rf", styleCss, "..");
        cp("-rf", screenShotPng, "..");
        cp("-rf", favIconIco, "..");
    },
    writeDoNotEditFile: function() {
        const readyToDeployFile = "../!READY_TO_DEPLOY!.txt";
        fs.access(readyToDeployFile, fs.constants.F_OK, (err) => {
            if (!err) {
                rm("-f", _readyToDeployFile);
            }
        });

        const doNotEditContent = `Instead, edit the files in the 'react-src/src' and 'react-src/public' folders.
        These files are overwritten by Webpack every time you make edits to the files in those folders.
        You will lose all changes made to these files when that happens.`;

        fs.access(_doNotEditFile, fs.constants.F_OK, (err) => {
            if (err) {
                fs.writeFile(_doNotEditFile, doNotEditContent, "utf8", (err) => {});
            }
        });
    },
    writeReadyToDeployFile: function(paths) {
        fs.access(_doNotEditFile, fs.constants.F_OK, (err) => {
            if (!err) {
                rm("-f", _doNotEditFile);
            }
        });

        const themeName = require(paths.appPackageJson).name;
        const readyToDeployContent = `The folder named "${themeName}" is ready to deploy to your production server.

If you need to continue developing your theme, simply change to the "react-src" folder and type the command: npm run start
`;
        fs.access(_readyToDeployFile, fs.constants.F_OK, (err) => {
            if (err) {
                fs.writeFile(_readyToDeployFile, readyToDeployContent, "utf8", (err) => {});
            }
        });
    }
};

module.exports = fileFunctions;
