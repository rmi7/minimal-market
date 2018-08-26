import Vue from 'vue';
import { sync } from 'vuex-router-sync';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { faClock } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import VModal from 'vue-js-modal';

// CSS
import 'bootstrap/dist/css/bootstrap.css';
import 'animate.css';

import './notification';
import store from './store';
import router from './router';
import App from './components/app.vue';

library.add(faClock);
library.add(faTimes);

Vue.component('font-awesome-icon', FontAwesomeIcon);

Vue.use(VModal, { dynamic: true, injectModalsContainer: true });

// hookup router <--> store
sync(store, router, { moduleName: 'router' });

Vue.config.productionTip = false;

new Vue({ // eslint-disable-line no-new
  el: '#app',
  store,
  router,
  template: '<App/>',
  components: { App },
  beforeMount() {
    this.$store.dispatch('conn/initIpfs');
    this.$store.dispatch('conn/initWeb3');
  },
});
