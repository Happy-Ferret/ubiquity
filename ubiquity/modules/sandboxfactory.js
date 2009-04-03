/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ubiquity.
 *
 * The Initial Developer of the Original Code is Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Atul Varma <atul@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

EXPORTED_SYMBOLS = ["SandboxFactory"];

Components.utils.import("resource://ubiquity/modules/utils.js");

const Cc = Components.classes;
const Ci = Components.interfaces;

var ubiquityProtocol = Components.utils.import(
  "resource://ubiquity/modules/ubiquity_protocol.js"
);

var defaultTarget = this;

function SandboxFactory(globals, target, ignoreUbiquityProtocol) {
  this._ignoreUbiquityProtocol = ignoreUbiquityProtocol;
  if (typeof(target) == "undefined")
    target = defaultTarget;
  this._target = target;

  if (globals == undefined)
    globals = {};

  if (typeof(globals) == "function")
    this._makeGlobals = globals;
  else
    this._makeGlobals = function defaultMakeGlobals(id) {
      return globals;
    };
}

SandboxFactory.protectedFileUriPrefix = "";

var PROTOCOL_URI_PREFIX = "ubiquity://";
var gDidTryToProtectProtocol = false;
var gIsProtocolProtected = false;

function makeProtectedFilename(filename) {
  if (!gDidTryToProtectProtocol) {
    // Tell XPConnect that anything which begins with PROTOCOL_URI_PREFIX
    // should be considered protected content, and therefore any
    // untrusted content accessed by it should implicitly have
    // XPCNativeWrappers made for it.

    try {
      let ubiquity = Components.classes["@labs.mozilla.com/ubiquity;1"]
                     .getService(Components.interfaces.nsIUbiquity);

      ubiquity.flagSystemFilenamePrefix(PROTOCOL_URI_PREFIX, true);
      gIsProtocolProtected = true;
    } catch (e) {
      // The binary component was probably compiled for a different
      // version of the platform which is looking for a nonexistent
      // IID of nsIXPConnect, or the binary component just isn't
      // compiled for this particular platform. Guess we'll just
      // do our best to let the user know what the "real"
      // filename is by appending it to a known protected
      // prefix.

      var ioService = Cc["@mozilla.org/network/io-service;1"].
                      getService(Ci.nsIIOService);

      var resProt = ioService.getProtocolHandler("resource")
                    .QueryInterface(Ci.nsIResProtocolHandler);

      SandboxFactory.protectedFileUriPrefix = resProt.resolveURI(
        Utils.url("resource://ubiquity/modules/sandboxfactory.js")
      ) + "#";
    }

    gDidTryToProtectProtocol = true;
  }

  if (gIsProtocolProtected) {
    if (filename.indexOf(PROTOCOL_URI_PREFIX) != 0) {
      ubiquityProtocol.setPath(filename, filename);
      filename = PROTOCOL_URI_PREFIX + filename;
    }
  } else
    filename = SandboxFactory.protectedFileUriPrefix + filename;

  return filename;
}

SandboxFactory.prototype = {
  makeSandbox: function makeSandbox(codeSource) {
    var sandbox = Components.utils.Sandbox(this._target);
    var globals = this._makeGlobals(codeSource);

    for (symbolName in globals) {
      sandbox[symbolName] = globals[symbolName];
    }

    return sandbox;
  },

  evalInSandbox: function evalInSandbox(code, sandbox, codeSections) {
    var retVal;
    let currIndex = 0;
    for (let i = 0; i < codeSections.length; i++) {
      let section = codeSections[i];
      let filename;

      if (!this._ignoreUbiquityProtocol)
        filename = makeProtectedFilename(section.filename);

      let sourceCode = code.slice(currIndex, currIndex + section.length);

      retVal = Components.utils.evalInSandbox(sourceCode,
                                              sandbox,
                                              "1.8",
                                              filename,
                                              section.lineNumber);

      currIndex += section.length;
    }
    return retVal;
  }
};
