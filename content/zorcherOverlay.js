var zorcherActionModule = {
	menu: null,
	popup: null,
	main: null,
	words: [],
	func: zorcherMainModule,
	context:null,
	strings:null,
	searchElem:[],
	onLoad: function()
	{
		this.main = document.getElementById( 'contentAreaContextMenu' );
		this.menu = document.getElementById( 'zorcher-menu' );
		this.popup = document.getElementById( 'zorcher-popup' );
		this.context = document.getElementById( 'zorcher-contextmenu' );
		this.strings = document.getElementById( 'zorcher-bundleset' );
		this.func.Init();
		this.func.reloadElements();
		this.main.addEventListener( 'popupshowing' , function(e)
		{
			var mainObj = zorcherActionModule;
			if ( e.target === mainObj.main )
			{
				var ex = mainObj.func.selectedText(), pref = zorcherPreferences.getCharPref( 'extensions.zorcher.key_words' );
				if ( ex && pref != '' )
					mainObj.checkPref( pref );
				mainObj.menu.hidden = ( ex )? false: true;
			}
		},
		false);
		this.main.addEventListener( 'popuphiding' , function(e)
		{
			var mainObj = zorcherActionModule;
			if ( e.target === mainObj.main )
			{
				mainObj.words=[];
				mainObj.menu.hidden = true;
			}
		},
		false);
	},
	checkPref: function( pref )
	{
		var convert = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance( Components.interfaces.nsIScriptableUnicodeConverter ), i;
		convert.charset = 'UTF-8';
		var keyWords = convert.ConvertToUnicode( pref ).split( '\n' );
		for ( var i=0; i < keyWords.length; i++ )
		{
			keyWords[i] = keyWords[i].replace( /^(\s)+$/, '' ).replace( /(\s)+/g, ' ' );
			if ( keyWords[i] != '' && this.func.inArray( keyWords[i], this.words ) == -1 )
				this.words.push( keyWords[i] );
		}
	},
	createElements: function(e)
	{
		if ( e.target === this.popup )
		{
			var i, val = this.stringEraser( this.func.selectedText( 16 ), 15 ), valMain = this.stringEraser( this.func.selectedText( 35 ), 34 ), multiple = zorcherPreferences.getBoolPref( 'extensions.zorcher.all_search' );
			var nonkey = document.createElement( ( multiple === false )? 'menu': 'menuitem' );
			nonkey.setAttribute( 'label', '"' + valMain + '"' );
			nonkey.setAttribute( 'flex', 1 );
			this.popup.appendChild( nonkey );
			if ( multiple === false )
				this.createSearchItems( nonkey, -1 );
			else
				nonkey.setAttribute( 'id', -1 );
			if (content.location.toString().substring(0, 6) != 'about:' && content.location.hostname != '' )
			{
				var site = document.createElement( ( multiple === false )? 'menu': 'menuitem' );
				site.setAttribute( 'label', '"' +val+ ' site:'+ this.stringEraser( content.location.hostname, 15)+'"' );
				site.setAttribute( 'flex', 1 );
				if ( multiple === false )
					this.createSearchItems( site, -2 );
				else
					site.setAttribute( 'id', -2 );
				this.popup.appendChild( site );
			}
			if ( this.words.length > 0 )
			{
				this.popup.appendChild( document.createElement( 'menuseparator' ) );
				var box = document.createElement( 'arrowscrollbox' );
				box.setAttribute('orient', 'vertical');
				box.setAttribute('flex', 1);
				box.setAttribute('id', 'zorcher-scrollbox');
				for ( i = 0; i < this.words.length; i++ )
				{
					var key = this.stringEraser( this.words[i], 15 ), child = document.createElement( ( multiple === false )? 'menu': 'menuitem' );
					child.setAttribute( 'label', '"' + val + ' ' + key + '"' );
					if ( multiple === false )
						this.createSearchItems( child, i );
					else
						child.setAttribute( 'id', i );
					box.appendChild( child );
				}
				this.popup.appendChild( box );
			}
		}
	},
	createSiteElements: function(e)
	{
		if (content.location.toString().substring(0, 6) != 'about:' && e.target == this.context && content.location.hostname != '')
		{
			var multiple = zorcherPreferences.getBoolPref( 'extensions.zorcher.all_search' );
			var nonkey = document.createElement( ( multiple === false )? 'menu': 'menuitem' );
			nonkey.setAttribute( 'label', this.strings.getString('SearchSite')+' "site:'+ this.stringEraser( content.location.hostname, 15)+'"' );
			nonkey.setAttribute( 'id', 'zorcher-searchsite' );
			nonkey.setAttribute( 'flex', 1 );
			this.context.insertBefore( nonkey, document.getElementById('zorcher-multiple-checkbox') );
			if ( multiple === false )
				this.createSearchItems( nonkey, -1, true );
			else
				nonkey.setAttribute( 'id', -1 );
			this.searchElem.push(nonkey);
		}
	},
	createSearchItems: function( obj, id, elem )
	{
		var currEngine = this.func.browser.getCurrentEngine(), engines = this.func.browser.getEngines();
		var child = document.createElement( 'menupopup' );
		if (elem===true)
			this.searchElem.push(child);
		child.setAttribute( 'id', 'zorcher-searchers-list' );
		for ( var i = 0; i < engines.length; i++ )
		{
			var eng = document.createElement( 'menuitem' ), image = document.createElement( 'image' ), desc = document.createElement( 'label' );
			if ( engines[i].name == currEngine )
				eng.setAttribute( 'class', 'zorcher-bold');
			image.setAttribute( 'src', ( engines[i].iconURI && engines[i].iconURI.spec != '' )? engines[i].iconURI.spec: 'chrome://zorcher/skin/unknown.gif' );
			desc.setAttribute( 'value', engines[i].name );
			eng.appendChild( image );
			eng.appendChild( desc );
			eng.setAttribute( 'id', id );
			eng.setAttribute( 'engine', engines[i].name );
			if ( engines[i].name == currEngine && child.childNodes.length > 0 )
				child.insertBefore( eng, child.firstChild );
			else
				child.appendChild( eng );
			if (elem===true)
				this.searchElem.push(eng);
		}
		obj.appendChild( child );
	},
	destroyElements:function(e)
	{
		if ( e.target === this.popup )
			while ( this.popup.childNodes.length > 0 )
				this.popup.removeChild( this.popup.firstChild );
	},
	destroySiteElements: function(e)
	{
		if (content.location.toString().substring(0, 6) != 'about:' && e.target === this.context && content.location.hostname != '' )
		{
			this.context.removeChild( this.context.childNodes[2] );
			this.searchElem = [];
		}
	},
	searchSite:function(val)
	{
		var searchText = 'site:'+content.location.hostname, engine = this.func.browser.getCurrentEngine(), i, eng = val.getAttribute( 'engine' );
		if ( eng != '' && engine != eng )
			engine = eng;
		if ( zorcherPreferences.getBoolPref( 'extensions.zorcher.all_search' ) === false )
			this.func.searchOnePlugin( searchText, engine );
		else
		{
			var request = this.func.searchMultiplyPlugin( searchText );
			if ( request === true )
				this.func.searchOnePlugin( searchText, engine );
		}
	},
	startSearch: function( val )
	{
		var searchText = this.func.selectedText(), engine = this.func.browser.getCurrentEngine(), i, eng = val.getAttribute( 'engine' );
		if ( this.words[val.id] )
			searchText += ' ' + this.words[val.id];
		if ( eng != '' && engine != eng )
			engine = eng;
		if (val.id==-2)
			searchText+=' site:'+content.location.hostname;
		if ( zorcherPreferences.getBoolPref( 'extensions.zorcher.all_search' ) === false )
			this.func.searchOnePlugin( searchText, engine );
		else
		{
			var request = this.func.searchMultiplyPlugin( searchText );
			if ( request === true )
				this.func.searchOnePlugin( searchText, engine );
		}
	},
	stringEraser: function( val, length )
	{
		if ( val.length > length )
			val = val.substring( 0, length ) + '...';
		return val;
	},
	toggleMultipleEngines: function(obj)
	{
		var che = obj.getAttribute('checked') == 'true'?true:false;
		zorcherPreferences.setBoolPref( 'extensions.zorcher.all_search', che );
		this.func.reloadElements();
	},
	searchBar:function()
	{
		var text = document.getElementById('zorcher-searchbar-textbox').value, curr = this.func.browser.getCurrentEngine();
		if ( zorcherPreferences.getBoolPref( 'extensions.zorcher.all_search' ) === false )
			this.func.searchOnePlugin( text, curr );
		else
		{
			var request = this.func.searchMultiplyPlugin( text );
			if ( request === true )
				this.func.searchOnePlugin( text, curr );
		}
	},
	options:function()
	{
		window.openDialog( 'chrome://zorcher/content/zorcherOptions.xul', '_blank', 'chrome,dialog,modal,centerscreen');
	}
}
window.addEventListener( 'load', function() {zorcherActionModule.onLoad();}, false );