function setGooglePreview(searchTerm, pblock) {
  var url = "http://ajax.googleapis.com/ajax/services/search/web";  
  params = { v: "1.0", q: searchTerm }
  
  jQuery.get( url, params, function(data) {
    var numToDisplay = 3;
    var results = data.responseData.results.splice( 0, numToDisplay );
    
    pblock.innerHTML = renderTemplate( "searchresults.html", {results:results} );
  }, "json")
}

function loadMap(lat, lng) {
  if (GBrowserIsCompatible) {
    var map = new GMap2(document.getElementById("map"));
    var point = new GLatLng(lat, lng);
    map.setCenter(point, 13);
    map.addOverlay(new GMarker(point));
    map.addControl(new GSmallMapControl());
  }
}

function setMapPreview(searchTerm, pblock) {
  var doc = context.focusedWindow.document;
  var url = "http://maps.google.com/maps/geo";
  var apikey = "ABQIAAAAzr2EBOXUKnm_jVnk0OJI7xSsTL4WIgxhMZ0ZK_kHjwHeQuOD4xQJpBVbSrqNn69S6DOTv203MQ5ufA";
  var params = "key=" + apikey + "&q=" + encodeURIComponent(searchTerm);

  var req = new XMLHttpRequest();
  req.open('GET', url + "?" + params, true);
  req.overrideMimeType('application/json');
  req.onreadystatechange = function() {
    if (req.readyState == 4 && req.status == 200) {
      var jobj = eval( '(' + req.responseText + ')' );
      var numToDisplay = 3;

      if (!jobj.Placemark) {
        displayMessage("not specific enough");
        return;
      }

      var placemark = jobj.Placemark[0];
      var lng0 = placemark.Point.coordinates[0];
      var lat0 = placemark.Point.coordinates[1];

      var html = "<div id=\"address-list\">";
      for (var i=0; i<numToDisplay; i++) {
        if (jobj.Placemark[i]) {
          var address = jobj.Placemark[i].address;
          var lng = jobj.Placemark[i].Point.coordinates[0];
          var lat = jobj.Placemark[i].Point.coordinates[1];

          html = html + "<div class=\"gaddress\">" +
                        "<a href=\"#\" onclick=\"loadMap(" + lat + ", " + lng + ");\">" +
                        address + "</a></div>";
        }
      }
      html = html + "</div>" +
                    "<div id=\"map\">[map]</div>";

      // For now, just displaying the address listings and the map
      pblock.innerHTML = html;

      // This call to load map doesn't have access to the google api script which is currently included in the popup in browser.xul
      // Possibly insert a script tag here instead- doesn't seem to be working either: doesn't actually LOAD (ie: onload event never fires)
      loadMap(lat0, lng0);

    }
  };
  req.send(null);
}

function setDefaultSearchPreview( name, query, pblock ) {
  var content = ("Performs a " + name + " search for <b>" +
            escape(query) + "</b>.");
  pblock.innerHTML = content;
}

function makeSearchCommand(name, urlTemplate, icon) {
  var cmd = function(query, modifiers) {
    var urlString = urlTemplate.replace("{QUERY}", query);
    openUrlInBrowser(urlString);
    setLastResult( urlString );
  };

  cmd.icon = icon;

  cmd.preview = function(pblock, query, modifiers) {
    if (query) {
      switch( name ) {
        case "Google":
          setGooglePreview(query, pblock);
          break;
        case "Google Maps":
          setMapPreview(query, pblock);
          break;
        default:
          setDefaultSearchPreview(name, query, pblock);
      }
    }
  };

  cmd.DOType = arbText;
  cmd.DOLabel = "search term";
  cmd.modifiers = {};
  return cmd;
}

var cmd_google = makeSearchCommand(
  "Google",
  "http://www.google.com/search?q={QUERY}",
  "http://www.google.com/favicon.ico"
);

var cmd_imdb = makeSearchCommand(
  "IMDB",
  "http://www.imdb.com/find?s=all&q={QUERY}&x=0&y=0",
  "http://i.imdb.com/favicon.ico"
);

var cmd_map_it = makeSearchCommand(
  "Google Maps",
  "http://maps.google.com/?q={QUERY}",
  "http://www.google.com/favicon.ico"
);

var cmd_bugzilla = makeSearchCommand(
  "Bugzilla",
  "https://bugzilla.mozilla.org/buglist.cgi?query_format=specific&order=relevance+desc&bug_status=__open__&content={QUERY}",
  "https://bugzilla.mozilla.org/favicon.ico"
);
  

function cmd_yelp( query, info ) {  
  var url = "http://www.yelp.com/search?find_desc={QUERY}&find_loc={NEAR}";
  url = url.replace( /{QUERY}/g, query);
  url = url.replace( /{NEAR}/g, info.near);

  openUrlInBrowser( url );
}

cmd_yelp.preview = function( pblock, query, info ) {
  var url = "http://api.yelp.com/business_review_search?";
  
  if( query.length == 0 ) return;
  
  loc = getLocation();
  var near = info.near || (loc.city + ", " + loc.state);
    
  var params = {
    term: query,
    num_biz_requested: 4,
    location: near,
    ywsid: "HbSZ2zXYuMnu1VTImlyA9A"
  }
  
  jQuery.get( url, params, function(data) {
    pblock.innerHTML = renderTemplate( "yelp.html", {businesses: data.businesses} );
  }, "json")
  
}

cmd_yelp.DOName = "restaurant";
cmd_yelp.DOType = arbText;
cmd_yelp.icon = "http://www.yelp.com/favicon.ico";
// TODO: Should be AddressNounType
// Why doesn't {near:AddressNounType}; work?
cmd_yelp.modifiers = {near:arbText};




// -----------------------------------------------------------------
// TEXT COMMANDS
// -----------------------------------------------------------------

function cmd_bold() {
  var doc = context.focusedWindow.document;

  if (doc.designMode == "on")
    doc.execCommand("bold", false, null);
  else
    displayMessage("You're not in a rich text editing field.");
}

function cmd_italic() {
  var doc = context.focusedWindow.document;

  if (doc.designMode == "on")
    doc.execCommand("italic", false, null);
  else
    displayMessage("You're not in a rich text editing field.");
}

function cmd_underline() {
  var doc = context.focusedWindow.document;

  if (doc.designMode == "on")
    doc.execCommand("underline", false, null);
  else
    displayMessage("You're not in a rich text editing field.");
}

function cmd_undo() {
  var doc = context.focusedWindow.document;

  if (doc.designMode == "on")
    doc.execCommand("undo", false, null);
  else
    displayMessage("You're not in a rich text editing field.");
}

function cmd_redo() {
  var doc = context.focusedWindow.document;

  if (doc.designMode == "on")
    doc.execCommand("redo", false, null);
  else
    displayMessage("You're not in a rich text editing field.");
}


function cmd_calculate( expr ) {
  if( expr.length > 0 ) {
    var result = eval( expr );
    setTextSelection( result );
    setLastResult( result );
  } else
    displayMessage( "Requires an expression.");
}

cmd_calculate.preview = function( pblock, expr ) {
  if( expr.length < 1 ){
    pblock.innerHTML = "Calculates an expression. E.g., 22/7.";
    return;
  }

  pblock.innerHTML = expr + " = ";
  try{
    pblock.innerHTML += eval( expr );
  } catch(e) {
    pblock.innerHTML += "?";
  }

}

cmd_calculate.DOType = arbText;
cmd_calculate.DOName = "expression";
cmd_calculate.modifiers = {};
cmd_calculate.icon = "http://www.metacalc.com/favicon.ico";



function defineWord(word, callback) {
  var url = "http://services.aonaware.com/DictService/DictService.asmx/DefineInDict";
  var params = paramsToString({
    dictId: "wn", //wn: WordNet, gcide: Collaborative Dictionary
    word: word
  });

  ajaxGet(url + params, function(xml) {
    loadJQuery( function() {
      var $ = window.jQuery;
      var text = $(xml).find("WordDefinition").text();
      callback(text);
    });
  });
}

function cmd_define( word ) {
  openUrlInBrowser( "http://www.answers.com/" + escape(word) );
}

cmd_define.preview = function( pblock, word ) {
  defineWord( word, function(text){
    text = text.replace(/(\d+:)/g, "<br/><b>$&</b>");
    text = text.replace(/(1:)/g, "<br/>$&");
    text = text.replace(word, "<span style='font-size:18px;'>$&</span>");
    text = text.replace(/\[.*?\]/g, "");

    pblock.innerHTML = text;
  });
}

cmd_define.DOType = arbText;
cmd_define.DOName = "word";
cmd_define.modifiers = {};

// -----------------------------------------------------------------
// TRANSLATE COMMANDS
// -----------------------------------------------------------------

var Languages = {
  'ARABIC' : 'ar',
  'CHINESE' : 'zh',
  'CHINESE_TRADITIONAL' : 'zh-TW',
  'DANISH' : 'da',
  'DUTCH': 'nl',
  'ENGLISH' : 'en',
  'FINNISH' : 'fi',
  'FRENCH' : 'fr',
  'GERMAN' : 'de',
  'GREEK' : 'el',
  'HINDI' : 'hi',
  'ITALIAN' : 'it',
  'JAPANESE' : 'ja',
  'KOREAN' : 'ko',
  'NORWEGIAN' : 'no',
  'POLISH' : 'pl',
  'PORTUGUESE' : 'pt-PT',
  'ROMANIAN' : 'ro',
  'RUSSIAN' : 'ru',
  'SPANISH' : 'es',
  'SWEDISH' : 'sv'
};

function log( title, what ){
  getWindowInsecure().console.log( title, what );
}

function translateTo( text, langCodePair, callback ) {
  var url = "http://ajax.googleapis.com/ajax/services/language/translate";

  if( typeof(langCodePair.from) == "undefined" ) langCodePair.from = "";
  if( typeof(langCodePair.to) == "undefined" ) langCodePair.to = "";

  var params = paramsToString({
    v: "1.0",
    q: text,
    langpair: langCodePair.from + "|" + langCodePair.to
  });

  ajaxGet( url + params, function(jsonData){
    var data = eval( '(' + jsonData + ')' );

    // The usefulness of this command is limited because of the
    // length restriction enforced by Google. A better way to do
    // this would be to split up the request into multiple chunks.
    // The other method is to contact Google and get a special
    // account.

    try {
      var translatedText = data.responseData.translatedText;
    } catch(e) {

      // If we get this error message, that means Google wasn't able to
      // guess the originating language. Let's assume it was English.
      // TODO: Localize this.
      var BAD_FROM_LANG_GUESS_MSG = "invalid translation language pair";
      if( data.responseDetails == BAD_FROM_LANG_GUESS_MSG ){
        // Don't do infinite loops. If we already have a guess language
        // that matches the current forced from language, abort!
        if( langCodePair.from != "en" )
          translateTo( text, {from:"en", to:langCodePair.to}, callback );
        return;
      }
      else {
        displayMessage( "Translation Error: " + data.responseDetails );
      }
      return;
    }

    if( typeof callback == "function" )
      callback( translatedText );
    else
      setTextSelection( translatedText );

    setLastResult( translatedText );
  });
}

function cmd_translate( textToTranslate, languages ) {
  // Default to translating to English if no to language
  // is specified.
  // TODO: Choose the default in a better way.

  var toLang = languages.to || "English";
  var fromLang = languages.from || "";
  var toLangCode = Languages[toLang.toUpperCase()];

  translateTo( textToTranslate, {to:toLangCode} );
}

cmd_translate.preview = function( pblock, textToTranslate, languages ) {
  var toLang = languages.to || "English";

  var toLangCode = Languages[toLang.toUpperCase()];
  var lang = toLang[0].toUpperCase() + toLang.substr(1);

  pblock.innerHTML = "Replaces the selected text with the " + lang + " translation:<br/>";
  translateTo( textToTranslate, {to:toLangCode}, function( translation ) {
    pblock.innerHTML = "Replaces the selected text with the " + lang + " translation:<br/>";
    pblock.innerHTML += "<i style='padding:10px;color: #CCC;display:block;'>" + translation + "</i>";
	      })
}


cmd_translate.DOType = arbText;
cmd_translate.DOLabel = "text to translate";
cmd_translate.modifiers = {to:languageNounType, from:languageNounType};

// -----------------------------------------------------------------
// SYSTEM COMMANDS
// -----------------------------------------------------------------

function cmd_help() {
  openUrlInBrowser("about:ubiquity");
}

cmd_help.preview = function(pblock) {
  pblock.innerHTML = ("Provides help on using Ubiquity, as well " +
                      "as access to preferences, etc.");
}


function findGmailTab() {
  var window = Application.activeWindow;

  for (var i = 0; i < window.tabs.length; i++) {
    var tab = window.tabs[i];
    var location = String(tab.document.location);
    if (location.indexOf("://mail.google.com") != -1) {
      return tab;
    }
  }
  return null;
}

function cmd_email(html, headers) {
  var document = context.focusedWindow.document;
  var title = document.title;
  var location = document.location;
  var gmailTab = findGmailTab();
  /* TODO get headers["to"] and put it in the right field*/
  if (html)
    html = ("<p>From the page <a href=\"" + location +
            "\">" + title + "</a>:</p>" + html);
  else {
    displayMessage("No selected HTML!");
    return;
  }

  if (gmailTab) {
    // Note that this is technically insecure because we're
    // accessing wrappedJSObject, but we're only executing this
    // in a Gmail tab, and Gmail is trusted code.
    var console = gmailTab.document.defaultView.wrappedJSObject.console;
    var gmonkey = gmailTab.document.defaultView.wrappedJSObject.gmonkey;

    var continuer = function() {
      // For some reason continuer.apply() won't work--we get
      // a security violation on Function.__parent__--so we'll
      // manually safety-wrap this.
      try {
        var gmail = gmonkey.get("1");
        var sidebar = gmail.getNavPaneElement();
        var composeMail = sidebar.getElementsByTagName("span")[0];
        var event = composeMail.ownerDocument.createEvent("Events");
        event.initEvent("click", true, false);
        composeMail.dispatchEvent(event);
        var active = gmail.getActiveViewElement();
        var subject = active.getElementsByTagName("input")[0];
        subject.value = "'"+title+"'";
        var iframe = active.getElementsByTagName("iframe")[0];
        iframe.contentDocument.execCommand("insertHTML", false, html);
        gmailTab.focus();
      } catch (e) {
        displayMessage({text: "A gmonkey exception occurred.",
                        exception: e});
      }
    };

    gmonkey.load("1", continuer);
  } else
    displayMessage("Gmail must be open in a tab.");
  // TODO why not open gmail if it's not already open?
}

cmd_email.preview = function(pblock, directObject, modifiers) {
  var html = "Creates an email message ";
  if (modifiers["to"]) {
    html += "to " + modifiers["to"];
  }
  html += "with these contents:" + directObject;
  pblock.innerHTML = html;
}

cmd_email.DOLabel = "message";
cmd_email.DOType = arbHtml;
cmd_email.modifiers = {
  to: PersonNounType
};


function cmd_editor() {
  openUrlInBrowser("chrome://ubiquity/content/editor.html");
}

function cmd_dostuff() {
  displayMessage( "I am doing stuff!\n" );
}

function cmd_remember( directObj, modifiers ) {
  displayMessage( "I am remembering " + directObj );
  setLastResult( directObj );
}
cmd_remember.DOLabel = "thing";
cmd_remember.DOType = arbText;
cmd_remember.modifiers = {};
