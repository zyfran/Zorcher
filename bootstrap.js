const Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils;
const ZorcherID = '{f8b811fa-75a4-41f7-8fdd-376a02a29aa6}';

Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/AddonManager.jsm');

var global = null;

function main(window)
{
	let doc = window.document;
	
	function $(id) doc.getElementById(id)
	function xul(type) doc.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', type)
	
	let addon = $('statusbar') || $('addon-bar'), barbutton, barpopup;
	if (addon) {
		barbutton = xul('toolbarbutton');
		barbutton.id = 'zorcher-bar';
		barbutton.setAttribute('label', 'Zorcher');
		barbutton.setAttribute('type', 'menu-button');
		barbutton.setAttribute('tooltiptext', 'Zorcher');
		//barbutton.setAttribute('class', 'zorcher-iconic');
		addon.appendChild(barbutton);
		barpopup = xul('menupopup');
		barpopup.id = 'zorcher-optons-menu';
		barbutton.appendChild(barpopup);
		let item = xul('menuitem');
		item.setAttribute('label', 'Options');
		barpopup.appendChild(item);
		item = xul('menuseparator');
		barpopup.appendChild(item);
		item = xul('menuitem');
		item.setAttribute('label', 'Multiple');
		item.setAttribute('type', 'checkbox');
		item.id = 'zorcher-multiple-selector';
		barpopup.appendChild(item);
	}
	
	let content = $('contentAreaContextMenu'), popup;
	if (content) {
		popup = xul('menu');
		popup.id = 'zorcher-popup';
		//popup.setAttribute('class', 'menu-iconic zorcher-icon');
		popup.setAttribute('label', 'Zorcher');
		popup.hidden = true;
		content.insertBefore(popup, $('context-searchselect'));
		content.addEventListener('popupshowing', showing, false);
	}
	
	unload(function()
	{
		barbutton && addon.removeChild(barbutton);
		popup && content.removeChild(popup);
		content.removeEventListener('popupshowing', showing, false);
	});
	
	function showing()
	{
		popup.hidden = !selection();
	}
	
	function selection(length)
	{
		length = !length ? 150 : length;
		
		var node = doc.popupNode, nodeElement = doc.commandDispatcher.focusedElement;
		var selection;
		
		if (node && ((
		              node instanceof window.HTMLInputElement && node.type == 'text'
		              ) || node instanceof window.HTMLTextAreaElement))
			selection = node.editor.selectionController.getSelection(Ci.nsISelectionController.SELECTION_NORMAL);
		else if (nodeElement && ((
		                          nodeElement instanceof window.HTMLInputElement && nodeElement.type == 'text'
		                          ) || nodeElement instanceof window.HTMLTextAreaElement))
			selection = nodeElement.editor.selectionController.getSelection(Ci.nsISelectionController.SELECTION_NORMAL);
		else
			selection = doc.commandDispatcher.focusedWindow.getSelection();
		
		return selection ? selection.toString().replace(/\s+/g, ' ').replace(/(^\s+)|(\s+$)/g, '').substring(0, length) : false;
	}
}

function inArray(val, arr)
{
	for (var i=0; i < arr.length; i++)
		if (arr[i] == val)
			return i;
	return -1;
}

function watchWindows(callback)
{
	function watcher(window)
	{
		try {
			callback(window);
		}
		catch(ex) {}
	}
	
	runOnWindows(callback);
	
	function windowWatcher(subject, topic)
	{
		if (topic == 'domwindowopened')
			runOnLoad(subject, watcher);
	}
	Services.ww.registerNotification(windowWatcher);
	
	unload(function() Services.ww.unregisterNotification(windowWatcher));
}

function runOnWindows(callback)
{
	function watcher(window)
	{
		try {
			callback(window);
		}
		catch(ex) {}
	}
	
	let browserWindows = Services.wm.getEnumerator('navigator:browser');
	while (browserWindows.hasMoreElements()) {
		let browserWindow = browserWindows.getNext();
		if (browserWindow.document.readyState == 'complete')
			watcher(browserWindow);
		else
			runOnLoad(browserWindow, watcher);
	}
}

function unload(callback, container)
{
	let unloaders = unload.unloaders;
	if (unloaders == null)
		unloaders = unload.unloaders = [];
	
	if (callback == null)
	{
		unloaders.slice().forEach(function(unloader) unloader());
		unloaders.length = 0;
		return null;
	}
	
	if (container != null)
	{
		container.addEventListener('unload', removeUnloader, false);
	
		let origCallback = callback;
		callback = function() {
		container.removeEventListener('unload', removeUnloader, false);
		origCallback();
		}
	}
	
	function unloader()
	{
		try {
			callback();
		}
		catch(ex) {}
	}
	unloaders.push(unloader);
	
	function removeUnloader()
	{
		let index = unloaders.indexOf(unloader);
		if (index != -1)
			unloaders.splice(index, 1);
	}
	return removeUnloader;
}

function runOnLoad(window, callback)
{
	window.addEventListener('load', function()
	{
		window.removeEventListener('load', arguments.callee, false);
		
		if (window.document.documentElement.getAttribute('windowtype') == 'navigator:browser')
			callback(window);
	}, false);
}

function startup(data, reason) watchWindows(main)

function shutdown(data, reason) unload()

function install(data, reason)
{
}

function uninstall(data, reason)
{
}
