import Vue from 'vue';
import Vuex from 'vuex';
import createLogger from 'vuex/dist/logger';

import conn from './modules/conn';
import ui from './modules/ui';
import bank from './modules/bank';
import users from './modules/users';
import stores from './modules/stores';
import products from './modules/products';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  modules: { conn, ui, bank, users, stores, products },
  strict: debug,
  plugins: debug ? [createLogger()] : [],
});
