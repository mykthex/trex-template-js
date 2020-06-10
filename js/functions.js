const body = document.body;
const switcher = document.querySelector(".switcher");

const dayMode = {
  '--body-bg': 'linear-gradient(0deg, rgba(239,255,247,1) 0%, rgba(158,236,255,1) 78%)',
  '--main-title-color': '#222222',
  '--card-bg-color': '#54839c',
  '--card-hover-border-color': '#4e90af',
  '--card-title-color': '#f8f8f8',
  '--card-tag-color': '#4a4a4a',
  '--card-tag-bg-color': '#8dbd00',
  '--card-text-color': '#f8f8f8',
}

const reset = {
  '--body-bg': '',
  '--main-title-color': '',
  '--card-bg-color': '',
  '--card-hover-border-color': '',
  '--card-title-color': '',
  '--card-tag-color': '',
  '--card-tag-bg-color': '',
  '--card-text-color': '',
}

body.addEventListener('mousemove', e => {
  let x = e.clientX;
  let y = e.clientY;

  body.style.setProperty('--mouse-x', (x / body.clientWidth));
  body.style.setProperty('--mouse-y', (y / body.clientHeight));
});



switcher.addEventListener('change', e => {
  if(e.target.checked) {
    switchThemeTo('day-mode');
  } else {
    switchThemeTo('reset');
  }
});

function applyTheme(objTheme) {
  const keys = Object.keys(objTheme);
  for (const key of keys) {
    body.style.setProperty(key, objTheme[key]);
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