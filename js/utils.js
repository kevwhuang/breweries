const HIDING_CLASSNAME = "hidden";

function show(el) {
  el.classList.remove(HIDING_CLASSNAME);
}

function hide(el) {
  el.classList.add(HIDING_CLASSNAME);
}
