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

var EXPORTED_SYMBOLS = ["loadExtension", "setExtension"];

const Cc = Components.classes;
const Ci = Components.interfaces;

var extension = null;

function log(msg) {
  //Components.utils.reportError(msg);
}

function loadExtension(url, parentWindow) {
  if (!extension) {
    if (!parentWindow)
      parentWindow = Cc["@mozilla.org/appshell/appShellService;1"]
                     .getService(Ci.nsIAppShellService)
                     .hiddenDOMWindow;

    log("Creating a new iframe.");
    var iframe = parentWindow.document.createElement("iframe");
    iframe.setAttribute("src", url);
    parentWindow.document.documentElement.appendChild(iframe);
    extension = iframe.contentWindow;
  }
}

function onExtensionUnload(event) {
  if (extension == event.originalTarget.defaultView) {
    log("Current extension is unloading.");
    extension = null;
    loadExtension(event.originalTarget.location.href);
  } else
    log("Old extension is unloading.");
}

function setExtension(window) {
  if (extension == window || window.frameElement)
    return;

  var oldExtension = extension;
  extension = window;
  if (oldExtension) {
    var iframe = oldExtension.frameElement;
    if (iframe) {
      log("Closing old extension iframe.");
      iframe.parentNode.removeChild(iframe);
    } else {
      log("Closing old extension window.");
      oldExtension.close();
    }
  }

  log("New extension window set.");
  extension.addEventListener("unload", onExtensionUnload, false);
}
