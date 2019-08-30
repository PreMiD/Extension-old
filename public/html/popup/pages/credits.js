//* Settings View
Vue.component("creditsView", {
  data: function() {
    return {
      credits: [],
      errorLoading: false,
      strings: {
        creditsErrorHeading: null,
        creditsErrorMessage: null
      }
    };
  },
  created: async function() {
    this.strings.creditsErrorHeading = await pmd.getString(
      "popup.credits.error.heading"
    );
    this.strings.creditsErrorMessage = await pmd.getString(
      "popup.credits.error.message"
    );

    pmd
      .fetchJSON("https://api.premid.app/v2/credits")
      .then(data => {
        this.credits = data.sort((a, b) => b.rolePosition - a.rolePosition);
      })
      .catch(() => {
        this.errorLoading = true;
      });
  },
  template: /* html */ `
  <div class="creditsContainer">
    <div class="error" v-if="errorLoading">
      <h1 v-text="strings.creditsErrorHeading"></h1>
      <h2 v-text="strings.creditsErrorMessage"></h2>
    </div>

    <transition-group v-else name="scaleIn">
      <creditCard v-for="(value, key) in credits" :user="value" :key="value.userId"/>
    </transition-group>
  </div>`
});
