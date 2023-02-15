function toggleDropdown() {
  const menu = document.getElementById("menu");

  if (menu.classList.contains("menu-on")) {
    menu.classList.remove("menu-on");
    menu.classList.add("menu-off");
  } else {
    menu.classList.add("menu-on");
    menu.classList.remove("menu-off");
  }
}
