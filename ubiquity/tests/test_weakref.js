Components.utils.import("resource://ubiquity/tests/framework.js");

function test_basic_weakref() {
  var weakref;
  try {
    weakref = Components.classes["@labs.mozilla.com/jsweakrefdi;1"]
              .createInstance(Components.interfaces.nsIJSWeakRef);
  } catch (e) {
    throw new this.SkipTestError();
  }

  var obj = new Object();
  weakref.set(obj);
  this.assertEquals(weakref.get(), obj,
                    "weakref.get() should be obj.");

  var weakref2 = Components.classes["@labs.mozilla.com/jsweakrefdi;1"]
                 .createInstance(Components.interfaces.nsIJSWeakRef);
  var obj2 = new Object();
  weakref2.set(obj2);
  this.assertEquals(weakref2.get(), obj2,
                    "weakref2.get() should be obj2.");

  this.assertEquals(weakref.get(), obj,
                    "weakref.get() should be obj.");
}

function test_GC_works() {
  var weakref;
  try {
    weakref = Components.classes["@labs.mozilla.com/jsweakrefdi;1"]
              .createInstance(Components.interfaces.nsIJSWeakRef);
  } catch (e) {
    throw new this.SkipTestError();
  }

  var obj = new Object();
  weakref.set(obj);

  obj = null;

  var debug = Components.classes["@mozilla.org/js/jsd/debugger-service;1"]
              .getService(Components.interfaces.jsdIDebuggerService);
  if (!debug.isOn)
    debug.on();
  debug.GC();

  this.assertEquals(weakref.get(), null,
                    "weakref.get() should be null.");

}

exportTests(this);
