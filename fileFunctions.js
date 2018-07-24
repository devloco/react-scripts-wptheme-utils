/**
 * Copyright (c) 2018-present, https://github.com/devloco
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

const fs = require("fs-extra");
const { rm } = require("shelljs");
const wpThemePostInstallerInfo = require("@devloco/react-scripts-wptheme-utils/postInstallerInfo");

const _doNotEditFile = "../!DO_NOT_EDIT_THESE_FILES!.txt";
let _doNotEditContent = `Edit the files in the 'react-src/src' and 'react-src/public' folders instead.
These files are overwritten by Webpack every time you make edits to the files in those folders.
You will lose all changes made to these files when that happens.`;

const fileFunctions = {
    copyPublicFolder: function(paths) {
        fs.copySync(paths.appPublic, paths.appBuild, {
            dereference: true,
            filter: (file) => file !== paths.appHtml && file.indexOf("index.html") == -1 && file.indexOf(wpThemePostInstallerInfo.postInstallerName) == -1
        });
    },
    copyToThemeFolder: function(paths) {
        fs.copySync(paths.appBuild, "..", {
            dereference: true
        });
    },
    cleanThemeFolder: function() {
        rm("-rf", "../static");
        rm("-f", _doNotEditFile);
    },
    writeDoNotEditFile: function() {
        fs.access(_doNotEditFile, fs.constants.F_OK, (err) => {
            if (err) {
                fs.writeFile(_doNotEditFile, _doNotEditContent, "utf8", (err) => {});
            }
        });
    }
};

module.exports = fileFunctions;
