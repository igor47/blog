(function() {
  var createEvent = function(id, eventName) {
    document.getElementById(id).onclick = function() {
      analytics.track(eventName);
    }
  }

  // Social icons
  createEvent("sidebar-email", "Clicked Email Icon");
  createEvent("sidebar-twitter", "Clicked Twitter Icon");
  createEvent("sidebar-github", "Clicked Github Icon");
  createEvent("sidebar-skype", "Clicked Skype Icon");
  createEvent("sidebar-rss", "Clicked RSS Icon");

  // Navigation
  createEvent("avatar", "Clicked Face");

  // Twitter Post Link
  createEvent("follow", "Clicked Twitter Follow Link");
});
