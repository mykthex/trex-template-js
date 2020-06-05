const switcher = document.querySelector(".switcher");

const dayMode = {
  '--body-bg-color': '#d8d8d8',
  '--main-title-color': '#222222',
  '--card-bg-color': '#333333',
  '--card-title-color': '#f8f8f8',
  '--card-tag-color': '#444444',
  '--card-tag-bg-color': '#dddddd',
  '--card-text-color': '#f8f8f8',
}

const reset = {
  '--body-bg-color': '',
  '--main-title-color': '',
  '--card-bg-color': '',
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