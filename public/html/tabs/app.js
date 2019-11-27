//* Vue Router routes
const routes = [
  { path: "/installed", component: Vue.component("installedView") },
  { path: "/updated", component: Vue.component("updatedView") }
];

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
      routes
    })
  })
    .$mount("#app")
    .$nextTick(() => {
      anime({
        targets: "#mainContent #main *",
        opacity: [{ value: 0, duration: 0 }, { value: 1 }],
        translateY: [{ value: -50, duration: 0 }, { value: 0 }],
        duration: 2500,
        delay: anime.stagger(100)
      });

      anime({
        targets: ["#mainContent #buttons a", "#mainContent #buttons p"],
        opacity: [{ value: 0, duration: 0 }, { value: 1 }],
        translateY: [{ value: -50, duration: 0 }, { value: 0 }],
        duration: 2500,
        delay: anime.stagger(100, { start: 500 })
      });

      anime({
        targets: "#header #left *",
        opacity: [{ value: 0, duration: 0 }, { value: 1 }],
        translateX: [{ value: -50, duration: 0 }, { value: 0 }],
        duration: 2500,
        delay: anime.stagger(100, { start: 350 })
      });

      anime({
        targets: "#header #right a",
        opacity: [{ value: 0, duration: 0 }, { value: 1 }],
        translateX: [{ value: 50, duration: 0 }, { value: 0 }],
        duration: 2500,
        delay: anime.stagger(100, { start: 500 })
      });
    });

  window.addEventListener("load", () => {});
})();
