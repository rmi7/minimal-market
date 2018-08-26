<template>
  <div class="card" style="border:0 none;">
    <h4 :class="classNamesHeader" v-if="hasSlot('header')">
      <slot name="header"></slot>
    </h4>
    <div class="card-body" v-if="hasSlot('body')">
      <slot name="body"></slot>
    </div>
    <div class="card-footer" v-if="hasSlot('footer')">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script>
import Slot from '../mixins/slot';

export default {
  name: 'app-card',
  mixins: [Slot],
  props: { contextualStyle: { type: String, required: false } },
  computed: {
    classNamesHeader() {
      const classNames = ['card-header'];

      if (this.contextualStyle) {
        classNames.push(`bg-${this.contextualStyle}`);
        classNames.push('text-white');
      } else {
        classNames.push('bg-default');
      }

      return classNames;
    },
  },
};
</script>
