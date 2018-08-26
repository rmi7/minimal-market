import Vue from 'vue';
import VueRouter from 'vue-router';

import Owners from './pages/owners.vue';
import Owner from './pages/owner.vue';
import Stores from './pages/stores.vue';
import Store from './pages/store.vue';
import Products from './pages/products.vue';
import Product from './pages/product.vue';

import store from './store';

Vue.use(VueRouter);

// - a withdraw button is shown if current address has funds that can be withdrawn

const checkAllContractsLoaded = (to, from, next) => {
  // TODO: we should get only the stores/users/bank/products store

  // TODO FIX: somehow adding 'users' to the below array breaks the app
  const notYetLoaded = ['bank', 'stores', 'products']
    .filter(contractName => !store.getters[`${contractName}/contractIsLoaded`]);

  if (!notYetLoaded.length) {
    next();
    return;
  }

  // getting here means we found stores whose contract is not yet loaded,
  // we need to watch fro when they are all loaded before contunuing to the route

  store.watch(
    state => (
      // if we find any where contractIsLoaded is false, .some will return true
      !notYetLoaded.some(contractName => !state[contractName].contractIsLoaded)
    ),
    (val) => {
      if (val) { // = allLoaded
        next();
      }
    },
  );
};

const router = new VueRouter({
  routes: [
    // TODO: redirect based on userRole
    // redirect to main app page: Stores
    {
      path: '/',
      redirect: { name: 'Stores' },
    },

    //
    // Owner(s)
    //
    {
      path: '/owner',
      name: 'Owners',
      meta: { title: 'Owners' },
      component: Owners,
      beforeEnter: checkAllContractsLoaded,
    },
    {
      path: '/owner/:ownerAddr',
      name: 'Owner',
      meta: { title: 'Owner' },
      component: Owner,
      beforeEnter: checkAllContractsLoaded,
    },

    //
    // Store(s)
    //
    {
      path: '/store',
      name: 'Stores',
      meta: { title: 'Stores' },
      component: Stores,
      beforeEnter: checkAllContractsLoaded,
    },
    {
      path: '/store/:storeId',
      name: 'Store',
      meta: { title: 'Store' },
      component: Store,
      beforeEnter: checkAllContractsLoaded,
    },

    //
    // Product(s)
    //
    {
      path: '/product',
      name: 'Products',
      meta: { title: 'Products' },
      component: Products,
      beforeEnter: checkAllContractsLoaded,
    },
    {
      path: '/product/:productId',
      name: 'Product',
      meta: { title: 'Product' },
      component: Product,
      beforeEnter: checkAllContractsLoaded,
    },

    // "fallback function" ;p
    {
      path: '*',
      redirect: '/',
    },
  ],
});

router.beforeEach((to, from, next) => {
  window.document.title = to.meta.title; // eslint-disable-line no-undef
  next();
});

export default router;
