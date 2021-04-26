define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ScriptBase = void 0;
    var ScriptBase = (function () {
        function ScriptBase(scriptFacade) {
            this.__scriptFacade = scriptFacade;
        }
        ScriptBase.prototype.property = function (name, options, gsFunc) {
            this.__scriptFacade.property(name, options, gsFunc);
            if (options && options.readOnly) {
                Object.defineProperty(this, name, {
                    get: function () {
                        return gsFunc();
                    }
                });
            }
            else {
                Object.defineProperty(this, name, {
                    get: function () {
                        return gsFunc();
                    },
                    set: function (value) {
                        var oldValue = gsFunc();
                        if (oldValue !== gsFunc(value))
                            this.__scriptFacade.changed(name);
                    }
                });
            }
        };
        ScriptBase.prototype.indexedProperty = function (name, itemType) {
            return this.__scriptFacade.indexedProperty(name, itemType);
        };
        ScriptBase.prototype.changed = function (propName) {
            this.__scriptFacade.changed(propName);
        };
        ScriptBase.prototype.unsubscribe = function (event, listener) {
            this.__scriptFacade.unsubscribe(event, listener);
        };
        ScriptBase.prototype.makeJSArray = function (arr) {
            if (Array.isArray(arr))
                return arr;
            var result = [];
            var length = arr.length;
            for (var i = 0; i < length; ++i)
                result.push(arr[i]);
            return result;
        };
        return ScriptBase;
    }());
    exports.ScriptBase = ScriptBase;
});
