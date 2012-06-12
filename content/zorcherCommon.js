var zorcherPreferences = Components.classes["@mozilla.org/preferences-service;1"].getService( Components.interfaces.nsIPrefService );
var zorcherBrowserModule = {
	FF: {
		AppID: '{ec8030f7-c20a-464f-9b0e-13a3a9e97384}',
		search: function( engine, text )
		{
			var submission = engine.getSubmission( text, null );
			gBrowser.loadOneTab( submission.uri.spec, {postData: submission.postData, relatedToCurrent: true} );
		},
		getEngines: function()
		{
			return Components.classes["@mozilla.org/browser/search-service;1"].getService( Components.interfaces.nsIBrowserSearchService ).getVisibleEngines( {} );
		},
		getCurrentEngine: function()
		{
			return Components.classes["@mozilla.org/browser/search-service;1"].getService( Components.interfaces.nsIBrowserSearchService ).currentEngine.name;
		}
	},
	SM: {
		AppID: '{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}',
		rdf: Components.classes["@mozilla.org/rdf/rdf-service;1"].getService( Components.interfaces.nsIRDFService ),
		search: function( engine, text )
		{
			try {
				var ds = this.rdf.GetDataSource( "rdf:internetsearch" ), kNC_Root = this.rdf.GetResource( "NC:SearchEngineRoot" ), prop = "http://home.netscape.com/NC-rdf#actionButton", engineRes = this.rdf.GetResource( engine.engine ), defaultSearchURL;
				var kNC_attr = this.rdf.GetResource( prop );
				text = encodeURIComponent( text );
				var searchURL = ds.GetTarget( engineRes, kNC_attr, true );
				searchURL = ( searchURL )? searchURL.QueryInterface( Components.interfaces.nsIRDFLiteral ).Value: '';
				if ( searchURL )
					defaultSearchURL = searchURL + text;
				else 
				{
					var searchDS = Components.classes["@mozilla.org/rdf/datasource;1?name=internetsearch"].getService( Components.interfaces.nsIInternetSearchService );
					searchDS.RememberLastSearchText(text);
					searchURL = searchDS.GetInternetSearchURL( engine.engine, text, 0, 0, {value:0} );
					if ( searchURL )
						defaultSearchURL = searchURL;
					else
						return;
				}
				gBrowser.addTab( defaultSearchURL );
			}
			catch (e)
			{
				try {
					var submission = engine.getSubmission( text, null );
					gBrowser.loadOneTab( submission.uri.spec, {postData: submission.postData, relatedToCurrent: true} );
				}
				catch (e){}
			}
		},
		getEngines: function()
		{
			try {
				var engines = [];
				var ds = this.rdf.GetDataSource( "rdf:internetsearch" ), kNC_Root = this.rdf.GetResource( "NC:SearchEngineRoot" ), kNC_child = this.rdf.GetResource( "http://home.netscape.com/NC-rdf#child" ), kNC_Name = this.rdf.GetResource( "http://home.netscape.com/NC-rdf#Name" );
				var arcs = ds.GetTargets( kNC_Root, kNC_child, true );
				while ( arcs.hasMoreElements() )
				{
					var engineRes = arcs.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
					var nameP = ds.GetTarget( engineRes, kNC_Name, true );
					nameP = ( nameP )? nameP.QueryInterface( Components.interfaces.nsIRDFLiteral ).Value: '';
					var kNC_icon = this.rdf.GetResource( "http://home.netscape.com/NC-rdf#Icon" );
					var icon = ds.GetTarget( engineRes, kNC_icon, true );
					icon = ( icon )? icon.QueryInterface( Components.interfaces.nsIRDFLiteral ).Value: '';
					engines.push( {name: nameP, iconURI: {spec: icon}, engine:engineRes.Value} );
				}
				return engines;
			}
			catch (e)
			{
				try {
					return Components.classes["@mozilla.org/browser/search-service;1"].getService( Components.interfaces.nsIBrowserSearchService ).getVisibleEngines( {} );
				}
				catch (e){}
			}
		},
		getCurrentEngine: function()
		{
			return zorcherPreferences.getComplexValue( "browser.search.defaultenginename", Components.interfaces.nsIPrefLocalizedString ).data;
		}
	}
}
var zorcherMainModule = {
	App: Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo).QueryInterface(Components.interfaces.nsIXULRuntime),
	browser: null,
	Init: function()
	{
		for ( var p in zorcherBrowserModule )
			if ( zorcherBrowserModule[p].AppID == this.App.ID )
				this.browser = zorcherBrowserModule[p];
		zorcherBrowserModule = null;
	},
	reloadElements: function()
	{
		document.getElementById( 'zorcher-multiple-checkbox' ).setAttribute( 'checked', zorcherPreferences.getBoolPref( 'extensions.zorcher.all_search' ) );
		try{
			document.getElementById( 'zorcher-searchbar' ).setAttribute( 'checked', zorcherPreferences.getBoolPref( 'extensions.zorcher.all_search' ) );
		}catch(e){}
	},
	searchOnePlugin: function( text, engine )
	{
		var srchEngines = this.browser.getEngines(), i;
		for ( i = 0; i < srchEngines.length; i++ )
		{
			if ( srchEngines[i].name == engine )
			{
				this.browser.search(srchEngines[i], text);
				break;
			}
		}
	},
	searchMultiplyPlugin: function( text )
	{
		var pref = zorcherPreferences.getBranch( "extensions.zorcher.searchers." ), i, request = true;
		var srchEngines = this.browser.getEngines();
		for ( i = 0; i < srchEngines.length; i++ )
		{
			if ( pref.getBoolPref( this.stringHash( srchEngines[i].name ) ) === true )
			{
				request = false;
				this.browser.search(srchEngines[i], text);
			}
		}
		return request;
	},
	selectedText: function( length )
	{
		if ( !length ) length = 150;
		var focused = document.commandDispatcher.focusedWindow, node = document.popupNode, nodeElement = document.commandDispatcher.focusedElement, selection;
		if ( node && (( node.type == "text" && node instanceof HTMLInputElement ) || node instanceof HTMLTextAreaElement ) )
			selection = node.editor.selectionController.getSelection(Components.interfaces.nsISelectionController.SELECTION_NORMAL);
		else if ( nodeElement && (( nodeElement.type == "text" && nodeElement instanceof HTMLInputElement ) || nodeElement instanceof HTMLTextAreaElement ) )
			selection =nodeElement.editor.selectionController.getSelection(Components.interfaces.nsISelectionController.SELECTION_NORMAL);
		else
			selection = focused.getSelection();
		return ( selection )? selection.toString().replace( /^\s+/, '' ).replace( /\s+$/, '' ).replace( /\s+/g, ' ' ).substring( 0, length ): false;
	},
	inArray: function( val, arr )
	{
		for ( var i=0; i < arr.length; i++ )
			if ( arr[i] == val )
				return i;
		return -1;
	},
	//SHA-1 implementation in JavaScript (c) Chris Veness 2002-2009 http://www.movable-type.co.uk/scripts/sha1.html
	stringHash: function( msg )
	{
		var K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
		msg += String.fromCharCode( 0x80 );
		var l = msg.length / 4 + 2;
		var N = Math.ceil( l / 16 );
		var M = new Array( N );
		for ( var i = 0; i < N; i++ )
		{
			M[i] = new Array( 16 );
			for ( var j = 0; j < 16; j++ )
				M[i][j] = ( msg.charCodeAt( i * 64 + j * 4) << 24 ) | ( msg.charCodeAt( i * 64 + j * 4 + 1 ) << 16 ) | ( msg.charCodeAt( i * 64 + j * 4 + 2 ) << 8 ) | ( msg.charCodeAt( i * 64 + j * 4 + 3 ) );
		}
		M[N-1][14] = ( ( msg.length - 1 ) * 8 ) / Math.pow( 2, 32 );
		M[N-1][14] = Math.floor( M[N-1][14] );
		M[N-1][15] = ( ( msg.length - 1 ) * 8 ) & 0xffffffff;
		var H0 = 0x67452301, H1 = 0xefcdab89, H2 = 0x98badcfe, H3 = 0x10325476, H4 = 0xc3d2e1f0;
		var W = new Array( 80 ), a, b, c, d, e;
		for ( var i=0; i < N; i++ )
		{
			for ( var t = 0;  t < 16; t++ )
				W[t] = M[i][t];
			for ( var t = 16; t < 80; t++ )
				W[t] = this.ROTL( W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16], 1 );
			a = H0; b = H1; c = H2; d = H3; e = H4;
			for ( var t = 0; t < 80; t++ )
			{
				var s = Math.floor( t / 20 );
				var T = ( this.ROTL( a, 5 ) + this.f( s, b, c, d ) + e + K[s] + W[t] ) & 0xffffffff;
				e = d;
				d = c;
				c = this.ROTL( b, 30 );
				b = a;
				a = T;
			}
			H0 = ( H0 + a ) & 0xffffffff;
			H1 = ( H1 + b ) & 0xffffffff; 
			H2 = ( H2 + c ) & 0xffffffff; 
			H3 = ( H3 + d ) & 0xffffffff; 
			H4 = ( H4+e ) & 0xffffffff;
		}
		return this.toHexStr( H0 ) + this.toHexStr( H1 ) + this.toHexStr( H2 ) + this.toHexStr( H3 ) + this.toHexStr( H4 );
	},
	f: function( s, x, y, z )
	{
		switch ( s )
		{
			case 0: return ( x & y ) ^ ( ~x & z );
			case 1: return x ^ y ^ z;
			case 2: return ( x & y ) ^ ( x & z ) ^ ( y & z );
			case 3: return x ^ y ^ z;
		}
	},
	ROTL: function( x, n )
	{
		return ( x << n ) | ( x >>> ( 32 - n ) );
	},
	toHexStr: function( obj )
	{
		var s="", v;
		for ( var i = 7; i >= 0; i-- )
		{
			v = ( obj >>> (i * 4 ) ) & 0xf;
			s += v.toString( 16 );
		}
		return s;
	}
	//
}