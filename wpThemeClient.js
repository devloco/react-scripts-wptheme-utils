/**
 * Copyright (c) 2018-present, https://github.com/devloco
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var wpThemeClient = {
    start: function(configHostname, configPort) {
        if (configHostname !== "__from-window__" || (typeof configHostname !== "string" && configHostname.length <= 0)) {
            console.log("WPTHEME CLIENT: hostname is not '__from-window__' or a non-empty string: ", configHostname);
            return;
        }

        var parsedConfigPort = null;
        if (configPort !== "__from-window__") {
            parsedConfigPort = parseInt(configPort, 10);
            if (typeof parsedConfigPort !== "number") {
                console.log("WPTHEME CLIENT: port is not '__from-window__' or a number: ", configPort);
                return;
            }
        }

        var hostName = configHostname === "__from-window__" ? window.location.hostname : configHostname;
        var portNum = configPort === "__from-window__" ? window.location.port : parsedConfigPort;
        var host = "ws://" + hostName + ":" + portNum;

        var socket = new WebSocket(host);
        socket.onmessage = function(response) {
            if (response && typeof response.data === "string") {
                try {
                    var msg = JSON.parse(response.data);
                    if (msg) {
                        switch (msg.type) {
                            case "content-changed":
                                window.location.reload();
                                break;
                            case "errors":
                                try {
                                    wpThemeErrorOverlay.handleErrors(msg.stats.errors);
                                } catch (err) {
                                    console.log("'errors' try block error:", err);
                                    console.log("Compile ERRORS", msg);
                                }
                                break;
                            case "warnings":
                                try {
                                    wpThemeErrorOverlay.handleWarnings(msg.stats.warnings);
                                } catch (err) {
                                    console.log("'warnings' try block error:", err);
                                    console.log("Compile WARNINGS", err, msg);
                                }
                                break;
                        }
                    }
                } catch (err) {
                    if (console && typeof console.error === "function") {
                        console.error(err);
                        console.log("Raw websocket message:", response);
                    }
                }
            }
        };

        socket.onclose = function() {
            if (console && typeof console.info === "function") {
                console.info("Probably a refresh happened.\nBut it's possible the browser refresh server has disconnected.\nYou can manually refresh the page if necessary.");
            }
        };
    }
};
