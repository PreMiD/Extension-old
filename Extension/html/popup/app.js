//* Vue Router routes
const routes = [
  { path: "*", redirect: "/settings" },
  { path: "/settings", component: Vue.component("settingsView") }
  //{ path: "/credits", component: Vue.component("creditsView") }
];

//* Vue Router
const app = new Vue({
  router: new VueRouter({
    routes
  })
}).$mount("#app");
