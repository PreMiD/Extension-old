<template>
  <div id="select" :class="active ? 'active' : null" @click="active = !active">
      <template v-if="$props.options && typeof $props.options[0] === 'object'">
        <div id="wrapper">
          <p id="show" v-text="$props.options.find(l => l.value === (($props.selected && $props.selected !== true) ? $props.selected : DEFAULT_LOCALE)).name" />
          <span v-for="o in $props.options" :key="o.value" v-text="o.name" @click="$emit('change', o.value)" />
        </div>
      </template>
      <template v-else>
        <div id="wrapper">
          <p id="show" v-text="$props.options[$props.selected]" />
          <span v-for="(s, i) in $props.options" :key="i" v-text="s" @click="$emit('change',i)" />
        </div>
      </template>
  </div>
</template>

<script>
import { DEFAULT_LOCALE } from '../../../util/langManager';
export default {
  props: ["options", "selected"],
  data() {
    return {
      active: false,
      DEFAULT_LOCALE: DEFAULT_LOCALE
    };
  }
};
</script>

<style lang="scss" scoped>
@import "../../../assets/scss/_variables.scss";

#select {
  color: $greyple;
  position: relative;
  height: 25px;
  min-width: 75px;
  cursor: pointer;

  &::after {
    right: 5px;
    position: absolute;
    content: "";
    border: 4px solid transparent;
    border-color: #fff transparent transparent transparent;
    top: 11px;
  }

  &.active::after {
    border-color: transparent transparent #fff transparent;
    top: 6px;
  }

  #show {
    color: white;
    margin-right: 13px;
    margin-bottom: 2px;
  }

  #wrapper {
    display: grid;

    font-size: 12px;
    background-color: $notQuiteBlack;
    outline: none;
    border-radius: 5px;
    border: none;
    min-height: 25px;
    min-width: 75px;
    padding: 5px;
  }

  span {
    transition: 0.15s all ease-out;

    &:hover {
      color: white !important;
    }
  }

  &.active {
    span {
      display: block;
    }
  }

  span {
    display: none;
  }
}
</style>
