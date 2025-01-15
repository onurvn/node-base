const i18n = require("../i18n");

class I18n {
    constructor(lang) {
        this.lang = lang;
    }

    translate(text, lang = this.lang, params = []) {
        let arr = text.split(".");

        let val = i18n[lang][arr[0]];

        for (let i = 1; i < arr.length; i++) {
            val = val[arr[i]];
        }

        val = val + "";

        for (let i = 0; i < params.length; i++) {
            val = val.replace("{}", params[i]);
        }

        return val || "";
    }
}

module.exports = I18n;