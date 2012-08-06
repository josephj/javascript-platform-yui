/*global YUI, window, document, setTimeout, top */
YUI.namespace("PlatformModules");

YUI.add("platform-core", function (Y) {

    var _modules   = [], // The registered modules.
        _listeners = {},
        _maps      = [],
        _timers    = {},
        //===========================
        // Shortcuts
        //===========================
        Lang = Y.Lang,
        //===========================
        // Constants
        //===========================
        MODULE_ID = "Y.PlatformCore",
        //===========================
        // Private Methods
        //===========================
        _addListener,
        _broadcast,
        _checkReady,
        _loadModule,
        _log,
        _match,
        _setTimer,
        //===========================
        // Public Methods
        //===========================
        register,
        registerAll,
        start;

    //===========================
    // Private Methods
    //===========================
    /**
     * Let a module listen for a specific message.
     *
     * @method _addListener
     * @private
     * @param id      {String} ID of the module which wants to listen.
     * @param label   {String} Target message label name.
     * @param handler {String} Target message label name.
     * @return        {String} listener ID for future use (remove, update...)
     */
    _addListener = function (id, label, handler) {
        _log("_addListener('" + id + "', '" + label + "') is executed.");
        var listener,
            listenerId,
            targetId;

        handler = handler || function () {};
        listenerId = Y.guid();
        if (!Lang.isUndefined(_listeners[id])) {
            _listeners[id] = {};
        }
        _listeners[id][label] = handler;
        _maps[listenerId] = _listeners[id][label];
        return listenerId;
    };

    /**
     * Module broadcast method.
     *
     * @method broadcast
     * @public
     * @param name {String} The message label name, e.g. switch-view.
     *                      You should use verb for first word and use hyphen.
     * @param data {Mixed}  The data you want transmit to module which subscribe
     *                      this message.
     */
    _broadcast = function (name, data) {
        var that = this;
        _log("broadcast('" + name + "') for #" + that.id + " is executed.");
        if (name.indexOf(":") !== -1) {
            if (name.split(":")[0] !== that.id) {
                _log("broadcast('" + name + "') the id you assigned" +
                     "is not identical with current module id.", "warn");
                return false;
            }
        } else {
            name = that.id + ":" + name;
        }
        _match(name, that.id, data);
    };

    /**
     * Manually check if a node is content readied
     * for IE browsers.
     *
     * @method _checkReady
     * @param id {String} The module ID.
     * @return {Boolean} false if it's not ready.
     */
    _checkReady = function (id) {
        _log("_checkReady() is executed.");
        var module = this,
            node = Y.one("#" + module.id);
        return (node && node.get("nextSibling"));
    };

    /**
     * Invoke module's onviewload method.
     *
     * @method _loadModule
     * @private
     * @param module {Object} The module object.
     */
    _loadModule = function (module) {
        var id = module.id;
        _log("_loadModule('#" + id + "') is executed.");
        try {
            module.onviewload.call(module);
        } catch (e) {
            _log("_loadModule('#" + id + "') fails - Error occurs in this " +
                 " module's onviewload method. The error message is '" +
                 e.message + "'", "error");
            return;
        }
        if (_timers[id]) {
            _timers[id].cancel();
        }
        module.sandbox.ready = true;
        _log("_loadModule('#" + id + "') is executed.");
    };

    /**
     * A convenient alias method for Y.log(<msg>, "info", "Y.PlatformCore");
     *
     * @method _log
     * @private
     */
    _log = function (msg, type, module) {
        type = type || "info";
        module = module || MODULE_ID;
        Y.log(msg, type, module);
    };

    /**
     * Match event and modules which subscribes the event.
     *
     * @method _match
     * @private
     * @param name {String} The message label name.
     * @param id   {String} The broadcasting module ID.
     * @param data {Object} The data which the broadcasting module
     *                      shares with the subscribers.
     */
    _match = function (name, id, data) {
        _log("match('" + name + "', '" + id + "') is executed.");
        var modules = [], // The influenced modules.
            i,
            listener, // The shortcut for iteration.
            key;      // The message label name.

        // Check the origin if it's defined.
        if (name.indexOf(":") !== -1) {
            if (id !== name.split(":")[0]) {
                _log("match('" + name + "') the id you assigned " +
                     "('" + name.split(":")[0] + ") is not identical with " +
                     "current module id '" + id + "'. Stop execution.", "warn");
                return;
            }
        }

        // Find out modules which subscribe / listen for this message.
        name = name.split(":")[1];
        for (i in _listeners) {
            if (_listeners.hasOwnProperty(i)) {

                listener = _listeners[i];

                if (!listener.name && !listener[id + ":" + name]) {
                    continue;
                }

                // Get the message label name.
                if (listener[id + ":" + name]) {
                    key  = id + ":" + name;
                } else {
                    key = name;
                }

                // Prevent user handlers' error.
                try {
                    listener[key](name, id, data);
                    if (!Lang.isUndefined(_modules[i].onmessage)) {
                        _modules[i].onmessage(name, id, data);
                    }
                    modules.push(i);
                }
                catch (e) {
                    _log("_match() " + e.message, "error");
                }
            }
        }
        _log("_match('" + name + "', '" + id + "', '<data>') is executed " +
             "successfully! There are " + modules.length + " modules being " +
             "influenced: '#" + modules.join(", #") + "'");
    };
    /**
     * Set timer to check if individual module's onviewload
     * is executed properly. It just shows a error message in console
     * if it's not executed.
     *
     * @method _setTimer
     * @private
     * @param id {String} The module ID.
     */
    _setTimer = function (id) {
        _timers[id] = Y.later(5 * 1000, id, function () {
            var id = this;
            _log("start() - It fails to access the view node of #" +
                 id + " module", "error");
        });
    };

    //===========================
    // Public Methods
    //===========================
    /**
     * Register a module to core.
     *
     * @method register
     * @public
     * @param id           {String}  The module ID which needs to be registered.
     * @param attrs        {String}  The config object which the module has.
     *                               Note you need at least providing the init
     *                               and onviewload methods.
     * @param registerOnly {Boolean} false if you want starting this module
     *                               immediately after registered.
     *                               The default value is false;
     * @return {Boolean} false if the config object doesn't have init and
     *                   onviewload methods.
     */
    register = function (id, attrs, registerOnly) {
        _log("register('#" + id + "') is executed.");
        registerOnly = registerOnly || false;
        _modules[id] = attrs;
        if (!attrs.onviewload || !attrs.init) {
            _log("register('#" + id + "') - fails because both onviewload " +
                 "and init methods are required.", "warn");
            return false;
        }
        if (registerOnly) {
            _log("register('#" + id + "') - registered successfully.", "warn");
            return true;
        }
        start(id);
        _log("register('#" + id + "') - registered and started successfully.",
             "warn");
        return true;
    };

    /**
     * Register all modules instead of one by one.
     *
     * @method registerAll
     * @public
     * @param modules      {Array}   The module object array
     *                               which will be registered.
     * @param registerOnly {Boolean} false if you want starting these modules
     *                               immediately after registered.
     *                               The default value is false;
     */
    registerAll = function (modules, registerOnly) {
        _log("registerAll() is executed.");
        var i;
        registerOnly = registerOnly || false;
        for (i in modules) {
            if (modules.hasOwnProperty(i)) {
                register(i, modules[i], registerOnly);
            }
        }
    };

    /**
     * Start running the specified module.
     * The related view module element must be accessible
     * immediately or within a short time. DOMReady and YUI
     * contentready skills are applied here for waiting the element.
     *
     * @method start
     * @param id {String} The module ID.
     */
    start = function (id) {
        _log("start('#" + id + "') is executed");

        var sandbox,  // The Y.PlatformSandbox instance.
            module,   // The module object.
            callback;

        // Create sandbox instance.
        sandbox = new Y.PlatformSandbox(id);
        sandbox.ready = false;
        module.sandbox = sandbox;
        module.id = id;

        // Initialize the module.
        module = _modules[id];
        if (!Lang.isUndefined(module.langModule)) {
            // Specify its language module if it's defined.
            sandbox.langModule = module.langModule;
        }
        module.init(sandbox);

        if (Y.UA.ie) {
            _log("start('#" + id + "') - Your browser is IE, " +
                 "using different approach.");

            callback = function () {
                var isReady = (_checkReady(id)),
                    msg = "start('#" + id + "') ";
                msg += (isReady) ?  "node is ready." : "node is not ready.";
                if (isReady) {
                    _loadModule(module);
                    _log(msg);
                } else {
                    _log(msg, "error");
                }
            };

            // IE DOMReady is true
            if (!Lang.isUndefined(YUI.Env.DOMReady) && YUI.Env.DOMReady) {
                _log("start('#" + id + "') - DOM is ready.");
                callback();
                return; // Stop here to prevent monitoring.
            } else {
                _log("start('#" + id + "') - Wait until DOM is ready.");
                Y.on("domready", callback);
            }
        } else {

            // Note - If you dynamically load YUI seed, the contentready behaves
            //        identically with available. That means the node accessing
            //        in onviewload might fails. You must modify the code in
            //        your event-dom.js. Get more information in:
            //        http://yuilibrary.com/projects/yui3/ticket/2532622
            Y.on("contentready", function () {
                _log("start('#" + id + "') - contentready.");
                _loadModule(module);
            }, "#" + id);

            // Set timer to monitor.
            _setTimer(id);
        }
    };

    Y.PlatformCore = {
        _match       : _match,
        _addListener : _addListener,
        _broadcast   : _broadcast,
        register     : register,
        registerAll  : registerAll,
        start        : start
    };

});
