//fonction pour faire changer le display du bouton
function LienAccepter(){
  
}

//source codepen j holmes https://codepen.io/32bitkid/pen/DrXOVg
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

var img = document.createElement("img");
img.src = "./images/Ouroboros-titre.gif";
var src = document.getElementById("imgTitre");
src.appendChild(img);


type("Bienvenue aventurier !")
  .wait(500)
  .then("Votre mission, si vous l'acceptez...")
  .then("Manger le plus de pommes possible !")
  .wait(500)
  // .then(LienAccepter())