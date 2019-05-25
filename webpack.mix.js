let mix = require("laravel-mix");

mix.options({
  processCssUrls: false
});

//* Disable mix-manifest.json
Mix.manifest.refresh = _ => void 0;

mix.sass(
  "./Extension/html/popup/scss/app.scss",
  "./Extension/html/popup/css/app.css"
);

mix.sass(
  "./Extension/html/tabs/scss/app.scss",
  "./Extension/html/tabs/css/app.css"
);

mix.disableNotifications();
