/*global YUI, window, document, setTimeout, top */
YUI.namespace("PlatformModules");
YUI.add("platform-core", function (Y) {
    var MODULE_ID = "Y.PlatformCore",
        _registeredModules = [],
        listeners = {},
        maps = [],
        //===========================
        // Private Functions & Events
        //===========================
        _log = function (msg, type, module) {
            type = type || "info";
            module = module || MODULE_ID;
            Y.log(msg, type, module);
        },
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
                        if (typeof _registeredModules[i].onmessage !== "undefined") {
                            _registeredModules[i].onmessage(msgName, callerId, callerData);
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
            _log("register('#" + moduleId + "') is executed.");
            registerOnly = registerOnly || false;
            _registeredModules[moduleId] = o;
            if (registerOnly) {
                return;
            }
            start(moduleId);
        },
        registerAll = function (modules, registerOnly) {
            _log("registerAll() is executed.");
            registerOnly = registerOnly || false;
            var i;
            for (i in modules) {
                if (modules.hasOwnProperty(i)) {
                    register(i, modules[i], registerOnly);
                }
            }
        },
        start = function (moduleId) {
            _log("start('#" + moduleId + "') is executed");

            if (Y.Lang.isUndefined(_registeredModules[moduleId].init)) {
                _log("start('#" + moduleId + "') : Module init function is not defined.", "warn");
                return;
            }

            var sandbox = new Y.PlatformSandbox(moduleId),
                module  = _registeredModules[moduleId],
                node,
                callback;

            sandbox.ready = false;

            // Let module can specify the its language module.
            if (!Y.Lang.isUndefined(module.langModule)) {
                sandbox.langModule = module.langModule;
            }

            // Initialize the module.
            module.init(sandbox);

            // Stop if onviewload is undefined.
            if (Y.Lang.isUndefined(module.onviewload)) {
                _log("start('#" + moduleId + "') - onviewload is undefined.", "warn");
                return;
            }

            if (Y.UA.ie) {
                if (!Y.Lang.isUndefined(YUI.Env.DOMReady) && YUI.Env.DOMReady) {
                    _log("start('#" + moduleId + "') - dom has already ready.", "warn");
                    node = Y.one("#" + moduleId);
                    if (node) {
                        _log("start('#" + moduleId + "') - node exists.");
                        module.onviewload.call(module);
                        sandbox.ready = true;
                    }
                } else {
                    Y.on("domready", function () {
                        _log("start('#" + moduleId + "') - dom is ready.");
                        node = Y.one("#" + moduleId);
                        if (node) {
                            _log("start('#" + moduleId + "') - node exists.");
                            module.onviewload.call(module);
                            sandbox.ready = true;
                        }
                    });
                }
            } else {
                Y.on("contentready", function () {
                    _log("start('#" + moduleId + "') - contentready.");
                    module.onviewload.call(module);
                    sandbox.ready = true;
                }, "#" + moduleId);
            }
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
