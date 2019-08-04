//* Vue Router
new Vue({
  router: new VueRouter({
    routes: [
      { path: "*", redirect: "/settings" },
      { path: "/settings", component: Vue.component("settingsView") },
      { path: "/credits", component: Vue.component("creditsView") }
    ]
  })
}).$mount("#app");
