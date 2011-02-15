YUI.add("lang-service", function (Y) {

    var _moduleName, // Language module (demo)
        _activeTag;  // Current language tag (zh-TW, zh-CN)

    /*
     * Get current language module name.
     * 
     * @method getLangModule
     * @static
     * @public
     * @return {String} Language module name.
     */
    Y.PlatformCore.getLangModule = function () {
        Y.log("getLangModule() is executed. Current langauge module name is " + _moduleName, "info", "Y.PlatformCore");
        return _moduleName;
    };

    /*
     * Set language module.
     * It switches the _activeTag variable.
     *
     * @method setLangModule
     * @static
     * @public
     * @return void();
     */
    Y.PlatformCore.setLangModule = function (name) {
        Y.log("setLangModule() is executed. Input value = " + name, "info", "Y.PlatformCore");
        _moduleName = name;
        _activeTag = Y.Intl.getLang(name);
        if (typeof _activeTag === "undefined") {
            Y.log("setLangModule('" + name + "') - It fails to set language module.", "warn", "Y.PlatformCore");
            return false;
        } else {
            Y.log("setLangModule('" + name + "') - It executes successfully.", "info", "Y.PlatformCore");
            return true;
        }
    };

    /*
     * Switch to different language tag. 
     * It will on-demand load target language resource file.
     * 
     * @method setLang
     * @static
     * @public
     * @param {String} lang Language tag.
     * @param {Function} callback Callback function.
     * @return void();
     */
    Y.PlatformSandbox.prototype.setLang = function (lang, callback) {
        Y.log("setLang() is executed.", "info", "Y.PlatformSandbox");
        _activeTag = lang;
        Y.use("lang/" + _moduleName + "_" + lang, function(Y) {
            if (Y.Intl.setLang(_moduleName, lang) && callback) {
                callback();
            }
        });
    };

    /*
     * Get current language tag.
     * 
     * @method getLang
     * @static
     * @public
     * @return {String} Current language tag.
     */
    Y.PlatformSandbox.prototype.getLang = function () {
        Y.log("getLang() is executed.", "info", "Y.PlatformSandbox");
        return _activeTag;
    };

    /*
     * Get translation by key.
     * 
     * @method getTrans
     * @static
     * @public
     * @return {String} Current language tag.
     */
    Y.PlatformSandbox.prototype.getTrans = function (key, defaultValue, tokens) {
        Y.log("getLang() is executed.", "info", "Y.PlatformSandbox");
        var isExist,
            trans,
            tokens,
            text;

        tokens = tokens || null;
        defaultValue = defaultValue || "";

        // Make sure module name has been defined.
        if (typeof _moduleName === "undefined") {
            Y.log("getLang() fails because module is not defined.", "error", "Y.PlatformSandbox");
            return;
        }

        // Full language key is composed by module name, div id, and key.
        key = _moduleName + "-" + this.id.replace(/\-/g, "_") + "-" + key;

        // Get tranlation resource array.
        trans = Y.Intl.get(_moduleName);

        // Check if the key exists in language resource.
        isExist =  (typeof trans[key] !== "undefined") ? true : false;
        if (isExist) {
            text = trans[key];
        } else {
            Y.log("getLang() - This language key '" + key + "' has not been translated yet.", "warn", "Y.PlatformSandbox");
            text = defaultValue;
        }

        if (tokens) {
            text = Y.substitute(text, tokens);
        }
        return text;
    };

});
