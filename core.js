/*global YUI, window, document, setTimeout, top */
YUI.namespace("PlatformModules");
YUI.add("platform-core", function (Y) {
    var MODULE_ID = "PlatformCore",
        registeredModules = [],
        listeners = {},
        maps = [],
        //===========================
        // Private Functions & Events
        //===========================
        broadcast = function (msgName, data) {
            Y.log("broadcast(\"" + msgName + "\") for #" + this.id + " is executed.", "info", MODULE_ID);
            var moduleId;
            if (msgName.indexOf(":") !== -1) {
                moduleId = msgName.split(":")[0];
                if (moduleId !== MODULE_ID) {
                    Y.log("broadcast(\"" + msgName + "\") the id you assigned is not identical with current module id.", "error", "PlatformCore");
                    return false;
                }
            } else {
                msgName = MODULE_ID + ":" + msgName;
            }
            match(msgName, MODULE_ID, data);
        },
        /**
         * Match event and modules which subscribes the event
         *
         * @method match
         * @param msgName {String} Event label name
         * @param callerId {String} The ID of the module which just broadcasts
         * @param callerData {Object} The data that a broadcasting module wants to share
         * @return void
         */
        match = function (msgName, callerId, callerData) {
            Y.log("match(\"" + msgName + "\", \"" + callerId + "\", \"" + callerData + "\") is executed.", "info", "PlatformCore");
            var modules = [],
                i,
                key;
            if (msgName.indexOf(":") !== -1) {
                if (callerId !== msgName.split(":")[0]) {
                    Y.log("match(\"" + msgName + "\") the id you assigned (" + msgName.split(":")[0] + ") is not identical with current module id (" + callerId + "). Stop execution.", "warn", "PlatformCore");
                    return;
                }
            }
            msgName =  msgName.split(":")[1];
            // find modules which register this event
            for (i in listeners) {
                if (listeners.hasOwnProperty(i)) {
                    if (!listeners[i].hasOwnProperty(msgName) && !listeners[i].hasOwnProperty(callerId + ":" + msgName)) {
                        continue;
                    }
                    if (listeners[i].hasOwnProperty(callerId + ":" + msgName)) {
                        key  = callerId + ":" + msgName;
                    } else {
                        key = msgName;
                    }
                    // prevent user handlers' error
                    try {
                        listeners[i][key](msgName, callerId, callerData);
                        if (typeof registeredModules[i].onmessage !== "undefined") {
                            registeredModules[i].onmessage(msgName, callerId, callerData);
                        }
                        modules.push(i);
                    }
                    catch (e) {
                        Y.log("_match() " + e.message, "error", "PlatformCore");
                    }
                }
            }
            Y.log("_match(\"" + msgName + "\", \"" + callerId + "\", \"" + callerData + "\") is executed successfully, " + modules.length + " module(s) is(are) influenced: \"#" + modules.join(", #") + "\"", "info", "PlatformCore");
        },
        /*
         * Let a module listen for a specific message
         * @method addListener
         * @param moduleId {String} ID of the module which wants to listen.
         * @param msgName {String} Target message label name.
         * @private
         * @return {String} listener ID for future use (remove, update...)
         *
         */
        addListener = function (moduleId, msgName, handler) {
            Y.log("_addListener(\"" + moduleId + "\", \"" + msgName + "\") is executed.", "info", "PlatformCore");
            var i,
                j,
                listener,
                listenerId,
                targetId;
            handler = handler || function () {};
            listenerId = Y.guid();
            if (typeof listeners[moduleId] === "undefined") {
                listeners[moduleId] = {};
            }
            listeners[moduleId][msgName] = handler;
            maps[listenerId] = listeners[moduleId][msgName];
            return listenerId;
        },
        /*
         * Register a module to PlatformCore
         *
         * @method register
         * @param moduleId {String} ID of the module which wants to register.
         * @param attrs {String} Methods/attributes object which the registering module has.
         * @param registerOnly {Boolean} Default is false. If you set true, please start() module manually.
         * @public
         * @return {Boolean} false if target message is registered by this module
         */
        register = function (moduleId, o, registerOnly) {
            Y.log("register(\"" + moduleId + "\", " + o + ") is executed.", "info", "PlatformCore");
            registerOnly = registerOnly || false;
            registeredModules[moduleId] = o;
            if (registerOnly) {
                return;
            }
            start(moduleId);
        },
        registerAll = function (modules, registerOnly) {
            Y.log("registerAll() is executed.", "info", "PlatformCore");
            registerOnly = registerOnly || false;
            for (var i in modules) {
                if (modules.hasOwnProperty(i)) {
                    register(i, modules[i], registerOnly);
                }
            }
        },
        start = function (moduleId) {
            if (typeof registeredModules[moduleId].init === "undefined") {
                Y.log("register() : Module init function is not defined.", "warn", "PlatformCore");
                return;
            }
            var sandbox = new Y.PlatformSandbox(moduleId);
            sandbox.ready = false;
            // Let module can specify the language module.
            // Module like contact picker needs this setting. (#2198)
            if (typeof registeredModules[moduleId].langModule !== "undefined") {
                sandbox.langModule = registeredModules[moduleId].langModule;
            }
            registeredModules[moduleId].init(sandbox);
            if (typeof registeredModules[moduleId].onviewload === "undefined") {
                Y.log("register() : Module onviewload function is not defined.", "warn", "PlatformCore");
                return;
            }

            // NOTE - 2012/06/29: Not work well, fail back to getElementById
            /*
            (function () {
                Y.on("contentready", function () {
                    registeredModules[moduleId].onviewload.call(registeredModules[moduleId]);
                    sandbox.ready = true;
                }, "#" + moduleId);
            }());
            */

            // TODO - 2012/06/28, if contentready can not work well, please recovery to getElementById method.
            if (Y.UA.gecko && location.href.indexOf("music_player") !== -1) {
                // TODO - Figure out why space modules don't trigger contentready event.
                Y.on("contentready", function () {
                    if (Y.UA.ie && document.readyState === "loading") { // Prevent when page is still loading
                        Y.log("skip - loading : " + moduleId, "error");
                        setTimeout(arguments.callee, Y.Event.POLL_INTERVAL || 40);
                        return;
                    }
                    registeredModules[moduleId].onviewload.call(registeredModules[moduleId]);
                    sandbox.ready = true;
                }, "#" + moduleId);
            } else {
                (function () {
                    if (document.getElementById(moduleId)) {
                        if (Y.UA.ie && document.readyState === "loading") { // Prevent when page is still loading
                            setTimeout(arguments.callee, Y.Event.POLL_INTERVAL || 40);
                            return;
                        }
                        registeredModules[moduleId].onviewload.call(registeredModules[moduleId]);
                        sandbox.ready = true;
                    }
                }());
            }

            // TODO - Figure out why space modules don't trigger contentready event.
            /*if (self !== top) { // IFrame situation - YUI contentReady event will not be triggered.
            } else {
                Y.on("contentready", function () {
                    if (Y.UA.ie && document.readyState === "loading") { // Prevent when page is still loading
                        Y.log("skip - loading : " + moduleId, "error");
                        setTimeout(arguments.callee, Y.Event.POLL_INTERVAL || 40);
                        return;
                    }
                    registeredModules[moduleId].onviewload.call(registeredModules[moduleId]);
                    sandbox.ready = true;
                }, "#" + moduleId);
            }
            */
        };

    Y.PlatformCore = {
        register: register,
        registerAll: registerAll,
        start: start,
        broadcast: broadcast,
        _match: match,
        _addListener: addListener
    };
});
