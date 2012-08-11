/*global YUI */
YUI.add("platform-sandbox", function (Y) {

    var MODULE_ID = "Y.PlatformSandbox",
        //=================
        // Private Methods
        //=================
        _log,
        //=================
        // Public Methods
        //=================
        broadcast,
        getViewNode,
        listen,
        log;

    /**
     * A convenient alias method for Y.log(<msg>, "info", "Y.PlatformCore");
     *
     * @method _log
     * @private
     */
    _log = function (msg, type, module) {
        type   = type || "info";
        module = module || MODULE_ID;
        Y.log(msg, type, module);
    };

    /**
     * The PlatformSandbox constructor.
     *
     * @constructor PlatformSandbox
     * @param id {String} The module ID.
     */
    function PlatformSandbox (id) {
        this.id = id;
    }

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
    broadcast = function (name, data) {
        var that = this;
        _log("broadcast('" + name + "') for #" + that.id + " is executed.");
        if (name.indexOf(":") !== -1) {
            if (name.split(":")[0] !== that.id) {
                _log("broadcast('" + name + "') " +
                     "the prefix you assigned must be identical with " +
                     "current module ID.");
                return false;
            }
        } else {
            name = that.id + ":" + name;
        }
        Y.PlatformCore._match(name, that.id, data);
    };

    /**
     * Module listens to specific event.
     *
     * @method listen
     * @public
     * @param name {String} Target message name.
     */
    listen = function (name, callback) {
        var that = this;
        _log("listen('" + name + "') for #" + that.id + " is executed.");
        Y.PlatformCore._addListener(that.id, name, callback);
    };

    /**
     * Module gets YUI Node instance.
     *
     * @method getViewNode
     * @public
     * @return {Y.Node} Module YUI Node instance.
     */
    getViewNode = function () {
        var that = this,
            node;
        _log("getViewNode() for #" + that.id + " is executed.");
        if (node) {
            return Y.one("#" + that.id);
        } else {
            _log("getViewNode() node #" + that.id + " doesn't exist.", "error");
        }
    };

    /**
     * A convenient alias method for Y.log(<msg>, "info", <module id>);
     *
     * @method log
     * @public
     * @param msg {String} The log message.
     * @param type {String} The message type.
     *                      It can be "info" (default), "warn", or "error".
     */
    log = function (msg, type) {
        type = type || "info";
        Y.log(msg, type, "#" + this.id);
    };

    PlatformSandbox.prototype = {
        broadcast   : broadcast,
        getViewNode : getViewNode,
        listen      : listen,
        log         : log
    };

    Y.PlatformSandbox = PlatformSandbox;

}, "0.0.1", {requires: ["node-base", "platform-core"]});
