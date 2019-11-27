(async () => {
  const i18n = new VueI18n({
    locale: chrome.i18n.getUILanguage(),
    messages: await pmd.getStrings(),
    fallbackLocale: "en",
    silentTranslationWarn: true
  });

  //* Vue Router
  new Vue({
    i18n,
    router: new VueRouter({
      routes: [
        { path: "*", redirect: "/settings" },
        { path: "/settings", component: Vue.component("settingsView") },
        { path: "/credits", component: Vue.component("creditsView") }
      ]
    })
  }).$mount("#app");
})();
