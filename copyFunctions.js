/**
 * Copyright (c) 2018-present, devloco
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
"use strict";

const fs = require("fs-extra");
const wpThemePostInstallerInfo = require("@devloco/create-react-wptheme-utils/postInstallerInfo");

const copyFunctions = {
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
    }
};

module.exports = copyFunctions;
