/*global YUI */
YUI.add("platform-sandbox", function (Y) {
    var PlatformSandbox = function (id) {
        this.id = id;
    };
    PlatformSandbox.prototype = {
        /* 
         * Module broadcasts its message to platform.
         * @method broadcast
         * @param msgName {String} Other module's message name.
         * @param data {Object} Data which module wants to share.
         * @public
         * @return void
         */
        broadcast: function (msgName, data) {
            Y.log("broadcast(\"" + msgName + "\") for #" + this.id + " is executed.", "info", "PlatformSandbox"); 
            var moduleId;
            if (msgName.indexOf(":") !== -1) {
                moduleId = msgName.split(":")[0];                    
                if (moduleId !== this.id) {
                    Y.log("broadcast(\"" + msgName + "\") the id you assigned is not identical with current module id.", "warn", "PlatformSandbox"); 
                    return false;
                }
            } else {
                msgName = this.id + ":" + msgName;
            }
            Y.PlatformCore._match(msgName, this.id, data);
        },
        /* 
         * Module listens to specific event.
         * @method listen 
         * @param msgName {String} Target message name.
         * @public
         * @return void
         */
        listen: function (msgName, callback) {
            Y.log("listen(\"" + msgName + "\") for #" + this.id + " is executed.", "info", "PlatformSandbox"); 
            Y.PlatformCore._addListener(this.id, msgName, callback);
        },
        /* 
         * Module gets YUI Node instance.
         * @method getViewNode
         * @public
         * @return {Y.Node} Module YUI Node instance.
         */
        getViewNode: function () {
            Y.log("getViewNode() for #" + this.id + " is executed.", "info", "PlatformSandbox"); 
            return Y.one("#" + this.id);
        }
    };
    Y.PlatformSandbox = PlatformSandbox;
});
