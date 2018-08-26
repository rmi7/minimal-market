/* eslint-disable no-await-in-loop, max-len, function-paren-newline */
/* eslint-disable */
import contract from 'truffle-contract';
import _ from 'lodash';
import Notification from '../../notification';
import StoresArtifact from '../../../../build/contracts/Stores.json';
import { getBytes32FromIpfsHash, getIpfsHashFromBytes32 } from '../../util';

const { Buffer } = require('buffer/');

export const types = {
  //
  // Setup
  //

  SET_CONTRACT_INSTANCE: 'SET_CONTRACT_INSTANCE',
  CLEAR_CONTRACT_INSTANCE: 'CLEAR_CONTRACT_INSTANCE',

  //
  // Events
  //

  ADD_NEW_STORE: 'ADD_NEW_STORE',
  SAVE_NEW_STORES_WATCHER: 'SAVE_NEW_STORES_WATCHER',
  REMOVE_NEW_STORES_WATCHER: 'REMOVE_NEW_STORES_WATCHER',

  //
  // Getters
  //

  FIND_STORE_START: 'FIND_STORE_START',
  FIND_STORE_SUCCESS: 'FIND_STORE_SUCCESS',
  FIND_STORE_ERROR: 'FIND_STORE_ERROR',

  FIND_STORES_START: 'FIND_STORES_START',
  FIND_STORES_SUCCESS: 'FIND_STORES_SUCCESS',
  FIND_STORES_ERROR: 'FIND_STORES_ERROR',

  FIND_OWNER_STORES_START: 'FIND_OWNER_STORES_START',
  FIND_OWNER_STORES_SUCCESS: 'FIND_OWNER_STORES_SUCCESS',
  FIND_OWNER_STORES_ERROR: 'FIND_OWNER_STORES_ERROR',

  //
  // Setters
  //

  CREATE_STORE_START: 'CREATE_STORE_START',
  CREATE_STORE_SUCCESS: 'CREATE_STORE_SUCCESS',
  CREATE_STORE_ERROR: 'CREATE_STORE_ERROR',

  UPDATE_STORE_START: 'UPDATE_STORE_START',
  UPDATE_STORE_SUCCESS: 'UPDATE_STORE_SUCCESS',
  UPDATE_STORE_ERROR: 'UPDATE_STORE_ERROR',

  REMOVE_STORE_START: 'REMOVE_STORE_START',
  REMOVE_STORE_SUCCESS: 'REMOVE_STORE_SUCCESS',
  REMOVE_STORE_ERROR: 'REMOVE_STORE_ERROR',
};

const getStoreInfo = async (ipfsConn, productsInstance, storesInstance, storeId) => {
  const foundStore = await storesInstance.getStore(storeId);
  if (foundStore[5] === false) { // foundStore.exists
    return null;
  } else {
    const { name, description, image } = JSON.parse(await ipfsConn.files.cat(getIpfsHashFromBytes32(foundStore[2])));

    const imageBlob = new Blob([await ipfsConn.files.cat(image)], { type: 'image/jpg' });
    const imageUrl = window.URL.createObjectURL(imageBlob);
    const productCount = await productsInstance.getStoreProductCount(foundStore[0]);

    return {
      // from Stores smart contract
      id: foundStore[0].toNumber(),
      owner: foundStore[1],
      createdAt: foundStore[3].toNumber(),
      updatedAt: foundStore[4].toNumber(),

      // from Products smart contract
      productCount,

      // from ipfs
      name,
      description,
      imageUrl,
    };
  }
};

export default {
  namespaced: true,
  state: {
    contractInstance: null,
    contractIsLoaded: false,

    findStoreStatus: '',
    foundStore: null,

    findStoresStatus: '',
    foundStores: [],

    newStoresWatcher: null,

    findOwnerStoresStatus: '',
    foundOwnerStores: [],

    createStoreStatus: '',
    updateStoreStatus: '',
    removeStoreStatus: '',
  },
  getters: {
    contractIsLoaded: state => state.contractIsLoaded,
    foundStores: state => state.foundStores,
    foundStore: state => state.foundStore,
    createStoreStatus: state => state.createStoreStatus,
    removeStoreStatus: state => state.removeStoreStatus,
    foundOwnerStores: state => state.foundOwnerStores,
  },
  mutations: {
    //
    // Setup
    //

    [types.SET_CONTRACT_INSTANCE](state, newContractInstanceFn) {
      state.contractIsLoaded = true;
      state.contractInstance = newContractInstanceFn;
    },
    [types.CLEAR_CONTRACT_INSTANCE](state) {
      state.contractIsLoaded = false;
      state.contractInstance = null;
    },

    //
    // Events
    //

    [types.ADD_NEW_STORE](state, newStore) {
      state.foundStores = [ newStore, ...state.foundStores ].sort((a, b) => b.id - a.id);
    },

    [types.SAVE_NEW_STORES_WATCHER](state, contractEventWatcher) {
      state.newStoresWatcher = contractEventWatcher;
    },
    [types.REMOVE_NEW_STORES_WATCHER](state) {
      state.newStoresWatcher = null;
    },

    //
    // Getters
    //

    // find single store
    [types.FIND_STORE_START](state) {
      state.findStoreStatus = 'loading';
    },
    [types.FIND_STORE_SUCCESS](state, foundStore) {
      state.findStoreStatus = 'success';
      state.foundStore = foundStore;
    },
    [types.FIND_STORE_ERROR](state, error) {
      state.findStoreStatus = '';
    },

    // find all stores (newest first)
    [types.FIND_STORES_START](state) {
      state.findStoresStatus = 'loading';
    },
    [types.FIND_STORES_SUCCESS](state, foundStores) {
      state.findStoresStatus = 'success';
      state.foundStores = foundStores.sort((a, b) => b.id - a.id);;
    },
    [types.FIND_STORES_ERROR](state, error) {
      state.findStoresStatus = '';
    },

    // find all stores owned by owner
    [types.FIND_OWNER_STORES_START](state) {
      state.fondOwnerStoresStatus = 'loading';
    },
    [types.FIND_OWNER_STORES_SUCCESS](state, foundStores) {
      state.findOwnerStoresStatus = 'success';

      state.foundOwnerStores = foundStores.sort((a, b) => b.id - a.id);;
    },
    [types.FIND_OWNER_STORES_ERROR](state, error) {
      state.findOwnerStoresStatus = '';
    },

    //
    // Setters
    //

    // create a store
    [types.CREATE_STORE_START](state) {
      state.createStoreStatus = 'loading';
    },
    [types.CREATE_STORE_SUCCESS](state) {
      state.createStoreStatus = 'success';
    },
    [types.CREATE_STORE_ERROR](state, err) {
      state.createStoreStatus = '';
    },

    // update a store
    [types.UPDATE_STORE_START](state) {
      state.updateStoreStatus = 'loading';
    },
    [types.UPDATE_STORE_SUCCESS](state) {
      state.updateStoreStatus = 'success';
    },
    [types.UPDATE_STORE_ERROR](state, error) {
      state.updateStoreStatus = '';
    },

    // remove a store
    [types.REMOVE_STORE_START](state) {
      state.removeStoreStatus = 'loading';
    },
    [types.REMOVE_STORE_SUCCESS](state) {
      state.removeStoreStatus = 'success';
    },
    [types.REMOVE_STORE_ERROR](state, error) {
      state.removeStoreStatus = '';
    },
  },
  actions: {
    //
    //
    // Setup
    //
    //

    async loadContract({ rootState, commit }) {
      try {
        const web3 = rootState.conn.web3();
        const contractInstance = contract(StoresArtifact);

        contractInstance.setProvider(web3.currentProvider);

        const instance = await contractInstance.deployed();

        commit(types.SET_CONTRACT_INSTANCE, () => instance);
      } catch (err) {
        Notification.showError(err);
        console.log(err);
      }
    },
    async unloadContract({ state, commit }) {
      commit(types.CLEAR_CONTRACT_INSTANCE);
    },

    //
    //
    // Event Listeners
    //
    //

    async watchNewStores({ rootState, state, commit, dispatch }) {
      const storesInstance = state.contractInstance();
      const event = storesInstance.StoreAdded({});

      event.watch(async (err, res) => {
        if (!err && res) {
          const storeId = res.args.storeId;
          if (state.foundStores.some(store => store.id === storeId.toNumber())) {
            // we already got this store, ignore the event
            return;
          }

          const productsInstance = rootState.products.contractInstance();
          const ipfsConn = rootState.conn.ipfs();

          const foundStore = await getStoreInfo(ipfsConn, productsInstance, storesInstance, storeId);
          if (foundStore) {
            commit(types.ADD_NEW_STORE, foundStore);
          }
        }
      });

      commit(types.SAVE_NEW_STORES_WATCHER, () => event);
    },
    async unwatchNewStores({ state, commit }) {
      const event = state.newStoresWatcher();
      event.stopWatching(res => {
        commit(types.REMOVE_NEW_STORES_WATCHER);
      });
    },

    //
    //
    // Setters
    //
    //

    async createStore({ rootState, state, commit }, storeData) {
      commit(types.CREATE_STORE_START);

      try {
        const storesContract = state.contractInstance();
        const ipfsConn = rootState.conn.ipfs();

        //
        // 1/4 ipfs upload store image
        //

        const imageIpfsAddRes = await ipfsConn.add(Buffer.from(storeData.image), {
          progress: (prog) => console.log(`received: ${prog}`)
        });

        if (!imageIpfsAddRes) {
          throw new Error('failed to upload Store image to ipfs');
        }

        const imageIpfsHash = imageIpfsAddRes[0].hash;


        //
        // 2/4 ipfs upload store content object
        //

        const contentObj = {
          name: storeData.name,
          description: storeData.description,
          image: imageIpfsHash,
        };

        const contentIpfsAddRes = (await ipfsConn.add([Buffer.from(JSON.stringify(contentObj))], {
          progress: (prog) => console.log(`received: ${prog}`)
        }));

        if (!contentIpfsAddRes) {
          throw new Error('failed to upload Store content to ipfs');
        }

        const contentIpfsHash = contentIpfsAddRes[0].hash;

        //
        // 3/4 ipfs pint both image + contentObj
        //

        await ipfsConn.pin.add(imageIpfsHash);
        await ipfsConn.pin.add(contentIpfsHash);

        //
        // 4/4 ethereum call Stores.addStore(contentHash)
        //

        const tx = await storesContract.addStore(getBytes32FromIpfsHash(contentIpfsHash), { from: rootState.conn.currentAddress });

        commit(types.CREATE_STORE_SUCCESS);
      } catch (err) {
        Notification.showError(err);
        commit(types.CREATE_STORE_ERROR, err);
      }
    },

    //
    //
    // Getters
    //
    //

    async getStores({ rootState, state, commit, dispatch }) {
      commit(types.FIND_STORES_START);
      const storesInstance = state.contractInstance();

      try {
        const storeCountBN = await storesInstance.storeIdCounter();
        if (storeCountBN.eq(0)) {
          commit(types.FIND_STORES_SUCCESS, []);
          dispatch('watchNewStores');
          return;
        }
        const storeCount = parseInt(storeCountBN.toString(), 10);
        // there is no store with id 0,
        // the id of the first store is 1, second store is 2, etc.
        const MIN_STORE_ID = 1;

        // we want a list of stores, starting fromt the newest store
        // to do this we make use of the incrementing Stores.storeIdCounter variable
        // which tells us the productId of the newest product. the 2nd newest
        // productId will be storeIdCounter - 1, etc.
        //
        // after we get this list of storeIds, we use Stores.getStore(storeId)
        // to get the content of each store, if the return of any of these calls
        // is foundProduct.exists === false, that means that product was deleted
        // so we just skip this storeId
        //
        // after this we use ipfs to get the content associated with the foundStore.contentHash

        const ipfsConn = rootState.conn.ipfs();
        const productsInstance = rootState.products.contractInstance();

        const foundStores = [];

        // TODO: add limit to fetch --> implement batching
        for (let storeId = storeCount; storeId >= MIN_STORE_ID; storeId -= 1) {
          const foundStore = await getStoreInfo(ipfsConn, productsInstance, storesInstance, storeId);
          if (foundStore) {
            foundStores.push(foundStore);
          }
        }

        commit(types.FIND_STORES_SUCCESS, foundStores);

        dispatch('watchNewStores');
      } catch (err) {
        Notification.showError(err);
        console.log(err);
        commit(types.FIND_STORES_ERROR, err);
      }
    },

    async getOwnerStores({ rootState, state, commit, dispatch }, { ownerAddr }) {
      commit(types.FIND_OWNER_STORES_START);

      const storesInstance = state.contractInstance();
      console.log({ ownerAddr });
      try {
        // get product count of store from ethereum
        const ownerStoreCountBN = await storesInstance.getOwnerStoreCount(ownerAddr);
        if (ownerStoreCountBN.eq(0)) {
          commit(types.FIND_OWNER_STORES_SUCCESS, []);
          return;
        }
        const ownerStoreCount = parseInt(ownerStoreCountBN.toString(), 10);

        const ipfsConn = rootState.conn.ipfs();
        const productsInstance = rootState.products.contractInstance();

        const foundOwnerStores = [];

        // TODO: add limit to fetch --> implement batching
        for (let storeIdx = 0; storeIdx < ownerStoreCount; storeIdx += 1) {
          const storeId = await storesInstance.ownerToStoreIds(ownerAddr, storeIdx);
          console.log({ storeId });
          const foundStore = await getStoreInfo(ipfsConn, productsInstance, storesInstance, storeId);
          if (foundStore) {
            foundOwnerStores.push(foundStore);
          }
        }

        foundOwnerStores.sort((a, b) => a.id - b.id);

        commit(types.FIND_OWNER_STORES_SUCCESS, foundOwnerStores);
      } catch (err) {
        console.log(err);
        Notification.showError(err);
        commit(types.FIND_OWNER_STORES_ERROR, err);
      }
    },

    async getStore({ rootState, state, commit, dispatch }, { storeId }) {
      commit(types.FIND_STORE_START);

      try {
        const storesInstance = state.contractInstance();
        const productsInstance = rootState.products.contractInstance();
        const ipfsConn = rootState.conn.ipfs();

        const foundStore = await getStoreInfo(ipfsConn, productsInstance, storesInstance, storeId);
        if (!foundStore) {
          throw new Error(`Store #${storeId} not found`);
        }
        commit(types.FIND_STORE_SUCCESS, foundStore);
      } catch (err) {
        Notification.showError(err);
        commit(types.FIND_STORE_ERROR, err);
        console.log(err);
      }
    },

    // async updateStore({ state, commit }, { productId, newPrice, newQuantity }) {
    //   const productIdBN = web3().utils.toBN(productId);
    //   const newPriceBN = newPrice && web3().utils.toBN(price);
    //   const newQuantityBN = newQuantity && web3().utils.toBN(quantity);
    //
    //   let tx;
    //
    //   commit(types.UPDATE_STORE_START);
    //   try {
    //     if (newPriceBN && newQuantityBN) {
    //       tx = await state.contractInstance.updateQuantityAndPrice(productIdBN, newQuantityBN, newPriceBN);
    //     } else if (newPriceBN) {
    //       tx = await state.contractInstance.updatePrice(productIdBN, newPriceBN);
    //     } else if (newQuantityBN) {
    //       tx = await state.contractInstance.updateQuantity(productIdBN, newQuantityBN);
    //     } console.log({ txUpdateStore: tx });
    //   } catch (err) {
    //     commit(types.UPDATE_STORE_ERROR);
    //   }
    // },

    async removeStore({ rootState, state, commit }, storeId) {
      commit(types.REMOVE_STORE_START);
      try {
        const storesInstance = state.contractInstance();
        const tx = await storesInstance.removeStore(storeId, {
          from: rootState.conn.currentAddress,
          gas: 200000,
        });
        commit(types.REMOVE_STORE_SUCCESS);
      } catch (err) {
        console.log(err);
        Notification.showError(err);
        commit(types.REMOVE_STORE_ERROR);
      }
    },
  },
};
