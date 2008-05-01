function makeSearchCommand(urlTemplate, icon)
{
    var cmd = function(context) {
        var sel = getTextSelection(context);
        var urlString = urlTemplate.replace("{QUERY}", sel);

        openUrlInBrowser(urlString);
    };
    cmd.icon = icon;
    return cmd;
}

var cmd_google = makeSearchCommand(
    "http://www.google.com/search?q={QUERY}",
    "http://www.google.com/favicon.ico"
);

var cmd_imdb = makeSearchCommand(
    "http://www.imdb.com/find?s=all&q={QUERY}&x=0&y=0",
    "http://i.imdb.com/favicon.ico"
);

var cmd_open_map = makeSearchCommand(
	"http://maps.google.com/?q={QUERY}",
	"http://www.google.com/favicon.ico"
)


function cmd_bold(context)
{
    var doc = context.focusedWindow.document;
    if (doc.designMode == "on")
    {
        doc.execCommand("bold", false, null);
    } else {
        displayMessage("You're not in a rich text editing field.");
    }
}

function cmd_editor(context)
{
    openUrlInBrowser("chrome://friday/content/editor.html");
}

function findGmailTab()
{
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

function getSelectedHtml(context)
{
    var sel = context.focusedWindow.getSelection();
    var html = null;

    if (sel.rangeCount >= 1) {
        var html = sel.getRangeAt(0).cloneContents();
        var newNode = context.focusedWindow.document.createElement("p");
        newNode.appendChild(html);
        return newNode.innerHTML;
    }
    return null;
}

function cmd_email(context)
{
    var document = context.focusedWindow.document;
    var title = document.title;
    var location = document.location;
    var gmailTab = findGmailTab();
    var html = getSelectedHtml(context);

    if (html) {
        html = "<p>From the page <a href=\""+location+"\">" + title + "</a>:</p>" + html;
    } else {
        displayMessage("No selected HTML!");
        return;
    }

    if (gmailTab) {
        var console = gmailTab.document.defaultView.wrappedJSObject.console;
        var gmonkey = gmailTab.document.defaultView.wrappedJSObject.gmonkey;

        var continuer = function() {
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
        };

        gmonkey.load("1", safeWrapper(continuer));
    } else {
        displayMessage("Gmail must be open in a tab.");
    }
}

function cmd_highlight(context)
{
    var sel = context.focusedWindow.getSelection();
    var document = context.focusedWindow.document;

    if (sel.rangeCount >= 1) {
        var range = sel.getRangeAt(0);
        var newNode = document.createElement("span");
        newNode.style.background = "yellow";
        range.surroundContents(newNode);
    }
}

function cmd_to_rich_text(context)
{
    var html = getTextSelection(context);

    if (html) {
        var doc = context.focusedWindow.document;
        if (doc.designMode == "on")
        {
            doc.execCommand("insertHTML", false, html);
        } else {
            displayMessage("You're not in a rich text editing field.");
        }
    }
}

function cmd_to_html(context)
{
    var html = getSelectedHtml(context);

    if (html) {
        var doc = context.focusedWindow.document;
        if (doc.designMode == "on")
        {
            html = html.replace(/&/g, "&amp;");
            html = html.replace(/>/g, "&gt;");
            html = html.replace(/</g, "&lt;");
            doc.execCommand("insertHTML", false, html);
        } else {
            displayMessage("You're not in a rich text editing field.");
        }
    }
}

function cmd_link_to_wikipedia(context)
{
    var text = getTextSelection(context);

    if (text) {
        var wikiText = text.replace(/ /g, "_");

        var html = ("<a href=\"http://en.wikipedia.org/wiki/" +
                    + "Special:Search/" + wikiText +
                    "\">" + text + "</a>");

        var doc = context.focusedWindow.document;
        if (doc.designMode == "on")
        {
            doc.execCommand("insertHTML", false, html);
        } else {
            displayMessage("You're not in a rich text editing field.");
        }
    }
}


function cmd_signature(context)
{
	setTextSelection( "-- aza | ɐzɐ --", context );
}

function cmd_swedish(context)
{
	
	URL = "http://www.cs.utexas.edu/users/jbc/bork/bork.cgi?";
	params = "type=chef&input=" + getTextSelection(context);
	
	ajaxGet( URL + params, function(data){
		setTextSelection( data, context );	
	})
}

function cmd_calculate( context )
{
	result = eval( getTextSelection(context) );
	displayMessage( getTextSelection(context) );
	setTextSelection( result, context );
}

function cmd_map( context ){
	var apiKey = "ABQIAAAAzr2EBOXUKnm_jVnk0OJI7xSsTL4WIgxhMZ0ZK_kHjwHeQuOD4xQJpBVbSrqNn69S6DOTv203MQ5ufA";

	var geocodeUrl = "http://maps.google.com/maps/geo?key={key}&q={query}&output=csv";
	var query = getTextSelection(context);
	geocodeUrl = geocodeUrl.replace( /{key}/, apiKey )
						   .replace( /{query}/, escape(query) )

	var mapUrl = "http://maps.google.com/staticmap?";
	mapUrl += "center={point}&zoom=14&size=512x256&maptype=mobile&markers={point},red&key={key}";
	mapUrl = mapUrl.replace( /{key}/, apiKey );

	ajaxGet( geocodeUrl, function(data){
		data = data.split(",");
		var point = data[2] + "," + data[3];
		
		var src = mapUrl.replace( /{point}/g, point );
		var imgHtml = "<img src='{src}'/>".replace( /{src}/, src );
		
		setTextSelection( query + "<br/>" + imgHtml, context );
	})
}

function cmd_inject_jquery( context ){
	injectJavascript( "http://code.jquery.com/jquery-latest.pack.js", context );
}

function cmd_fade_page( context ){
	var fadeTime = 1000;
	window.context = context;
	loadJQuery( function(){
		$ = window.jQuery;
		$("body").fadeOut( fadeTime );
		setTimeout( function(){ $("body").fadeIn( fadeTime ) }, fadeTime);
	});
}

function cmd_inspect( context ){
	window.context = context;
	injectCss( "._highlight{ background-color: #ffffcc;}" );
	loadJQuery( function(){
		$ = window.jQuery;
		$("body").mouseover( function(e){
			$(e.target).addClass("_highlight")
			.one( "mouseout", function(){
				$(this).removeClass( "_highlight" );
			})
		});
	});	
}

function cmd_javascript_console( context ){
	window.context = context;
	injectCss( "#_box{ position:fixed; left:0; bottom:0; width:100%; " +
			   "       height: 200px; background-color:#CCC; display:none; " +
			   "       border-top: 1px solid #999; font-size: 9pt; overflow-y: auto;} " + 
			   "#_close{ float:right; } " + 
			   "#_box #input{ width:95%; border:none; height:2em; font-weight:bold; background:none;}" + 
			   "#_box #output{ width:100%; white-space: pre; white-space: -moz-pre-wrap;} " + 
			   "#_box .input{ font-weight:bold;} " +
			   "#_box .big{ font-weight:bold;}")
	
	injectHtml( "<div id='_box'><span id='_close'>[Close]</span><div id='output'><div class='big'>Welcome to the Ubiquity Javascript Console</div><div>Features: autocompletion of property names with Tab, multiline input with Shift+Enter, input history with (Ctrl+) Up/Down, <a accesskey=\"M\" href=\"javascript:go('scope(Math); mathHelp();');\" title=\"Accesskey: M\">Math</a>,</div><div>Values and functions: ans, print(string), <a accesskey=\"P\" href=\"javascript:go('props(ans)')\" title=\"Accesskey: P\">props(object)</a>, <a accesskey=\"B\" href=\"javascript:go('blink(ans)')\" title=\"Accesskey: B\">blink(node)</a>, <a accesskey=\"C\" href=\"javascript:go('clear()')\" title=\"Accesskey: C\">clear()</a>, load(scriptURL), scope(object), jQuery, $</div></div><textarea id='input' wrap='off' onkeydown='inputKeydown(event)' rows='1'></textarea></div>" );
	
	injectJavascript(
		"http://jconsole.com/shell.js",
		function(){ injectHtml( "<script>init();</script>") }
	);
	
	loadJQuery( function(){
		$ = window.jQuery;
		$("#_box").slideDown();
		setTimeout( function(){
			$('#_box #input').select();
		}, 1000 )
		$("#_close").click( function(){
			$("#_box").slideUp();
		})
	})
}


