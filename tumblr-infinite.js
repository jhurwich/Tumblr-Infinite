if (typeof(TumblrInfinite) == "undefined") {
  
  var TumblrInfinite = { 

    loadedCount: 0,
    numToLoad: 0,
    loadMore: function(num) {
      var url = document.location.href;
      url = url.replace("http://", "");
      url = url.replace("www.", "");

      var firstSlash = url.indexOf('/');
      var host;
      if (firstSlash == -1) {
        host = url;
      }
      else {
        host = url.substring(0, url.indexOf('/'));
      }
      
      var expectedPattern = host + "/page/([0-9]+)";
      var expectedRegex = new RegExp(expectedPattern, "i");
      
      // first figure out what page we are currenly on, or have loaded
      var currPage;
      if ($(".infinite-vessel").length > 0) {
        
        // if we've already loaded some on this page
        var lastVessel = $(".infinite-vessel").last();
        var match = lastVessel.attr("destination").match(expectedRegex);
        currPage = parseInt(match[1]);
      }
      else {
        
        // this is the first time we're loading extras on this page
        var match = document.location.href.match(expectedRegex);
        if (match != null) {
          // the current page is of the form __.tumblr.com/page/X
          currPage = parseInt(match[1]);
        }
        else {
          // the current page is NOT of a good form, fake it... 
          currPage = 1;
        }
      }

      TumblrInfinite.numToLoad = num;
      TumblrInfinite.loadedCount = 0;
      TumblrInfinite.displayFlash("Loaded " + TumblrInfinite.loadedCount + "/" + TumblrInfinite.numToLoad);
      
      for (var i = 1; i <= num; i++) {
        var nextURL = "http://www." + host + "/page/" + (currPage + i);
        TumblrInfinite.addPage(nextURL);
      }

      // if document.location.href contains 'page' check that it matches
      // an expected pattern

      // if not, look for a next page button and check it's pattern

      // if not found, do something fancier?
    },

    addPage: function(url) {
      var targetSelector = "body";
      var target = $(targetSelector);

      var vessel = $("<div class='infinite-vessel' destination='" + url + "'></div>");
      vessel.append($("<a class='infinite-header' href='" + url + "'>" + url + "</a>"));
      target.append(vessel);
 
      /* First hit the domain itself, usually the first page */ 
      $.ajax({ 
        type: "GET", 
        url: url, 
        dataType: "html", 
 
        success: TumblrInfinite.addPageResponse.curry(url), 
 
        error: function (response) { 
          console.error("Ajax error retrieving " + url); 
        }, 
      });  
    },

    addPageResponse: function(url, data, status, xhr) {
      var responseText = xhr.responseText;
      var cleanedText = TumblrInfinite.removeUnwantedTags(responseText);

      var target = $("[destination='" + url + "']").first();
      $(target).append(cleanedText);
      
      TumblrInfinite.loadedCount = TumblrInfinite.loadedCount + 1;
      TumblrInfinite.displayFlash("Loaded " + TumblrInfinite.loadedCount + "/" + TumblrInfinite.numToLoad);
      if (TumblrInfinite.loadedCount >= TumblrInfinite.numToLoad) {
        TumblrInfinite.fadeFlash();
      }
    },

    removeUnwantedTags: function(text) {
      var openTagRegex = function(tag) {
        return new RegExp("<\s*" + tag + "[^<>]*>");
      }
  
      var closeTagRegex = function(tag) {
        return new RegExp("<\/" + tag + "[^<>]*>", "i");
      }
  
      var selfClosedTagRegex = function(tag) {
        return new RegExp("<\s*" + tag + "[^<>]*\/>", "i");
      }
      
      var unwantedBlocks = ["head", "meta", "script", "noscript"]; // remove these tags and everything that may be in them
      for (var i = 0; i < unwantedBlocks.length; i++) {
        var tag = unwantedBlocks[i];
  
        var openPos = -1;
        var closeMatch = null;
        while ((openPos = text.search(openTagRegex(tag))) != -1) {
          if ((closeMatch = text.match(closeTagRegex(tag))) != null) {
            var closeLen = closeMatch[0].length;
            var toRemove = text.substring(openPos, closeMatch.index + closeLen);
            text = text.replace(toRemove, "");
          }
          else {
            console.error("no close tag for open tag '" + tag + "'");
          }
          
        }
      }
  
      var unwantedTags = ["html", "body", "!DOCTYPE"]; // only remove these tags themselves, not their contents
      for (var i = 0; i < unwantedTags.length; i++) {
        var tag = unwantedTags[i];
  
        var match = null;
        while ((match = text.match(openTagRegex(tag))) != null) {
            text = text.replace(match[0], "");
        }
        while ((match = text.match(closeTagRegex(tag))) != null) {
            text = text.replace(match[0], "");
        }
        while ((match = text.match(selfClosedTagRegex(tag))) != null) {
            text = text.replace(match[0], "");
        }
      }
  
      return text;
    },

    init: function() {
      // copied wholesale from prototype.js, props to them
      Function.prototype.curry = function() {
        var slice = Array.prototype.slice;
      
        function update(array, args) {
          var arrayLength = array.length, length = args.length;
          while (length--) array[arrayLength + length] = args[length];
          return array;
        }
      
        function merge(array, args) {
          array = slice.call(array, 0);
          return update(array, args);
        }
      
        if (!arguments.length) return this;
        var __method = this, args = slice.call(arguments, 0);
        return function() {
          var a = merge(args, arguments);
          return __method.apply(this, a);
        }
      };
      
      chrome.extension.onRequest.addListener(TumblrInfinite.requestHandler);
    },

    requestHandler: function(request, sender, sendResponse) {
      if (request.type == "loadMore") {
        TumblrInfinite.loadMore(request.num);
      }
    },

    displayFlash: function(str) {
      var flash = $("#infinite-flash");
      if (flash.length == 0) {
        flash = $("<div id='infinite-flash' hidden=true></div>");
        $("body").first().append(flash);
      }
      flash.html(str);
      flash.removeAttr("hidden");
    },

    fadeFlash: function() {
      var fadeOut = function() {
        var flash = document.getElementById("infinite-flash");
        var opacity = parseFloat(flash.style.opacity);
        if (typeof(opacity) == "undefined" || opacity == null || isNaN(opacity)) {
          flash.style.opacity = .9;
          setTimeout(fadeOut, 100);
        }
        else if (opacity > 0) {
          flash.style.opacity = Math.round((opacity - .1) * 10) / 10;
          setTimeout(fadeOut, 100);
        }
        else {
          flash.setAttribute("hidden", true);
          flash.style.opacity = null;
        }
      };
      fadeOut();
    },

    
  };

  TumblrInfinite.init();

}
