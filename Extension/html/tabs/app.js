//* Vue Router routes
const routes = [
  { path: "/installed", component: Vue.component("installedView") },
  { path: "/updated", component: Vue.component("updatedView") }
];

//* Vue Router
const app = new Vue({
  router: new VueRouter({
    routes
  })
}).$mount("#app");
