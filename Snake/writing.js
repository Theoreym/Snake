var bind = Function.prototype.bind,
    $append = bind.call(Element.prototype.appendChild, document.querySelector("output")),
    $new = bind.call(Document.prototype.createElement, document),
    $text = bind.call(Document.prototype.createTextNode, document),
    $rnd = function() { return (Math.random() * 125 + 0)|0; }, 
    $promise = function(thenFn) {
      var args, promise, wait, slice=Array.prototype.slice, isResolved = false;
      var promise = {
        wait: function(ms) {
          wait = ms;
          return promise;
        },
        then: function() {
          args = slice.call(arguments);
          return promise = $promise(thenFn);
        },
        resolve: function() {
          isResolved = true;
          if(args) {
            var next = Function.prototype.bind.apply(thenFn, [undefined].concat(args).concat([promise]));
            wait ? setTimeout(next, wait) : next();
          }

        }
      };
      return promise;
    };

var process = function(target, chars, promise) {
  var first = chars[0], rest = chars.slice(1);
  if(!first) {
    promise.resolve();
    return;
  }
  target.appendChild(first);
  setTimeout(process.bind(undefined, target, rest, promise), $rnd());
}

var type = function(text, promise) {
  var chars = text.split("").map($text);
  promise = promise || $promise(type);
  $append($new("br"));
  process($append($new("q")), chars, promise);
  return promise;
};

type("Testing....")
  .wait(500)
  .then("This is just a test...")
  .then("This is *only* a test...")
  .wait(1500)
  .then("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin vitae tellus aliquet, eleifend mi id, malesuada massa. Nam sit amet nunc ut nulla elementum tempor eu ut ipsum. Suspendisse eget augue sollicitudin, adipiscing dui sed, blandit nulla. Donec tempor vehicula nisi at molestie. Vestibulum interdum sem arcu, vitae sodales libero gravida et. Suspendisse pretium consectetur augue at lacinia. Ut urna lectus, tincidunt ut elit vitae, egestas egestas ipsum. Maecenas gravida tortor eget metus pulvinar sodales. Cras vitae nisi nec felis varius auctor. Donec semper aliquam mollis.");