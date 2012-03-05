TumblrInfinitePA = {

  loadXMore: function() {
    var input = document.getElementById("load-input");
    var num = parseInt(input.value);
    input.value = "";
    if (num > 0) {
      TumblrInfinitePA.loadMore(num);
    }
  },

  loadMore: function(num) {
    TumblrInfinitePA.displayFlash("Loading " + num);
    
    chrome.windows.getLastFocused(function(focusWin) {
      chrome.tabs.getSelected(focusWin.id, function(selectedTab) {
        chrome.tabs.sendRequest(selectedTab.id, { type: "loadMore", num: num });
      });
    });
  },

  displayFlash: function(str) {
    var flash = document.getElementById("flash");
    flash.innerHTML = str;
    flash.removeAttribute("hidden");

    var fadeOut = function() {
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
    setTimeout(fadeOut, 100);
  },
};
