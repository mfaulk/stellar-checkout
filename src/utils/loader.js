function _load(tag) {
  return function(url) {
    // This promise will be used by Promise.all to determine success or failure
    return new Promise(function(resolve, reject) {
      var element = document.createElement(tag);
      var parent = 'body';
      var attr = 'src';

      // Important success and error for the promise
      element.onload = function() {
        resolve(url);
      };
      element.onerror = function(err) {
        reject(new Error('could not load url: ' + url));
      };

      // Need to set different attributes depending on tag type
      switch(tag) {
        case 'script':
          element.async = true;
          break;
        case 'link':
          element.type = 'text/css';
          element.rel = 'stylesheet';
          attr = 'href';
          parent = 'head';
      }

      // Inject into document to kick off loading
      element[attr] = url;
      document[parent].appendChild(element);
    });
  };
}

export default {
  css: _load('link'),
  js: _load('script'),
  img: _load('img')
}