System.register([], function (_export) {
  // Although ^=parent is not technically correct,
  // we need to use it in order to get IE8 support.
  'use strict';

  var elements, len, i;
  return {
    setters: [],
    execute: function () {
      elements = document.querySelectorAll('[data-submit^=parent]');
      len = elements.length;

      for (i = 0; i < len; ++i) {
        elements[i].addEventListener('click', function (event) {
          var message = this.getAttribute("data-confirm");
          if (message === null || confirm(message)) {
            this.parentNode.submit();
          };
          event.preventDefault();
          return false;
        }, false);
      }
    }
  };
});