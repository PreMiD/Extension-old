<template>
  <label id="checkbox">
    <input type="checkbox" :checked="isChecked" v-model="isChecked" @change="update" />
    <span
      id="checkmark"
      :style="[
				isChecked
					? { 'background-color': bgColor }
					: { 'background-color': 'rgb(87, 107, 120)' }
			]"
    >
      <span :style="'background-color:' + (isChecked ? this.nobColor : '#fff')" />
    </span>
  </label>
</template>

<script lang="ts">
import Vue from "vue";
import * as tinycolor from "tinycolor2";

export default Vue.extend({
  props: ["checked", "color"],
  data() {
    return {
      isChecked: this.checked
    };
  },
  computed: {
    nobColor() {
      const nC = this.color
        ? tinycolor(this.color).getBrightness() <= 50
          ? tinycolor(this.color).brighten(25)
          : this.color
        : "#fff";

      return nC;
    },
    bgColor() {
      return this.color ? tinycolor(this.color).darken(25) : "#7289da";
    }
  },
  watch: {
    checked() {
      this.isChecked = this.checked;
    }
  },
  methods: {
    update() {
      this.$emit("change", this.isChecked);
    }
  }
});
</script>

<style lang="scss" scoped>
@import "../../../assets/scss/_variables.scss";

#checkbox {
  cursor: pointer;
  position: relative;
  display: block;
  width: 35px;
  height: 15px;

  input {
    position: absolute;
    opacity: 0;
    height: 0;
    width: 0;

    &:checked ~ #checkmark span {
      left: 15px;
    }
  }

  #checkmark {
    transition: 0.15s all ease-out;

    border-radius: 15px;
    position: absolute;
    left: 0;
    height: 100%;
    width: 100%;

    span {
      transition: 0.15s all ease-out;
      content: "";

      position: absolute;
      top: -2px;
      left: -5px;
      width: 20px;
      height: 20px;
      border-radius: 10px;
    }
  }
}
</style>
