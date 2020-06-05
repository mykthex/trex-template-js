const switcher = document.querySelector(".switcher");
console.log(switcher);

const dayMode = {
  '--main-title-color': '#ff0000',
  '--main-bg-color': '#333300',
  '--card-title-color': '#ff4400',
  '--card-tag-color': '#003333',
  '--card-tag-bg-color': '#88ffff',
  '--card-text-color': '#008800',
}

const reset = {
  '--main-title-color': '',
  '--main-bg-color': '',
  '--card-title-color': '',
  '--card-tag-color': '',
  '--card-tag-bg-color': '',
  '--card-text-color': '',
}

switcher.addEventListener('change', handleTheme);

function handleTheme(e) {
  if(e.target.checked) {
    switchThemeTo('day-mode');
  } else {
    switchThemeTo('reset');
  }
}

function applyTheme(objTheme) {
  const keys = Object.keys(objTheme);
  for (const key of keys) {
    document.body.style.setProperty(key, objTheme[key]);
    console.log(key, objTheme[key]);
  }
}

function switchThemeTo(theme) {
  switch (theme) {
    case 'day-mode' :
      applyTheme(dayMode);
      break;
    default:
      applyTheme(reset);
      break;
  }
}