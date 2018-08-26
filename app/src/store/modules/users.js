/* eslint-disable no-await-in-loop, max-len, function-paren-newline */
/* eslint-disable */
import contract from 'truffle-contract';
import _ from 'lodash';
import Notification from '../../notification';
import UsersArtifact from '../../../../build/contracts/Users.json';

export const types = {
  //
  // Setup
  //

  SET_CONTRACT_INSTANCE: 'SET_CONTRACT_INSTANCE',
  CLEAR_CONTRACT_INSTANCE: 'CLEAR_CONTRACT_INSTANCE',

  //
  // Events
  //

  ADD_NEW_OWNER: 'ADD_NEW_OWNER',
  SAVE_NEW_OWNERS_WATCHER: 'SAVE_NEW_OWNERS_WATCHER',
  REMOVE_NEW_OWNERS_WATCHER: 'REMOVE_NEW_OWNERS_WATCHER',

  //
  // Getters
  //

  FIND_USER_ROLE_START: 'FIND_USER_ROLE_START',
  FIND_USER_ROLE_SUCCESS: 'FIND_USER_ROLE_SUCCESS',
  FIND_USER_ROLE_ERROR: 'FIND_USER_ROLE_ERROR',

  FIND_OWNER_START: 'FIND_OWNER_START',
  FIND_OWNER_SUCCESS: 'FIND_OWNER_SUCCESS',
  FIND_OWNER_ERROR: 'FIND_OWNER_ERROR',

  FIND_OWNERS_START: 'FIND_OWNERS_START',
  FIND_OWNERS_SUCCESS: 'FIND_OWNERS_SUCCESS',
  FIND_OWNERS_ERROR: 'FIND_OWNERS_ERROR',

  //
  // Setters
  //

  CREATE_OWNER_START: 'CREATE_OWNER_START',
  CREATE_OWNER_SUCCESS: 'CREATE_OWNER_SUCCESS',
  CREATE_OWNER_ERROR: 'CREATE_OWNER_ERROR',

  REMOVE_OWNER_START: 'REMOVE_OWNER_START',
  REMOVE_OWNER_SUCCESS: 'REMOVE_OWNER_SUCCESS',
  REMOVE_OWNER_ERROR: 'REMOVE_OWNER_ERROR',
};

const gatherOwnerInfo = async (storesInstance, productsInstance, ownerAddr) => {
  const ownerInfo = {};
  ownerInfo.address = ownerAddr;
  ownerInfo.numStores = (await storesInstance.getOwnerStoreCount(ownerAddr)).toNumber();
  ownerInfo.numProducts = 0;
  for (let ownerStoreIdx  = 0; ownerStoreIdx < ownerInfo.numStores; ownerStoreIdx += 1) {
    const storeId = (await storesInstance.ownerToStoreIds(ownerInfo.address, ownerStoreIdx)).toNumber();
    const storeNumProducts = (await productsInstance.getStoreProductCount(storeId)).toNumber();
    ownerInfo.numProducts += storeNumProducts;
  }
  return ownerInfo;
};

export default {
  namespaced: true,
  state: {
    contractInstance: null,
    contractIsLoaded: false,

    findOwnersStatus: '',
    foundOwners: [],
    newOwnersWatcher: null,

    findOwnerStatus: '',
    foundOwner: null,

    findRoleStatus: '',
    foundRole: null,

    createOwnerStatus: '',
    removeOwnerStatus: '',
  },
  getters: {
    contractIsLoaded: state => state.contractIsLoaded,
    currentRole: state => state.foundRole,
    foundOwners: state => state.foundOwners,
    foundOwner: state => state.foundOwner,
    createOwnerStatus: state => state.createOwnerStatus,
    removeOwnerStatus: state => state.removeOwnerStatus,
  },
  mutations: {
    //
    // Setup
    //

    [types.SET_CONTRACT_INSTANCE](state, contractInstance) {
      state.contractInstance = contractInstance;
    },
    [types.CLEAR_CONTRACT_INSTANCE](state) {
      state.contractInstance = null;
    },

    //
    // Events
    //

    [types.ADD_NEW_OWNER](state, newOwner) {
      state.foundOwners = [ newOwner, ...state.foundOwners ];
    },

    [types.SAVE_NEW_OWNERS_WATCHER](state, contractEventWatcher) {
      state.newOwnersWatcher = contractEventWatcher;
    },
    [types.REMOVE_NEW_OWNERS_WATCHER](state) {
      state.newOwnersWatcher = null;
    },

    //
    // Getters
    //

    [types.FIND_OWNER_START](state) {
      state.foundOwner = [];
      state.findOwnerStatus = 'loading';
    },
    [types.FIND_OWNER_SUCCESS](state, foundOwner) {
      state.findOwnerStatus = 'success';
      state.foundOwner = foundOwner;
    },
    [types.FIND_OWNER_ERROR](state, error) {
      state.findOwnerStatus = '';
    },

    [types.FIND_OWNERS_START](state) {
      state.foundOwners = [];
      state.findOwnersStatus = 'loading';
    },
    [types.FIND_OWNERS_SUCCESS](state, foundOwners) {
      state.findOwnersStatus = 'success';
      state.foundOwners = foundOwners;
    },
    [types.FIND_OWNERS_ERROR](state, error) {
      state.findOwnersStatus = '';
    },

    [types.FIND_USER_ROLE_START](state) {
      state.foundRole = null;
      state.findRoleStatus = 'loading';
    },
    [types.FIND_USER_ROLE_SUCCESS](state, foundRole) {
      state.findRoleStatus = 'success';
      state.foundRole = foundRole;
    },
    [types.FIND_USER_ROLE_ERROR](state, error) {
      state.findRoleStatus = '';
    },

    //
    //
    // Setters
    //
    //

    [types.CREATE_OWNER_START](state) {
      state.createOwnerStatus = 'loading';
    },
    [types.CREATE_OWNER_SUCCESS](state) {
      state.createOwnerStatus = 'success';
    },
    [types.CREATE_OWNER_ERROR](state, err) {
      state.createOwnerStatus = '';
    },

    [types.REMOVE_OWNER_START](state) {
      state.removeOwnerStatus = 'loading';
    },
    [types.REMOVE_OWNER_SUCCESS](state) {
      state.removeOwnerStatus = 'success';
    },
    [types.REMOVE_OWNER_ERROR](state, error) {
      state.removeOwnerStatus = '';
    },

  },
  actions: {
    //
    //
    // Set up
    //
    //

    async loadContract({ rootState, commit, dispatch }) {
      try {
        const web3 = rootState.conn.web3();
        const contractInstance = contract(UsersArtifact);

        contractInstance.setProvider(web3.currentProvider);

        const instance = await contractInstance.deployed();

        commit(types.SET_CONTRACT_INSTANCE, () => instance);
        dispatch('getUserRole');
      } catch (err) {
        Notification.showError(err);
        console.log(err);
      }
    },
    async unloadContract({ commit }) {
      commit(types.CLEAR_CONTRACT_INSTANCE);
    },

    //
    //
    // Event Listeners
    //
    //

    //
    // Watch for new products
    //
    async watchNewOwners({ rootState, state, commit, dispatch }) {
      const usersInstance = state.contractInstance();
      const event = usersInstance.StoreownerAdded({});

      event.watch(async (err, res) => {
        if (!err && res) {
          const newOwnerAddr = res.args.newStoreOwner;
          if (state.foundOwners.some(owner => owner.address === newOwnerAddr)) {
            // we already got this owner, ignore the event
            return;
          }

          const storesInstance = rootState.stores.contractInstance();
          const productsInstance = rootState.products.contractInstance();

          const foundOwner = await gatherOwnerInfo(storesInstance, productsInstance, newOwnerAddr);
          if (foundOwner) {
            commit(types.ADD_NEW_OWNER, foundOwner);
          }
        }
      });

      commit(types.SAVE_NEW_OWNERS_WATCHER, () => event);
    },
    async unwatchNewOwners({ state, commit }) {
      const event = state.newOwnersWatcher();
      event.stopWatching(res => {
        commit(types.REMOVE_NEW_OWNERS_WATCHER);
      });
    },

    //
    //
    // Functions: Setters
    //
    //

    async createOwner({ rootState, state, commit }, ownerData) {
      commit(types.CREATE_OWNER_START);

      try {
        const usersContract = state.contractInstance();

        const tx = await usersContract.addStoreowner(ownerData.address, { from: rootState.conn.currentAddress });

        commit(types.CREATE_OWNER_SUCCESS);
      } catch (err) {
        Notification.showError(err);
        console.log(err);
        commit(types.CREATE_OWNER_ERROR, err);
      }
    },

    async removeOwner({ rootState, state, commit }, ownerAddr) {
      commit(types.REMOVE_OWNER_START);
      try {
        const usersInstance = state.contractInstance();
        const tx = await usersInstance.removeStoreowner(ownerAddr, {
          from: rootState.conn.currentAddress,
          gas: 2e5,
        });
        commit(types.REMOVE_OWNER_SUCCESS);
      } catch (err) {
        console.log(err);
        Notification.showError(err);
        commit(types.REMOVE_OWNER_ERROR);
      }
    },

    //
    //
    // Functions: Getters
    //
    //

    async getUserRole({ rootState, state, commit }) {
      commit(types.FIND_USER_ROLE_START);

      try {
        const address = rootState.conn.currentAddress;

        const instance = state.contractInstance();

        const isAdmin = await instance.isAdmin(address);
        if (isAdmin) {
          commit(types.FIND_USER_ROLE_SUCCESS, 'admin');
          return;
        }

        const isOwner = await instance.isStoreowner(address);
        if (isOwner) {
          commit(types.FIND_USER_ROLE_SUCCESS, 'owner');
          return;
        }

        commit(types.FIND_USER_ROLE_SUCCESS, 'shopper');
      } catch (err) {
        Notification.showError(err);
        console.log(err);
        commit(types.FIND_USER_ROLE_ERROR, err);
      }
    },

    async getOwner({ rootState, state, commit }, { ownerAddr }) {
      commit(types.FIND_OWNER_START);

      try {
        const usersInstance = state.contractInstance();
        const storesInstance = rootState.stores.contractInstance();
        const productsInstance = rootState.products.contractInstance();

        commit(types.FIND_OWNER_SUCCESS, await gatherOwnerInfo(storesInstance, productsInstance, ownerAddr));
      } catch (err) {
        Notification.showError(err);
        console.log(err);
        commit(types.FIND_OWNER_ERROR);
      }
    },

    async getOwners({ rootState, state, commit, dispatch }) {
      commit(types.FIND_OWNERS_START);

      try {
        const usersInstance = state.contractInstance();
        const storesInstance = rootState.stores.contractInstance();
        const productsInstance = rootState.products.contractInstance();

        const ownerCountBN = await usersInstance.getStoreownerCount();

        if (ownerCountBN.eq(0)) {
          commit(types.FIND_OWNERS_SUCCESS, []);
          dispatch('watchNewOwners');
          return;
        }
        const ownerCount = ownerCountBN.toNumber();

        const foundOwners = [];

        for (let ownerIdx = ownerCount - 1; ownerIdx >= 0; ownerIdx -= 1) {
          const ownerInfo = {};
          const ownerAddr = await usersInstance.storeowners(ownerIdx);
          foundOwners.push(await gatherOwnerInfo(storesInstance, productsInstance, ownerAddr));
        }

        dispatch('watchNewOwners');
        commit(types.FIND_OWNERS_SUCCESS, foundOwners);
      } catch (err) {
        Notification.showError(err);
        console.log(err);
        commit(types.FIND_OWNERS_ERROR);
      }
    },
  },
};
