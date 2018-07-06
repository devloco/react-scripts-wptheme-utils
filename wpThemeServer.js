/**
 * Copyright (c) 2018-present, https://github.com/devloco
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

const WebSocket = require("ws");

const _getUserConfig = require("@devloco/react-scripts-wptheme-utils/getUserConfig");
const _typeBuildError = "errors";
const _typeBuildSuccess = "content-changed";
const _typeBuildWarning = "warnings";

var _server;
var _lastStats = null;
var _lastBuildEvent = null;

function _sendMessage(buildEvent, stats) {
    if (_server) {
        _server.clients.forEach((ws) => {
            if (ws.isAlive === true) {
                let msg = JSON.stringify({
                    now: new Date().getTime().toString(),
                    stats: stats.toJson("normal"),
                    type: buildEvent
                });

                ws.send(msg);

                if (buildEvent === _typeBuildSuccess) {
                    console.log("Browser refresh sent.");
                }
            }
        });
    }
}

function _startServer(portNum) {
    _server = new WebSocket.Server({ port: portNum });

    const noop = function() {};

    const heartbeat = function() {
        this.isAlive = true;
    };

    _server.on("connection", (ws) => {
        ws.isAlive = true;
        ws.on("pong", heartbeat);

        if (_lastBuildEvent !== null && _lastBuildEvent !== _typeBuildSuccess) {
            _sendMessage(_lastBuildEvent, _lastStats);
        }
    });

    _server.on("close", (code) => {
        console.error(`wpThemeServer exited with code ${code}`);
    });

    const interval = setInterval(() => {
        _server.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                console.log("Browser refresh server: CONNECTION TERMINATED", ws);
                return ws.terminate();
            }

            ws.isAlive = false;
            ws.ping(noop);
        });
    }, 30000);
}

let _clientInjectString = null;
let _serverConfig = null;

const wpThemeServer = {
    getClientInjectString: function(mode, token) {
        if (_serverConfig.enable !== true || typeof mode !== "string") {
            return "";
        }

        if (_clientInjectString) {
            return _clientInjectString;
        }

        const phpStuff = `<?php $BRC_TEMPLATE_PATH = parse_url(get_template_directory_uri(), PHP_URL_PATH); ?>`;
        const jsTags = [
            "<script src='<?php echo $BRC_TEMPLATE_PATH; ?>/react-src/node_modules/@devloco/react-scripts-wptheme-utils/wpThemeClient.js'></script>",
            "<script src='<?php echo $BRC_TEMPLATE_PATH; ?>/react-src/node_modules/@devloco/react-scripts-wptheme-error-overlay/wpThemeErrorOverlay.js'></script>\n"
        ];
        const jsCall = `<script> wpThemeClient.start("${_serverConfig.hostname}", "${_serverConfig.port}"); </script>\n`;

        let toInject = [];
        switch (mode) {
            case "afterToken":
                // note in this case, we put the token back into the file (i.e. the token is something you want to keep in the file like "</body>").
                toInject = [token, phpStuff, jsTags.join("\n"), jsCall];
                break;
            case "beforeToken":
                // note in this case, we put the token back into the file (i.e. the token is something you want to keep in the file like "</body>").
                toInject = [phpStuff, jsTags.join("\n"), jsCall, token];
                break;
            case "endOfFile":
            case "replaceToken":
                toInject = [phpStuff, jsTags.join("\n"), jsCall];
                break;
            default:
                console.log(chalk.magenta(`wpstart::injectWpThemeClient: unknown inject mode: ${mode}.`));
                console.log(`Available inject modes: ${chalk.cyan("disable, afterToken, beforeToken, replaceToken, endOfFile")}`);
                process.exit();
        }

        _clientInjectString = toInject.join("\n");

        return _clientInjectString;
    },
    startServer: function(paths) {
        try {
            _serverConfig = _getUserConfig(paths, process.env.NODE_ENV).wpThemeServer;
        } catch (err) {
            console.log("unable to get wpThemeServer config from user config.");
            process.exit(1);
        }

        let configPort = _serverConfig && typeof _serverConfig.port === "number" ? _serverConfig.port : null;
        const portNum = parseInt(process.env.PORT, 10) || configPort || 8090;
        if (portNum > 0) {
            _startServer(portNum);
            console.log("Browser refresh server ready.");
        }
    },
    update: function(stats) {
        if (stats) {
            _lastStats = stats;
            if (stats.hasErrors()) {
                _lastBuildEvent = _typeBuildError;
                _sendMessage(_typeBuildError, _lastStats);
            } else if (stats.hasWarnings()) {
                _lastBuildEvent = _typeBuildWarning;
                _sendMessage(_typeBuildWarning, _lastStats);
            } else {
                _lastBuildEvent = _typeBuildSuccess;
                _sendMessage(_typeBuildSuccess, _lastStats);
            }
        }
    }
};

module.exports = wpThemeServer;
