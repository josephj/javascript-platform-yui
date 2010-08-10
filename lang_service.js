YUI.add("lang-service", function (Y) {
    var moduleName, // language module (demo)
        activeTag,  // current language tag (zh-TW, zh-CN)
        trans;      // translation object (trans["key"]);
    /*
     * Get current using language module
     */
    Y.PlatformCore.getLangModule = function () {
        return moduleName;
    };
    /*
     * Set which module you want to use.
     */
    Y.PlatformCore.setLangModule = function (name) {
        moduleName = name;
        activeTag = Y.Intl.getLang(name);
    };
    /*
     * Sandbox can set active language tag.
     */
    Y.PlatformSandbox.prototype.setLang = function (lang, callback) {
        activeTag = lang;
        Y.use("lang/" + moduleName + "_" + lang, function(Y) {
            if (Y.Intl.setLang(moduleName, lang) && callback) {
                callback();
            }
        });
    };
    /*
     * Sandbox can get active language tag.
     */
    Y.PlatformSandbox.prototype.getLang = function (tag) {
        return activeTag;
    };
    /*
     * Use language key to get translation
     */
    Y.PlatformSandbox.prototype.getTrans = function (key, defaultValue, tokens) {
        var isExist,
            trans,
            tokens,
            text;
        key = moduleName + "-" + this.id.replace("-", "_") + "-" + key;
        defaultValue = defaultValue || "";
        trans = Y.Intl.get(moduleName);
        isExist =  (typeof trans[key] !== "undefined") ? true : false;
        tokens = tokens || null;
        text = (isExist) ? trans[key] : defaultValue;
        if (tokens) {
            text = Y.substitute(text, tokens);
        }
        return text;
    };
}, "3.1.1", {use: ["intl"]});
