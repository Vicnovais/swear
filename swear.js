;(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['swear'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.Swear = factory();
    }
}(window, function () {
  /* Utilities */

  function mergeObjects(to, from) {
    for (n in from) {
      if (typeof to[n] != 'object') {
          to[n] = from[n];
      } else if (typeof from[n] == 'object') {
          to[n] = mergeObjects(to[n], from[n]);
      }
    }

    return to;
  };

  function isObject(param) {
    return typeof param === 'object' && param !== null;
  };

  function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
  };

  /* Library */

  var swearInstance = null;

  var defaultParams = {
    showError: false, //true, false or object
    logError: false, //true, false or object
    errorMsg: 'Error!' //string or object
  };

  function Swear(config) {
    this.params = mergeObjects(defaultParams, config);
    this.currentValue = null; //primitive, array or object

    if (null == swearInstance) { 
      this.init(); 
      swearInstance = this;
    }
  }

  Swear.prototype = {
    getInstance: function () {
      return swearInstance;
    },

    init: function () {
      Swear.prototype.proxy = this._createProxy();
      Swear.prototype.validateFunctions = this._createValidationFuncs();
      this._injectValidationFuncs();
    },

    _createProxy: function () {
      var failed = [],
          succeeded = [];
      
      var add = function (arrType, obj) {
        switch (arrType) {
          case 'failed': 
            failed.push(obj);
            break;
          case 'succeeded':
            succeeded.push(obj);
            break;
        }
      };

      var get = function (arrType) {
        switch (arrType) {
          case 'failed': return failed;
          case 'succeeded': return succeeded;
        }
      };

      var remove = function (arrType, id) {
        switch (arrType) {
          case 'failed': 
            failed = failed.filter(function (t) { return t.id !== id; });
            break;
          case 'succeeded': 
            succeeded = succeeded.filter(function (t) { return t.id !== id; });
            break;
        }
      };

      var clear = function (arrType) {
        switch (arrType) {
          case 'failed': failed = [];
          case 'succeeded': succeeded = [];
        }
      };

      return {
        addFailed: function (obj) { add('failed', obj); return failed; },
        getFailed: function() { return get('failed'); },
        removeFailed: function(id) { remove('failed', id); return failed; },
        clearFailed: function() { clear('failed'); },
        addSucceeded: function (obj) { add('succeeded', obj); return succeeded; },
        getSucceeded: function() { return get('succeeded'); },
        removeSucceeded: function(id) { remove('succeeded', id); return failed; },
        clearSucceeded: function() { clear('succeeded'); },
      }
    },

    _createValidationFuncs: function () {
      var is = function is(value, name) { return toString.call(value) == '[object ' + name + ']'; };
      
      return {
        isNotNull: function isNotNull(value) { return value !== null; },
        isNull: function isNull (value) { return value === null; },
        isNumber: function isNumber(value) { return is(value, 'Number'); },
        isString: function isString(value) { return is(value, 'String'); },
        isArguments: function isArguments(value) { return is(value, 'Arguments'); },
        isFunction: function isFunction(value) { return is(value, 'Function'); },
        isDate: function isDate(value) { return is(value, 'Date'); },
        isRegExp: function isRegExp(value) { return is(value, 'RegExp'); },
        isUndefined: function isUndefined(value) { return value === undefined; },
        isDefined: function isDefined(value) { return value !== undefined; },
        isObject: function isDefined(value) { return typeof value === 'object' && value !== null; }
      };
    },

    _injectValidationFuncs: function () {
      var that = this,
          funcNames = Object.keys(that.validateFunctions);

      funcNames.forEach(function (name) {
        Swear.prototype[name] = function () {
           return that.runRule(name, that.validateFunctions[name].bind(that, that.currentValue));
        }
      });
    },

    getFailed: function () {
      return this.proxy.getFailed();
    },

    getSucceeded: function () {
      return this.proxy.getSucceeded();
    },

    onFail: function (ruleName) {
      return {
        id: generateId(),
        rule: ruleName,
        value: this.currentValue,
        showError: isObject(this.params.showError) ? this.params.showError[ruleName] : this.params.showError,
        logError: isObject(this.params.logError) ? this.params.logError[ruleName] : this.params.logError,
        errorMsg: isObject(this.params.errorMsg) ? this.params.errorMsg[ruleName] : this.params.errorMsg
      }
    },

    onSuccess: function (ruleName) {
      return {
        id: generateId(),
        value: this.currentValue,
        rule: ruleName
      }
    },

    runRule: function (ruleName, func) {
      if (!this.currentValue) throw new Error("currentValue is not set.");
      if (!func) throw new Error("func is not set.");
      if (!ruleName) throw new Error("ruleName is not set.");

      var check = func();
      if (!check) this.proxy.addFailed(this.onFail(ruleName));
      else this.proxy.addSucceeded(this.onSuccess(ruleName));

      return this;
    },

    done: function () {
      this.currentValue = null;
      return this.proxy.getFailed().length === 0;
    },

    value: function (value) {
      this.currentValue = value;
      this.proxy.clearFailed();
      this.proxy.clearSucceeded();

      return this;
    }
  };

  return Swear;
}));