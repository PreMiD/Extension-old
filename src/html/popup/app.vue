<template>
  <div>
    <navigation />
    <router-view></router-view>
  </div>
</template>

<script>
import navigation from "./components/navigation";

export default {
  components: {
    navigation
  },
  created: async function() {
    this.$store.commit("updatePort", chrome.runtime.connect({ name: "popup" }));

    this.$store.state.port.onMessage.addListener(msg =>
      this.$store.commit("updateConnectionState", msg)
    );
  }
};
</script>

<style lang="scss">
@import "../../assets/scss/_variables.scss";

* {
  font-family: Inter;
  box-sizing: border-box;
  user-select: none;
}

html,
body {
  min-width: 300px;
  margin: 0;
  padding: 0;

  background-color: $notQuiteBlack;
}

h1,
h2,
h3,
h4,
h5,
p {
  margin: 0;
  padding: 0;
}

.link {
  text-decoration: none;
  font-weight: 600;
  color: $blurple;
}
</style>
