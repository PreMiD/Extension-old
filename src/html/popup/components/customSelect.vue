<template>
  <div id="select" :class="active ? 'active' : null" @click="toggleActive">
    <div id="wrapper" :style="{ maxHeight: selectHeight + 'px'}" ref="wrapper">
      <template v-if="$props.options && typeof $props.options[0] === 'object'">
          <p id="show" v-text="$props.options.find(l => l.value === (($props.selected && $props.selected !== true) ? $props.selected : DEFAULT_LOCALE)).name" />
          <span v-for="o in $props.options.filter(o => o.value !== $props.selected)" :key="o.value" v-text="o.name" @click="$emit('change', o.value)" />
      </template>
      <template v-else>
        <p id="show" v-text="$props.options[$props.selected]" />
        <template v-for="(s, i) in $props.options">
          <span v-if="s != $props.options[$props.selected]" :key="i" v-text="s" @click="$emit('change',i)" />
        </template>
      </template>
    </div>
  </div>
</template>

<script>
import { DEFAULT_LOCALE } from '../../../util/langManager';
export default {
  props: ["options", "selected"],
  events: ["active", "inactive"],
  data() {
    return {
      active: false,
      DEFAULT_LOCALE: DEFAULT_LOCALE,
      selectHeight: null
    };
  },
  methods: {
    toggleActive() {
      this.active = !this.active;

      let eventType;
      if (this.active) {
        eventType = "active";
      } else {
        eventType = "inactive";
      }

      // let first redraw the element to the browser
      setTimeout(() => {
        this.$emit(eventType, eventType, this.$refs.wrapper);
      }, 0);
    }
  },
  mounted: function() {
    let wrapper = this.$refs.wrapper,
      clientRect = wrapper.getBoundingClientRect();
      this.selectHeight = Math.max(85, window.innerHeight - (clientRect.y + 10));
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

    overflow-y: auto;
  }

  span {
    transition: 0.15s all ease-out;

    &:hover {
      color: white !important;
    }
  }

  &.active {
    position: relative;
		z-index: 1;
    span {
      display: block;
    }
  }

  span {
    display: none;
  }
}
</style>
