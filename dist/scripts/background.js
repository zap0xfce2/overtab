"use strict";function rangeConstrict(a){var b=1,c=61,d=1,e=1638,f=(a-b)/(c-b),g=f*(e-d)+d;return g+=.618033988749895,Math.abs(Math.round(g%=c))}Object.size=function(a){var b,c=0;for(b in a)a.hasOwnProperty(b)&&c++;return c},Array.prototype.remove=function(a){return this.splice(a,1)},Array.prototype.add=function(a,b){if(!b)throw"Trying to add a null variable to array. -oops";return this.splice(a,0,b)},Array.prototype.hasValue=function(a){return-1===this.indexOf(a)?!1:!0},Array.prototype.removeValue=function(a){var b=this.indexOf(a);return-1===b?!1:this.remove(b)},Array.prototype.getByValue=function(a){var b=this.indexOf(a);return-1!==b?this[b]:!1},Array.prototype.getByValueProperty=function(a,b){for(var c=0;c<this.length;c++)if(this[c]&&this[c].hasOwnProperty(a)&&this[c][a]==b)return this[c];return!1},Array.prototype.hasValueProperty=function(a,b){return this.getByValueProperty(a,b)===!1?!1:!0},Array.prototype.valuePropertyIndex=function(a,b){for(var c=0;c<this.length;c++)if(this[c]&&this[c].hasOwnProperty(a)&&this[c][a]===b)return c;return!1},Array.prototype.intAverage=function(){for(var a=0,b=0,c=0;c<this.length;c++)"number"==typeof this[c]&&(b++,a+=this[c]);return Math.round(a/b)};var DISALLOWED_SCREENCAP_URLS=["chrome://newtab/"],ALLOWED_PROTOCOLS=["http:","https:","chrome:"],Parser=function(){this.parser=document.createElement("a")};Parser.prototype={href:function(a){return this.parser.href=a,this},protocol:function(){return this.parser.protocol},hostname:function(){return this.parser.hostname},port:function(){return this.parser.port},pathname:function(){return this.parser.pathname},search:function(){return this.parser.search},hash:function(){return this.parser.hash},host:function(){return this.parser.host}};var stringToInt=function(a){for(var b=0,c="ABCDEFGHIJKLMNOPQRSTUVWXYZ",d=a.toUpperCase(),e=0;e<d.length;e++)b+=c.indexOf(d[e]);return b},options=[{name:"opener",type:"radio"}],isExtensionUrl=function(a){return a==extensionUrl("index.html")||a==extensionUrl("options.html")?!0:!1},extensionUrl=function(a){return chrome.extension.getURL(a)},tabQuery=function(a,b){chrome.tabs.query(a,function(a){var c=[],d=0;do a[d]&&a[d].id&&c.push(a[d]),d++;while(d<a.length&&!isVerifiedTabUrl(a[d]));b(c.length>0?c[0]:!1)})},tabsQuery=function(a,b){return chrome.tabs.query(a,b)},getTab=function(a,b){return chrome.tabs.get(a,b)},tabFocus=function(a,b,c){chrome.windows.update(b,{focused:!0},function(){chrome.tabs.update(a,{active:!0},function(){c&&tabEvent(c,"overtab")})})},tabEvent=function(a,b){sendMessage(null,{message:b,id:a})},sendMessage=function(a,b,c){return chrome.runtime.sendMessage(a,b,c)},lsGet=function(a,b){chrome.storage.local.get(String(a),b)},lsSet=function(a,b){chrome.storage.local.set(a,b),a=void 0},lsRemove=function(a,b){if("function"==typeof b){var c=String(a);chrome.storage.local.remove([c,"screencap-"+c,"screencap-url-"+c],b)}},chromeBadge=function(a){chrome.browserAction.setBadgeText({text:String(a)})},closeTab=function(a){chrome.tabs.remove(a,function(){})},getOvertabId=function(a){var b={url:extensionUrl("index.html")};tabQuery(b,function(b){a(b?b:!1)})},getMemory=function(){chrome.system.memory.getInfo(function(a){{var b=a.availableCapacity;a.capacity}21e6>b&&alert("about to run out of memory"),OVERTAB_TAB_ID&&chrome.processes.getProcessIdForTab(OVERTAB_TAB_ID,function(a){chrome.processes.getProcessInfo(a,!0,function(a){var b=[];for(var c in a)a.hasOwnProperty(c)&&b.push(a[c]);b[0]})})})},calcDimensions=function(a,b){var c,d,e=THUMBSIZE/SCREEN_CROP_RATIO;return a>b?(c=e,d=e*(a/b)):(d=e,c=e*(b/a)),{height:Math.round(c),width:Math.round(d)}},processImage=function(a,b,c,d,e,f){var g=calcDimensions(d,e),h=document.createElement("canvas"),i=h.getContext("2d");if(c){var j=document.createElement("img");j.onload=function(){h.width=g.width,h.height=g.height,i.clearRect(0,0,g.width,g.height),i.drawImage(this,0,0,g.width,g.height);var c="screencap-"+a,d={};d[c]=h.toDataURL("jpeg",0),d["screencap-url-"+a]=b,lsSet(d,function(){tabEvent(a,"screencap"),f()}),d=void 0,i=void 0,h=void 0},j.src=c,j=null}c=void 0},THUMBSIZE=150,SCREEN_CROP_RATIO=1,isVerifiedTabUrl=function(a){if(a.hasOwnProperty("url")){{var b=new Parser,c=b.href(a.url).protocol();b.href(a.url).hostname()}if(a.hasOwnProperty("id")&&-1!==ALLOWED_PROTOCOLS.indexOf(c)&&!isExtensionUrl(a.url))return!0}return!1},setTabCount=function(){tabsQuery({},function(a){for(var b=0,c=0;c<a.length;c++)isVerifiedTabUrl(a[c])&&b++;chromeBadge(b)})},tabCreated=function(a){if(isVerifiedTabUrl(a)){var b={};b[a.id]=a.url,b["screencap-"+a.id]="",b["screencap-url-"+a.id]="",lsSet(b,function(){tabEvent(a.id,"created"),setTabCount()})}},tabUpdated=function(a,b,c){if(isVerifiedTabUrl(c)){var d=c.id;lsGet(d,function(a){if(a&&a.hasOwnProperty(d))"complete"==b.status&&(tabEvent(d,"updated"),screenCap(c));else{var e={};e[c.id]=c.url,e["screencap-"+c.id]="",e["screencap-url-"+c.id]="",lsSet(e,function(){tabEvent(d,"pre-update")})}})}},screenCap=function(a){var b="screencap-url-"+a.id;lsGet(b,function(c){if(!c||!c.hasOwnProperty(b))return!1;var d=c[b];if(a.url==d)return!1;var e={currentWindow:!0,windowId:a.windowId,active:!0,status:"complete"};tabQuery(e,function(b){b.id==a.id&&b.windowId==a.windowId&&d!=b.url&&-1===DISALLOWED_SCREENCAP_URLS.indexOf(b.url)&&memoryCheck(function(){generateScreenCap(b.windowId,{format:"jpeg",quality:1},function(c){if(c){{c.length}processImage(a.id,b.url,c,b.width,b.height,function(){}),c=void 0}})})})})},tabActivated=function(a){var b=a.tabId;lsGet(b,function(a){a&&null!==a&&a.hasOwnProperty(b)&&(tabEvent(b,"activated"),getTab(b,function(a){a&&"undefined"!=typeof a.id&&screenCap(a)}))})},tabRemoved=function(a){getOvertabId(function(b){b.id!=a&&lsRemove(a,function(){tabEvent(a,"removed"),setTabCount()})})},onMessage=function(){},openOverTab=function(a){lsGet("opener",function(b){var c,d=b.opener,e={url:getExtensionUrl()};switch(d){case"window":e.focused=!0,c=chrome.windows.create;break;default:e.active=!0,c=chrome.tabs.create}c(e,function(b){if(b.hasOwnProperty("tabs")&&b.tabs.length>0){var c=b.tabs.getByValueProperty("active",!0);if(!c)return;b=c}tabEvent(a,"opening-overtab")})})},browserActionClick=function(){tabQuery({active:!0},function(a){var b=0;if(a)var b=a.id;getOvertabId(function(a){a?tabFocus(a.id,a.windowId,b):openOverTab(b)})})},getAllTabs=function(){getOvertabId(function(a){var b=null;a&&(b=a.id),tabsQuery({},function(a){for(var c=0;c<a.length;c++){var d=a[c];isVerifiedTabUrl(d)&&d.id!=b&&"complete"===d.status&&tabCreated(d)}})})},tabReplaced=function(a,b){lsGet(b,function(c){c&&c.hasOwnProperty(b)?lsRemove(b,function(){tabReplaceSet(a,b)}):tabReplaceSet(a,b)})},tabReplaceSet=function(a,b){getTab(a,function(c){if(c&&"undefined"!=typeof c.id){var d={};d[a]=c.url,d["screencap-"+a]="",d["screencap-url-"+a]="",lsSet(d,function(){sendMessage(null,{message:"replaced",id:a,oldId:b})})}})},reset=function(){chrome.storage.local.clear();var a=extensionUrl("index.html"),b=new Parser,c=b.href(a).protocol()+"//"+b.href(a).hostname()+"/*",d={url:c};tabsQuery(d,function(a){for(var b=0;b<a.length;b++)closeTab(a[b].id)})},startup=function(){reset(),getAllTabs()},shutdown=function(){reset()},install=function(){reset(),getAllTabs()},memoryCheck=function(a){chrome.system.memory.getInfo(function(b){var c=b.availableCapacity,d=b.capacity;return d/2.5>c?void console.log("not doing screencap. avail:"+c+" for: "+d/2.5):void a()})};chrome.runtime.onStartup.addListener(startup),chrome.runtime.onInstalled.addListener(install);var getExtensionUrl=function(){return chrome.extension.getURL("index.html")};chrome.runtime.onMessage.addListener(onMessage);var generateScreenCap=function(a,b,c){chrome.tabs.captureVisibleTab(a,b,c)};chrome.tabs.onCreated.addListener(tabCreated),chrome.tabs.onUpdated.addListener(tabUpdated),chrome.tabs.onActivated.addListener(tabActivated),chrome.tabs.onRemoved.addListener(tabRemoved),chrome.browserAction.onClicked.addListener(browserActionClick),chrome.tabs.onReplaced.addListener(tabReplaced),chrome.runtime.onSuspend.addListener(function(){}),chrome.runtime.onSuspendCanceled.addListener(function(){});var getCurrentTab=function(a){chrome.tabs.getCurrent(a)};chrome.commands.onCommand.addListener(function(a){switch(a){case"open-overtab":browserActionClick()}});