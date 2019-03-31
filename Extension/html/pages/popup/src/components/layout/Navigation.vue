<template>
  <div class="main">
    <center style="display: grid;">
      <center class="back">
        <img class="logo" src="./../../assets/images/logo.svg">
      </center>
      <div class="categories">
        <router-link
          :to="'/' + category.route"
          v-for="category of categories"
          v-bind:key="category"
          class="category"
        >
          <span class="category_title" :style="'width: ' + category.title.length + 'ch;'">{{ category.title }}</span>
        </router-link>
      </div>
    </center>
  </div>
</template>

<script>
export default {
  name: "navigation",
  data() {
    return {
      categories: [
        {
          route: "Settings",
          title: "SETTINGS"
        },
        {
          route: "Credits",
          title: "CREDITS"
        }
      ]
    };
  }
};
</script>

<style lang="less" scoped>
@import "./../../stylesheets/colors.less";

.main {
  background: @background-secondary;
  * {
    user-select: none;
  }
}
.back {
  background: @accent-primary;
}

.logo {
  margin-top: .2rem;
  height: 3rem;
  width: 3rem;
}

.category {
  color: lightgray;
  .category_title {
    font-family: Inter;
    margin-right: 1.2rem;
  }
  span::after {
    content: '';
    display: block;
    width: 0;
    height: .125rem;
    background: white;
    transition: all 0.1s ease;
    margin-top: .15rem;
    transform: translate(0%, 0); /*Add this*/
  }
  &:hover {
    color: white;
    transition: all 0.1s ease;
    span::after {
      width: 80%;
    }
  }
  &.router-link-active {
    color: white;
    transition: all 0.1s ease;
    span::after {
      width: 80%;
    }
  }
}

.categories {
  height: 1.8rem;
  display: grid;
  margin-top: 0.2rem;
  margin-bottom: 2px;
  grid-template-columns: min-content min-content;
  width: 100%;
  align-items: center;
  justify-content: center;
}
</style>
