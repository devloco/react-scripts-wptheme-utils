/**
 * Copyright (c) 2018-present, https://github.com/devloco
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var wpThemeClient = {
  start: function (wsHostProtocol, wsHostname, wsPort) {
      var hostProtocol = null;
      switch (wsHostProtocol) {
          case "ws":
          case "wss":
              hostProtocol = wsHostProtocol;
              break;
          default:
              console.log(`WPTHEME CLIENT: configHostProtocol is not "ws" or "wss": ` + new String(wsHostProtocol));
              console.error("This is a bug. Please report to: https://github.com/devloco/create-react-wptheme/issues");
              return;
      }

      if (wsHostname !== "__from-window__") {
          if (typeof wsHostname !== "string" && wsHostname.length <= 0) {
              console.log("WPTHEME CLIENT: hostname is not '__from-window__' or a non-empty string: ", wsHostname);
              return;
          }
      }

      var parsedConfigPort = null;
      if (wsPort !== "__from-window__") {
          parsedConfigPort = parseInt(wsPort, 10);
          if (typeof parsedConfigPort !== "number") {
              console.log("WPTHEME CLIENT: port is not '__from-window__' or a number: ", wsPort);
              return;
          }
      }

      var hostName = wsHostname === "__from-window__" ? window.location.hostname : wsHostname;
      var portNum = wsPort === "__from-window__" ? window.location.port : parsedConfigPort;
      var hostURL = hostProtocol + "://" + hostName + ":" + portNum;

      var newlyReloaded = true;

      var socket = new WebSocket(hostURL);
      socket.onmessage = function (response) {
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
                                  if (!newlyReloaded) {
                                      // Webpack successfully creates a new compile if there are only warnings (unlike errors which do not compile at all).
                                      window.location.reload();
                                  }
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

              newlyReloaded = false;
          }
      };

      socket.onclose = function () {
          if (console && typeof console.info === "function") {
              switch (socket.readyState) {
                  case socket.CLOSED:
                  case socket.CLOSING:
                      setTimeout(() => {
                          console.info("It's possible the browser refresh server has disconnected.\nYou can manually refresh the page if necessary.");
                      }, 1000);
                      break;
              }
          }
      };

      socket.onopen = function () {
          if (console && typeof console.clear === "function") {
              //console.clear();
              console.info("The browser refresh server is connected.");
          }
      };
  }
};
