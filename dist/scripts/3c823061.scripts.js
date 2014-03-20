"use strict";

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////        CONVINIENCE CLASSES             ////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

var LOG_LEVEL = "vvv";

var logger = console.log;

console.log = function(){
  //argument types:
  //  vvv:
  //    notify, warn, errors
  //  vv:
  //    warn, errors
  //  v:
  //    errors
  //  production:
  //    log errors to google analytics

  if( arguments.length >= 2 ){
    var type = arguments[0];

    switch( LOG_LEVEL ){
      case "production":
        //do some google analytics error reporting
        break;
      case "v":
        if( type == "errors" ){
          logger.apply( this, arguments );
        }
        break;
      case "vv":
        if( type == "errors" || type == "warn" ){
          logger.apply( this, arguments );
        }
        break;
      case "vvv":
        logger.apply( this, arguments );
        break;
    }
  }
};

Object.size = function(obj) {
  var size = 0, key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)){ size++; }
  }
  return size;
};

Array.prototype.remove = function(from) {
    return this.splice(from, 1);
};

Array.prototype.add = function(from, item) {
    if( !item ){
      throw "Trying to add a null variable to array. -oops";
    }

    return this.splice(from, 0, item);
};

Array.prototype.hasValue = function( val ){

  if( this.indexOf( val )  === -1 ){
    return false;
  }

  return true;

};

Array.prototype.removeValue = function( val ){

  var i = this.indexOf( val );

  if( i  === -1 ){
    return false;
  }

  return this.remove( i );
};

//WARNING, can't be looking for value of -1 in this array!!!
Array.prototype.getByValue = function( val ){
  var i = this.indexOf( val );

  if( i !== -1 ){
    return this[i];
  }

  return false;
};

Array.prototype.getByValueProperty = function( key, val ){
  for( var i=0; i < this.length; i++){
    if( this[i].hasOwnProperty( key ) && this[i][key] == val ){
      return this[i];
    }
  }

  return false;
};

Array.prototype.hasValueProperty = function( key, val ){
  if( this.getByValueProperty( key, val ) === false ){
    return false;
  }

  return true;
};

Array.prototype.valuePropertyIndex = function( key, val ){
 for( var i=0; i < this.length; i++){
    if( this[i].hasOwnProperty( key ) && this[i][key] === val ){
      return i;
    }
  }

  return false;
};

var DISALLOWED_SCREENCAP_URLS = [
  "chrome://newtab/"
];

var ALLOWED_PROTOCOLS = [
  "http:",
  "https:",
  "chrome:"
];

var Parser = function(){
  this.parser = document.createElement('a');
};

Parser.prototype = {
  href : function( href ){
    this.parser.href = href;
    return this;
  },

  protocol : function(){
    return this.parser.protocol;
  },

  hostname : function(){
    return this.parser.hostname;
  },

  port : function(){
    return this.parser.port;
  },

  pathname : function(){
    return this.parser.pathname;
  },

  search : function(){
    return this.parser.search;
  },

  hash : function(){
    return this.parser.hash;
  },

  host : function(){
    return this.parser.host;
  }
};

var stringToInt = function( str ){
  var retInt = 0,
    scale = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    word = str.toUpperCase();

  for( var i=0; i < word.length; i++ ){
    retInt += scale.indexOf( word[i] );
  }

  return retInt;
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////      END CONVINIENCE CLASSES           ////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

"use strict";

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////      SHARED CHROME INTERACTION         ////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

//query for a single tab
var tabQuery = function( queryInfo, callback ){
  return chrome.tabs.query( queryInfo, function( tabs ){
    if (tabs && tabs.length > 0 && tabs[0].id) {
        callback(tabs[0]);
    }else{
      //console.log( "warn", "WARNING: your tab query failed", queryInfo, tabs );
      callback(false);
    }
  });
};

var tabsQuery = function( queryInfo, callback ){
  return chrome.tabs.query( queryInfo, callback );
};

//get a tab by id
var getTab = function( tabId, callback ){
  return chrome.tabs.get( tabId, callback );
};

//bring a tab into focus
var tabFocus = function( tabId, windowId ){
    chrome.windows.update(windowId, {'focused': true}, function() {
      chrome.tabs.update(tabId, {'active': true}, function() {} );
    });
};

//send message
var sendMessage = function( tabId, message, callback ){
  return chrome.runtime.sendMessage( tabId, message, callback );
};

var lsGet = function( id, callback ){
  chrome.storage.local.get( String( id) , callback );
};

var lsSet = function( thing, callback ){
  chrome.storage.local.set( thing, callback );
};

var lsRemove = function( tabId, callback ){
  if( typeof callback === "function" ){
    var id = String( tabId );
    chrome.storage.local.remove( [ id, "screencap-"+id, "screencap-url-"+id ], callback );
  }else{
    //what do we want to do here???
    //console.log( "warn", "lsremove callback not defined", callback );
  }
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////     END SHARED CHROME INTERACTION      ////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

"use strict";

var setMessageListener = function( callback ){
  //chrome.runtime.onMessage.addListener( $scope.onMessage );
  chrome.runtime.onMessage.addListener( callback );
};

var closeTab = function( tabId ){
  chrome.tabs.remove( tabId, function() {
    //what should we do here
  });
};

"use strict";

var mainController = function($scope, $rootScope, $timeout, $filter) {

  //what properties should tab update look for???
  $scope.tabUpdateProperties = [
    "index",
    "windowId",
    "openerTabId",
    "active",
    "url",
    "title",
    "favIconUrl",
    "status"
  ];

  //css margins for calculating horiz scroll:
  $scope.headerMargin = 80;
  $scope.nodeTopBottomMargin = 18;
  $scope.bodyXMargin = 16;
  $scope.nodeMargin = 38;

  $scope.windowHeight = 0;
  $scope.windowWidth= 0;

  $scope.overtabId;

  $scope.tabs = [];
  $scope.tabIndex = {};

  $scope.edges = {};
  $scope.edgesList = [];
  $scope.edgesParentIndex = {};

  $scope.onMessage = function(request, sender, sendResponse) {

    console.log("notify", "NG message", request );

    if( typeof request.id === "undefined" || typeof request.id !== "number" ){
      console.log("error", "badly formatted message", request );
      return;
    }

    switch ( request.message ) {
      case "created":

        console.log("notify", "createed", request );
        $scope.createTab( request.id );
        break;

      case "pre-update":
      case "pre-update":
      case "updated":
      case "favicon":
      case "activated":

        console.log("notify", "updating the tab", request );
        $scope.updateTab( request.id );
        break;

      case "screencap":
        console.log("notify", "we have a screencap, virginia", request );
        $scope.updateScreenCap( request.id );

        break;

      case "removed":
        console.log("notify", "revmoes", request );
        $scope.removeTab( request.id );
        break;

      default:
          console.log("warn", "unkown message");
        break;
    }

    $scope.$apply();
  };

  $scope.tabClose = function( e ){
    closeTab( this.tab.id );
  };

  //get the local storage array of tabs
  $scope.getAllTabs = function(){

    lsGet( "OVERTAB_TAB_ID", function( result ){
      $scope.overtabId = result["OVERTAB_TAB_ID"];

      var parser = new Parser();

      //query for all the tabs

      tabsQuery( {}, function( chromeTabs ){
        for( var i=0; i< chromeTabs.length; i++ ){
          //see if we are gonna allow it
          var chromeTab = chromeTabs[i];

          /* do an lsget  == make a closure cause we're in a for loop*/
          lsGet( chromeTab.id, (function(){

            var tab = chromeTab;

            return function( result ){
              if( result && result.hasOwnProperty( tab.id ) ){

                var tabProtocol = parser.href(tab.url).protocol();
                var hostName = parser.href(tab.url).hostname();

                if ( typeof tab.id !== "undefined" && ALLOWED_PROTOCOLS.indexOf( tabProtocol ) !== -1 && tab.id != $scope.overtabId && tab.status === "complete" ){

                  $scope.addTab( tab );
                }
              }
            };

          })(chromeTab));
          /* end do an lsget */
        }
      });
    });
  };

  $scope.getChromeTab = function( tabId, callback ){
    getTab( tabId, callback );
  };

  $scope.tabEdgeSet = function( tab, callback ){

    if(typeof tab.openerTabId === 'undefined'){
      return false;
    }

    var sibling_count = 0;
    $scope.edges[tab.id] = tab.openerTabId;

    if (typeof $scope.edgesParentIndex[tab.openerTabId] === 'undefined') {

      $scope.edgesParentIndex[tab.openerTabId] = [tab.id];
    }else{

      sibling_count = $scope.edgesParentIndex[tab.openerTabId].length++;

      $scope.edgesParentIndex[tab.openerTabId].push( tab.id );
    }

    //objectify this eventaully, please
    $scope.edgesList.push( [ tab.id, tab.openerTabId, sibling_count ] );

    callback();

  };

  $scope.tabEdgeRemove = function( tabId, callback ){

    //remove edge
    if(typeof typeof $scope.edges[tabId] !== "undefined" ){

      delete $scope.edges[tabId];
    }

    //let's look through all the edges to make sure its not a parent

    //look in parent edges
    if(typeof $scope.edgesParentIndex[tabId] !== 'undefined' ){
      for( var i=0; i<$scope.edgesParentIndex[tabId].length; i++ ){
        var edgeIndex = $scope.edgesParentIndex[tabId][i];
        delete $scope.edges[edgeIndex];

        delete $scope.edgesParentIndex[tabId][i];
      }

      delete $scope.edges[tabId];
    }

    callback();
  };

  $scope.createTab = function( tabId ){
    console.log("notify", "add tba");

    //get a tab object from local storage, etc
    $scope.getChromeTab( tabId, $scope.addTab );
  };

  $scope.addTab = function( tab, doUpdate ){

    if (!tab) {
      return false;
    }

    //make sure it doesnt already exist for some reason??
    if( $scope.tabs.hasValueProperty("id", tab.id ) ){
      console.log("error", "ERROR: trying to add tab for tabId "+tab.id+" that already exists in scope.tabs");
      return false;
    }

    var parser = new Parser();

    var domain = parser.href( tab.url ).hostname();

    tab.searchDomain = domain;
    tab.domainInt = stringToInt( domain );

    if( typeof tab.favIconUrl !== "undefined" && parser.href(tab.favIconUrl).protocol() === "chrome:" ){
      delete tab.favIconUrl;
    }

    //try to add it in depending on parent
    if( tab.hasOwnProperty( "openerTabId" ) && tab.openerTabId ){
      var index = $scope.tabs.valuePropertyIndex( "id", tab.openerTabId );

      //no index, just add to end
      if( index === false ){
        index = -1;
      }else{
        index++;
      }

      $scope.tabs.add( index, tab );
    }else{
      $scope.tabs.push(tab);
    }

    //if we are calling this from add all tabs.....
    if( doUpdate === true ){
      $scope.updateTab( tab.id );
    }else{

      //set the edge
      $scope.tabEdgeSet( tab, $scope.edgesRender );

      //scroll to the newest tab
      setTimeout(function() {
        window.scrollTo( $scope.windowWidth, 0);
      },1000);


      $scope.$apply();
    }
  };

  $scope.removeTab = function( tabId ) {
    if (tabId) {
      var tabPosition = $scope.tabs.valuePropertyIndex("id", tabId);
      if( tabPosition !== false ){
        console.log( "warn", "about to remove tabs:", tabId, tabPosition, $scope.tabs );

        $scope.tabEdgeRemove( tabId, $scope.edgesRender );

        $scope.tabs.remove(tabPosition);

        $scope.setWindowSize();

        $scope.edgesRender();
      }
    }
  };

  $scope.updateLocalTab = function( newTab, oldTab ){
    var parser = new Parser();

    console.log( "warn", "about to update local tab", newTab, oldTab );
    //run through each property of the tab and update it in the list of objects
    for( var i=0; i<$scope.tabUpdateProperties.length; i++ ){
      var property = $scope.tabUpdateProperties[i];


      if( property == "favIconUrl"
        && typeof newTab.favIconUrl
        !== "undefined"
        && parser.href(newTab.favIconUrl).protocol() === "chrome:"
      ){
        continue;
      }

      if( typeof newTab[property] !== "undefined"
        && newTab[property]
        && newTab[property] !== oldTab[property]
      ){
        console.log("notify", "updating "+property+" from "+ oldTab[property] +" to "+ newTab[property] );
        oldTab[property] = newTab[property];
      }
    }

    //we can see if we need to update the edges here.
    //has the domain changed?
    //or something else?
    $scope.edgesRender();

    $scope.$apply();
  };

  $scope.updateScreenCap = function( tabId ){
    lsGet("screencap-"+tabId, function( result ){
      if( result.hasOwnProperty( "screencap-"+tabId ) ){
        var screencap = result["screencap-"+tabId];
        var tab = $scope.tabs.getByValueProperty( "id", tabId );

        if( ( typeof tab.screencap !== "undefined" && tab.screencap != screencap ) || typeof tab.screencap == "undefined" || !tab.screencap ){
          var tabIndex = $scope.tabs.valuePropertyIndex( "id", tabId );

          $scope.tabs[tabIndex].screencap = screencap;

          $scope.$apply();
        }else{
          console.log( "warn", "couldnt set this records screencap: "+tabId );
        }
      }else{
        console.log( "warn", "we dont have this screen cap record: "+tabId );
      }

      //unset it
      result = undefined;
    });
  };

  $scope.updateTab = function( tabId ){

    console.log("notify","about to get "+tabId);
    //get the tab from chrome
    $scope.getChromeTab( tabId, function( chromeTab ){

      console.log("notify","about to gbvp");

      var tab = $scope.tabs.getByValueProperty("id", tabId );

      var parser = new Parser();

      if( !tab ){

        //could it be that this is not an accurate tab we are adding here????
        //what kind of race condition cpould exist here that:
        //we are adding a tab only on update, we got it from a query, then what???

        console.log("warn", "ERROR: in update didnt find tab "+tabId );
        $scope.addTab( chromeTab );
        return;
      }

      if( !chromeTab ){
        console.log("warn", "didnt find chrome tab: "+tabId );
        return false;
      }

      $scope.updateLocalTab( chromeTab, tab );
    });
  };

  $scope.switchToTab = function(tab) {
    tabFocus( tab.id, tab.windowId );
  };

  $scope.setWindowSize = function(){
    var i = document.getElementById('node-container').scrollWidth;
    var j = document.getElementById('node-container').scrollHeight;
    console.log("notify", "width", i, "height", j );

    $scope.windowWidth = i;
    $scope.windowHeight = j;
    //$scope.windowWidth = document.getElementById('node-container').scrollWidth;
    //$scope.windowHeight = document.getElementById('node-container').scrollHeight;
    //$scope.apply();
  };

  $scope.edgesRender = function(){

    window.requestAnimationFrame(function(){
      $scope.setWindowSize();

      for( var i =0; i< $scope.edgesList.length; i++ ){
        var tabId = $scope.edgesList[i][0];
        var parentId = $scope.edgesList[i][1];

        //get the positions
        var edges = $scope.edgeCalc( tabId, parentId, i );

        if( edges ){

          //get the edge
          var elem = angular.element( '#line-'+tabId+'-'+parentId );

          //set the edge
          //offset it the size of one node and the margin of the edge container
          angular.element( elem ).attr( "y1", edges.y1 );
          angular.element( elem ).attr( "x1", edges.x1 );
          angular.element( elem ).attr( "y2", edges.y2 );
          angular.element( elem ).attr( "x2", edges.x2 );

          //set the size of the circle depending on how many connections there are
          var node_size = Math.abs( edges.offset * 0.02 );

          //set a circle at the parent
          //TODO: logic to not render if its already a parent
          var cir = angular.element( '#circle-'+tabId+'-'+parentId );
          angular.element( cir ).attr( "cy", edges.y2 );
          angular.element( cir ).attr( "cx", edges.x2 );
          angular.element( cir ).attr( "r", 5 + node_size );
        }
      }
    });
  };

  $scope.edgeCalc = function( tabId, parentTabId, edgeIndex ){

    var tabPos = angular.element( '#'+tabId ).offset(),
        pTabPos = angular.element( '#'+parentTabId ).offset();

    if( tabPos && pTabPos && tabPos.left && tabPos.top && pTabPos.left && pTabPos.top ){

      //calculate the offsets of all the things

      //try to make the ends point to different locations on the child
      var side_offset = 0;
      var offset = $scope.edgesList[edgeIndex][2];
      //offset = offset * 17 + 3;


      var child_side_offset = 0;
      var parent_side_offset = 0;
      var child_top_offset = 0;
      var parent_top_offset = 0;

      //determine the side offset:
      //if a higher than b, a -> no offset, b offset to bottom
      //if b higher than a, b -> no offset, a offset to bottom

      var box_width = 165;
      var box_height = 180;

      if( pTabPos.top > tabPos.top ){ //parent is higher than child

        child_top_offset = box_height;
      }else if( pTabPos.top < tabPos.top ){ //child is higher than parent

        parent_top_offset = box_height;
      }

      if( pTabPos.left > tabPos.left ){

        child_side_offset = box_width;
      }else if( pTabPos.left < tabPos.left ){

        parent_side_offset = box_width;
      }else if( pTabPos.left == tabPos.left ){

        side_offset = box_width - offset;
      }

      return {
        x1:tabPos.left + side_offset + child_side_offset,
        y1:tabPos.top + offset + child_top_offset,
        x2:pTabPos.left + parent_side_offset,
        y2:pTabPos.top + parent_top_offset,
        offset:offset
      };
    }
  };


  $scope.init = function() {
    console.log("notify", "init" );

    //100 is just a guess, we should fix this later with something more scientific
    $scope.windowHeight = ( window.innerHeight - $scope.headerMargin ) -100; //correct for filter heder
    $scope.windowWidth = ( window.innerWidth - $scope.bodyXMargin );

    //get all the currently open tabs

    $scope.getAllTabs();

    //listen for a message
    //chrome.runtime.onMessage.addListener( $scope.onMessage );
    setMessageListener( $scope.onMessage );

  };
};

"use strict";

var nodeColor = function(){

  var fill = d3.scale.category20();

  return {
      restrict: 'A',
      link: function( scope, elem, attrs ){

        var borderWidth = attrs.nodeColor;

        if(typeof scope.tab.domainInt !== 'undefined'){
          //call the thing
          var color = fill( scope.tab.domainInt );

          elem.css( 'border', borderWidth+'px solid '+color);
        }
      }
  };
};

"use strict";

var domainExtractionFilter = function() {
    return function(uri) {
        var domainSplits = uri.split('//'),
            protocol = domainSplits[0],
            dir;

        switch (protocol) {
            case 'file:':
                dir = domainSplits[1].split('/');
                dir.shift();
                dir.pop();
                return dir.join('/');
            default:
                return domainSplits[1].split('/')[0];
        }
    };
};

"use strict";

var overtabApp = angular.module('overtab', []);

overtabApp.config(function($filterProvider, $compileProvider){

    //lets expose the provider to the module!
    overtabApp.register = {};
    overtabApp.register.filter = $filterProvider.register;

    //make sure angular can get chrome stuff
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|data|mailto|chrome-extension):/);
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|data|mailto|chrome-extension):/);
    // Angular before v1.2 uses $compileProvider.urlSanitizationWhitelist(...)
})
.filter('domainExtraction', domainExtractionFilter)
.controller('mainController', ['$scope', '$rootScope', '$timeout', '$filter', mainController])
.directive('nodeColor', nodeColor);