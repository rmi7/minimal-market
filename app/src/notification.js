import Vue from 'vue';
import Toasted from 'vue-toasted';

Vue.use(Toasted, {
  theme: 'primary',
  position: 'top-right',
  duration: 6000, // TODO: put in process.env
  iconPack: 'fontawesome',
});

export default {
  showError: (msg) => {
    Vue.toasted.show(msg, { icon: 'warning', type: 'error' });
  },
  showInfo: (msg) => {
    Vue.toasted.show(msg, { icon: 'info', type: 'info' });
  },
  showSuccess: (msg) => {
    Vue.toasted.show(msg, { icon: 'check', type: 'success' });
  },
};
