//* Vue Router routes
const routes = [
  { path: "/installed", component: Vue.component("installedView") },
  { path: "/credits", component: Vue.component("creditsView") }
];

//* Vue Router
const app = new Vue({
  router: new VueRouter({
    routes
  })
}).$mount("#app");
