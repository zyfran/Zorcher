var zorcherOptionModule = {
	srchEngines: [],
	currEngine: '',
	rows: null,
	mainPref: null,
	func: zorcherMainModule,
	onLoad: function()
	{
		this.func.Init();
		this.srchEngines = this.func.browser.getEngines();
		this.currEngine = this.func.browser.getCurrentEngine();
		this.rows = document.getElementById( 'zorcherSearchEngines' );
		this.mainPref = document.getElementById( 'zorcher_prefs' );
		this.createItems();
	},
	unLoad: function()
	{
		var winEnum = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getEnumerator("navigator:browser");
		while (winEnum.hasMoreElements())
		{
			var win = winEnum.getNext().QueryInterface(Components.interfaces.nsIDOMWindow);
			try
			{
				win.zorcherMainModule.reloadElements();
			}
			catch (e) {}
		}
	},
	createItems: function()
	{
		var i, j, pref = zorcherPreferences.getBranch( "extensions.zorcher.searchers." ), row, checkbox, preference;
		var childPref = pref.getChildList( "", {} );
		for ( i = 0; i < this.srchEngines.length; i += 4 )
		{
			row = document.createElement( 'row' );
			this.rows.appendChild( row );
			var engArray = [];
			for ( j = 0; j < 4; j++ )
				if ( this.srchEngines[i + j] )
					engArray.push( this.srchEngines[i + j] );
			for ( j = 0; j < engArray.length; j++ )
			{
				var rusName = this.func.stringHash( engArray[j].name );
				checkbox = document.createElement( 'checkbox' );
				preference = document.createElement( 'preference' );
				if ( this.func.inArray( rusName, childPref ) == -1 )
				{
					var newPrefValue = ( engArray[j].name == this.currEngine && childPref.length == 0 )? true: false;
					pref.setBoolPref( rusName, newPrefValue );
				}
				preference.setAttribute( 'id', 'zorcher_search_' + rusName + '_bool' );
				preference.setAttribute( 'type', 'bool' );
				preference.setAttribute( 'name', 'extensions.zorcher.searchers.' + rusName );
				checkbox.setAttribute( 'label', engArray[j].name );
				checkbox.setAttribute( 'class', 'zorcherEngines'+((engArray[j].name == this.currEngine)?' zorcher-bold':'') );
				checkbox.setAttribute( 'disabled', !zorcherPreferences.getBoolPref( 'extensions.zorcher.all_search' ) );
				checkbox.setAttribute( 'src', ( engArray[j].iconURI && engArray[j].iconURI.spec != '' )? engArray[j].iconURI.spec: 'chrome://zorcher/skin/unknown.gif' );
				checkbox.setAttribute( 'preference', 'zorcher_search_' + rusName + '_bool' );
				row.appendChild( checkbox );
				this.mainPref.appendChild( preference );
			}
		}
	},
	checkInput: function( check )
	{
		var node = document.getElementsByTagName( 'checkbox' ), i;
		for ( i = 0; i < node.length; i++ )
			if ( node[i].getAttribute( 'class' ).search('zorcherEngines') != -1 )
				node[i].setAttribute( 'disabled', !check );
	}
}
window.addEventListener( 'load', function() {zorcherOptionModule.onLoad();}, false );
window.addEventListener( 'unload', function() {zorcherOptionModule.unLoad();}, false );