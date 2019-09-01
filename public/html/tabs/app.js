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
