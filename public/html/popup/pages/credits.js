//* Settings View
Vue.component("creditsView", {
  data: function() {
    return {
      credits: [],
      errorLoading: false
    };
  },
  created: function() {
    pmd
      .fetchJSON("https://api.premid.app/v2/credits")
      .then(data => {
        this.credits = data.sort((a, b) => b.rolePosition - a.rolePosition);
      })
      .catch(() => {
        this.errorLoading = true;
      });
  },
  template: `
  <div class="creditsContainer">
    <div class="error" v-if="errorLoading">
      <h1 v-text="strings.creditsErrorHeading" v-text="$t('popup.credits.error.message')">
      <h2 v-text="strings.creditsErrorMessage" v-text="$t('popup.credits.error.heading')">
    </div>

    <transition-group v-else name="scaleIn">
      <creditCard v-for="(value, key) in credits" :user="value" :key="value.userId"/>
    </transition-group>
  </div>`
});
