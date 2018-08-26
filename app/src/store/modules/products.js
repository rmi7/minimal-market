/* eslint-disable no-await-in-loop, max-len, function-paren-newline */
/* eslint-disable */
import contract from 'truffle-contract';
import _ from 'lodash';
import Notification from '../../notification';
import ProductsArtifact from '../../../../build/contracts/Products.json';
import { getIpfsHashFromBytes32, getBytes32FromIpfsHash } from '../../util';

const MIN_PRODUCT_ID = 1;

export const types = {
  //
  // Setup
  //

  SET_CONTRACT_INSTANCE: 'SET_CONTRACT_INSTANCE',
  CLEAR_CONTRACT_INSTANCE: 'CLEAR_CONTRACT_INSTANCE',

  //
  // Events
  //

  ADD_NEW_PRODUCT: 'ADD_NEW_PRODUCT',
  SAVE_NEW_PRODUCTS_WATCHER: 'SAVE_NEW_PRODUCTS_WATCHER',
  REMOVE_NEW_PRODUCTS_WATCHER: 'REMOVE_NEW_PRODUCTS_WATCHER',

  ADD_NEW_STORE_PRODUCT: 'ADD_NEW_STORE_PRODUCT',
  SAVE_NEW_STORE_PRODUCTS_WATCHER: 'SAVE_NEW_STORE_PRODUCTS_WATCHER',
  REMOVE_NEW_STORE_PRODUCTS_WATCHER: 'REMOVE_NEW_STORE_PRODUCTS_WATCHER',

  UPDATE_PRODUCT_QUANTITY: 'UPDATE_PRODUCT_QUANTITY',

  //
  // Getters
  //

  FIND_PRODUCT_START: 'FIND_PRODUCT_START',
  FIND_PRODUCT_SUCCESS: 'FIND_PRODUCT_SUCCESS',
  FIND_PRODUCT_ERROR: 'FIND_PRODUCT_ERROR',

  FIND_PRODUCTS_START: 'FIND_PRODUCTS_START',
  FIND_PRODUCTS_SUCCESS: 'FIND_PRODUCTS_SUCCESS',
  FIND_PRODUCTS_ERROR: 'FIND_PRODUCTS_ERROR',

  FIND_STORE_PRODUCTS_START: 'FIND_STORE_PRODUCTS_START',
  FIND_STORE_PRODUCTS_SUCCESS: 'FIND_STORE_PRODUCTS_SUCCESS',
  FIND_STORE_PRODUCTS_ERROR: 'FIND_STORE_PRODUCTS_ERROR',

  //
  // Setters
  //

  CREATE_PRODUCT_START: 'CREATE_PRODUCT_START',
  CREATE_PRODUCT_SUCCESS: 'CREATE_PRODUCT_SUCCESS',
  CREATE_PRODUCT_ERROR: 'CREATE_PRODUCT_ERROR',

  PURCHASE_PRODUCT_START: 'PURCHASE_PRODUCT_START',
  PURCHASE_PRODUCT_SUCCESS: 'PURCHASE_PRODUCT_SUCCESS',
  PURCHASE_PRODUCT_ERROR: 'PURCHASE_PRODUCT_ERROR',

  REMOVE_PRODUCT_START: 'REMOVE_PRODUCT_START',
  REMOVE_PRODUCT_SUCCESS: 'REMOVE_PRODUCT_SUCCESS',
  REMOVE_PRODUCT_ERROR: 'REMOVE_PRODUCT_ERROR',
};

const getProductInfo = async (web3, ipfsConn, productsInstance, storesInstance, productId) => {
  const foundProduct = await productsInstance.getProduct(productId);
  if (foundProduct[7] === false) { // foundProduct.exists
    return null;
  } else {
    const storeId = foundProduct[1];

    const foundStore = await storesInstance.getStore(storeId);
    if (foundStore[5] !== true) {
      throw new Error('could not find store of product', storeId.toString());
    }

    const storeName = JSON.parse(await ipfsConn.files.cat(getIpfsHashFromBytes32(foundStore[2]))).name;
    const owner = foundStore[1];

    // use smart contract struct foundProduct.cotnenthash (which is at idx 2)
    const { name, description, image } = JSON.parse(await ipfsConn.files.cat(getIpfsHashFromBytes32(foundProduct[2])));

    // now fetch the image content hash from ipfs
    const imageBlob = new Blob([await ipfsConn.files.cat(image)], { type: 'image/jpg' });

    // convert to browser image url
    const imageUrl = window.URL.createObjectURL(imageBlob);

    // TODO: get content from ipfs
    return {
      // from Products smart contract
      id: foundProduct[0].toNumber(),
      storeId: foundProduct[1].toNumber(),
      // [2] is ipfs content hash
      price: web3.utils.fromWei(foundProduct[3].toString()),
      quantity: foundProduct[4].toString(),
      createdAt: foundProduct[5].toNumber(),
      updatedAt: foundProduct[6].toNumber(),

      // from Stores smart contract
      owner,
      storeName,

      // from ipfs
      name,
      imageUrl,
      description,
      imageUrl,
    };
  }
};

export default {
  namespaced: true,
  state: {
    //
    // Setup
    //

    contractInstance: null,
    contractIsLoaded: false,

    //
    // Events
    //

    newStoreProductsWatcher: null,
    newProductsWatcher: null,
    productPurchasesWatcher: null,

    //
    // Getters
    //

    foundProducts: [],
    findProductsStatus: '',

    findProductStatus: '',
    foundProduct: null,

    findStoreProductsStatus: '',
    foundStoreProducts: [],

    //
    // Setters
    //

    createProductStatus: '',
    purchaseProductStatus: '',
    updateProductStatus: '',
    removeProductStatus: '',
  },
  getters: {
    contractIsLoaded: state => state.contractIsLoaded,
    foundProduct: state => state.foundProduct,
    foundStoreProducts: state => state.foundStoreProducts,
    foundProducts: state => state.foundProducts,
    purchaseProductStatus: state => state.purchaseProductStatus,
    removeProductStatus: state => state.removeProductStatus,
    createProductStatus: state => state.createProductStatus,
  },
  mutations: {
    //
    // Setup
    //

    [types.SET_CONTRACT_INSTANCE](state, contractInstance) {
      state.contractIsLoaded = true;
      state.contractInstance = contractInstance;
    },
    [types.CLEAR_CONTRACT_INSTANCE](state) {
      state.contractIsLoaded = false;
      state.contractInstance = null;
    },

    //
    // Events
    //

    [types.ADD_NEW_PRODUCT](state, newProduct) {
      // sort should not be necessary but just to be sure
      state.foundProducts = [ newProduct, ...state.foundProducts ].sort((a, b) => b.id - a.id);
    },
    [types.ADD_NEW_STORE_PRODUCT](state, newStoreProduct) {
      // sort should not be necessary but just to be sure
      state.foundStoreProducts = [ newStoreProduct, ...state.foundStoreProducts ].sort((a, b) => b.id - a.id);
    },

    [types.SAVE_NEW_PRODUCTS_WATCHER](state, contractEventWatcher) {
      state.newProductsWatcher = contractEventWatcher;
    },
    [types.REMOVE_NEW_PRODUCTS_WATCHER](state) {
      state.newProductsWatcher = false;
    },

    [types.SAVE_NEW_STORE_PRODUCTS_WATCHER](state, contractEventWatcher) {
      state.newStoreProductsWatcher = contractEventWatcher;
    },
    [types.REMOVE_NEW_STORE_PRODUCTS_WATCHER](state) {
      state.newStoreProductsWatcher = false;
    },

    [types.SET_PRODUCT_PURCHASES_WATCHER](state, contractEventWatcher) {
      state.productPurchasesWatcher = contractEventWatcher;
    },
    [types.REMOVE_NEW_PRODUCT_PURCHASES_WATCHER](state) {
      state.productPurchasesWatcher = false;
    },

    // when product is sold quantity will decrease
    [types.UPDATE_PRODUCT_QUANTITY](state, newQuantity) {
      state.foundProduct = { ...state.foundProduct, quantity: newQuantity };
    },

    //
    // Getters
    //

    [types.FIND_PRODUCT_START](state) {
      state.foundProduct = null;
      state.findProductStatus = 'loading';
    },
    [types.FIND_PRODUCT_SUCCESS](state, foundProduct) {
      state.findProductStatus = 'success';
      state.foundProduct = foundProduct;
    },
    [types.FIND_PRODUCT_ERROR](state, error) {
      state.findProductStatus = '';
    },

    // all products (newest first)
    [types.FIND_PRODUCTS_START](state) {
      state.findProductsStatus = 'loading';
    },
    [types.FIND_PRODUCTS_SUCCESS](state, foundProducts) {
      state.findProductsStatus = 'success';
      state.foundProducts = foundProducts.sort((a, b) => b.id - a.id);
    },
    [types.FIND_PRODUCTS_ERROR](state, error) {
      state.findProductsStatus = '';
    },
    [types.CLEAR_FIND_PRODUCTS](state) {
      state.findOwnerStoreIdsStatus = '';
      state.foundOwnerStoreIds = [];
    },

    // all products (newest first) of a specific storeId
    [types.FIND_STORE_PRODUCTS_START](state) {
      state.foundStoreProducts = [];
      state.findStoreProductsStatus = 'loading';
    },
    [types.FIND_STORE_PRODUCTS_SUCCESS](state, newFoundStoreProducts) {
      state.findStoreProductsStatus = 'success';
      // remove the product from the list of all products
      state.foundStoreProducts = newFoundStoreProducts.sort((a, b) => b.id - a.id);;
    },
    [types.FIND_STORE_PRODUCTS_ERROR](state, error) {
      state.findStoreProductsStatus = '';
    },

    //
    // Setters
    //

    // creating a product
    [types.CREATE_PRODUCT_START](state) {
      state.createProductStatus = 'loading';
    },
    [types.CREATE_PRODUCT_SUCCESS](state, productId) {
      state.createProductStatus = 'success';
      // create the product from the list of all products
      // state.foundProducts = state.foundProducts.filter(itemProductId => itemProductId !== productId)
    },
    [types.CREATE_PRODUCT_ERROR](state, error) {
      state.createProductStatus = '';
    },


    // removing a product
    [types.REMOVE_PRODUCT_START](state) {
      state.removeProductStatus = 'loading';
    },
    [types.REMOVE_PRODUCT_SUCCESS](state, productId) {
      state.removeProductStatus = 'success';
      // remove the product from the list of all products
      // state.foundProducts = state.foundProducts.filter(itemProductId => itemProductId !== productId)
    },
    [types.REMOVE_PRODUCT_ERROR](state, error) {
      state.removeProductStatus = '';
    },

    // purchasing a product
    [types.PURCHASE_PRODUCT_START](state) {
      state.purchaseProductStatus = 'loading';
    },
    [types.PURCHASE_PRODUCT_SUCCESS](state) {
      state.purchaseProductStatus = 'success';
    },
    [types.PURCHASE_PRODUCT_ERROR](state, error) {
      state.purchaseProductStatus = '';
    },

    // updating a product
    [types.UPDATE_PRODUCT_START](state) {
      state.updateProductStatus = 'loading';
    },
    [types.UPDATE_PRODUCT_SENT](state) {
      state.updateProductStatus = 'sent';
    },
    [types.UPDATE_PRODUCT_SUCCESS](state) {
      state.updateProductStatus = 'mined';
    },
    [types.UPDATE_PRODUCT_ERROR](state, error) {
      state.updateProductStatus = '';
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
        const contractInstance = contract(ProductsArtifact);

        contractInstance.setProvider(web3.currentProvider);

        const instance = await contractInstance.deployed();

        commit(types.SET_CONTRACT_INSTANCE, () => instance);
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
    // Event listeners
    //
    //

    //
    // Watch for new products of a particular store
    //
    async watchNewStoreProducts({ rootState, state, commit, dispatch }, { storeId }) {
      const productsInstance = state.contractInstance();
      const web3 = rootState.conn.web3();
      const event = productsInstance.ProductAdded({ storeId });

      event.watch(async (err, res) => {

        if (!err && res) {
          const productId = res.args.productId;
          // const productId = res.args.productId;
          if (state.foundStoreProducts.some(product => product.id === productId.toNumber())) {
            // we already got this product, ignore the event
            return;
          }

          const storesInstance = rootState.stores.contractInstance();
          const ipfsConn = rootState.conn.ipfs();

          const foundProduct = await getProductInfo(web3, ipfsConn, productsInstance, storesInstance, productId);
          if (foundProduct) {
            commit(types.ADD_NEW_STORE_PRODUCT, foundProduct);
          }
        }
      });

      commit(types.SAVE_NEW_STORE_PRODUCTS_WATCHER, () => event);
    },
    async unwatchNewStoreProducts({ state, commit }) {
      const event = state.newStoreProductsWatcher();
      event.stopWatching(res => {
        commit(types.REMOVE_NEW_STORE_PRODUCTS_WATCHER);
      });
    },

    //
    // Watch for new products
    //
    async watchNewProducts({ rootState, state, commit, dispatch }) {
      const productsInstance = state.contractInstance();
      const event = productsInstance.ProductAdded({});

      event.watch(async (err, res) => {
        if (!err && res) {
          const productId = res.args.productId;
          if (state.foundProducts.some(product => product.id === productId.toNumber())) {
            // we already got this product, ignore the event
            return;
          }

          const storesInstance = rootState.stores.contractInstance();
          const ipfsConn = rootState.conn.ipfs();
          const web3 = rootState.conn.web3();

          const foundProduct = await getProductInfo(web3, ipfsConn, productsInstance, storesInstance, productId);
          if (foundProduct) {
            commit(types.ADD_NEW_PRODUCT, foundProduct);
          }
        }
      });

      commit(types.SAVE_NEW_PRODUCTS_WATCHER, () => event);
    },
    async unwatchNewProducts({ state, commit }) {
      const event = state.newProductsWatcher();
      event.stopWatching(res => {
        commit(types.REMOVE_NEW_PRODUCTS_WATCHER);
      });
    },

    //
    // Watch for purchases of a specific product
    //
    async watchProductPurchases({ rootState, state, commit, dispatch }, { productId }) {
      const productsInstance = state.contractInstance()

      const event = productsInstance.ProductPurchased({ productId: parseInt(productId, 10) });

      event.watch(async (err, res) => {
        if (!err && res) {
          commit(types.UPDATE_PRODUCT_QUANTITY, res.args.newQuantity);
        }
      });

      commit(types.REMOVE_PRODUCT_PURCHASES_WATCHER, () => event);
    },
    async unwatchProductPurchases({ commit }) {
      const event = state.productPurchasesWatcher();
      event.stopWatching(res => {
        commit(types.REMOVE_PRODUCT_PURCHASES_WATCHER);
      });
    },


    //
    //
    // Functions: Setters
    //
    //

    async createProduct({ rootState, state, commit }, productData) {
      commit(types.CREATE_PRODUCT_START);

      try {
        const productsContract = state.contractInstance();
        const ipfsConn = rootState.conn.ipfs();
        const web3 = rootState.conn.web3();

        //
        // 1/4 ipfs upload Product image
        //

        const imageIpfsAddRes = await ipfsConn.add(Buffer.from(productData.image), {
          progress: (prog) => console.log(`received: ${prog}`)
        });

        if (!imageIpfsAddRes) {
          throw new Error('failed to upload Product image to ipfs');
        }

        const imageIpfsHash = imageIpfsAddRes[0].hash;


        //
        // 2/4 ipfs upload Product object
        //

        const contentObj = {
          name: productData.name,
          description: productData.description,
          image: imageIpfsHash,
        };

        const contentIpfsAddRes = (await ipfsConn.add([Buffer.from(JSON.stringify(contentObj))], {
          progress: (prog) => console.log(`received: ${prog}`)
        }));

        if (!contentIpfsAddRes) {
          throw new Error('failed to upload Product content to ipfs');
        }

        const contentIpfsHash = contentIpfsAddRes[0].hash;

        //
        // 3/4 ipfs pint both image + content
        //

        await ipfsConn.pin.add(imageIpfsHash);
        await ipfsConn.pin.add(contentIpfsHash);

        //
        // 4/4 ethereum call Products.addProduct(contentHash)
        //
        const tx = await productsContract.addProduct(
          productData.storeId.toString(), // store id
          getBytes32FromIpfsHash(contentIpfsHash), // content hash
          web3.utils.toWei(productData.price.toString()),
          productData.quantity.toString(),
          { from: rootState.conn.currentAddress },
        );

        commit(types.CREATE_PRODUCT_SUCCESS);
      } catch (err) {
        Notification.showError(err);
        console.log(err);
        commit(types.CREATE_PRODUCT_ERROR, err);
      }
    },

    //
    //
    // Setters
    //
    //

    async purchaseProduct({ rootState, state, commit }, { productId, price, quantity }) {
      commit(types.PURCHASE_PRODUCT_START);
      try {
        const web3 = rootState.conn.web3();
        const productIdBN = web3.utils.toBN(productId);
        const priceWeiBN = web3.utils.toBN(web3.utils.toWei(price));
        const quantityBN = web3.utils.toBN(quantity);

        const productsInstance = state.contractInstance();

        const tx = await productsInstance.purchaseProduct(productId, quantity, {
          from: rootState.conn.currentAddress,
          value: quantityBN.mul(priceWeiBN),
        });

        console.log({ quantity: quantityBN.toString(), tx });

        commit(types.PURCHASE_PRODUCT_SUCCESS);
      } catch (err) {
        console.log(err);
        Notification.showError(err);
        commit(types.PURCHASE_PRODUCT_ERROR, err);
      }
    },

    async updateProduct({ rootState, state, commit }, { account, productId, newPrice, newQuantity }) {
      const productIdBN = rootState.conn.web3().utils.toBN(productId);
      const newPriceBN = newPrice && rootState.conn.web3().utils.toBN(price);
      const newQuantityBN = newQuantity && rootState.conn.web3().utils.toBN(quantity);

      let tx;

      commit(types.UPDATE_PRODUCT_START);
      try {
        if (newPriceBN && newQuantityBN) {
          tx = await state.contractInstance.updateQuantityAndPrice(productIdBN, newQuantityBN, newPriceBN);
        } else if (newPriceBN) {
          tx = await state.contractInstance.updatePrice(productIdBN, newPriceBN);
        } else if (newQuantityBN) {
          tx = await state.contractInstance.updateQuantity(productIdBN, newQuantityBN);
        }
        console.log({ txUpdateProduct: tx });
      } catch (err) {
        console.log(err);
        Notification.showError(err);
        commit(types.UPDATE_PRODUCT_ERROR);
      }
    },

    async removeProduct({ rootState, state, commit }, productId) {
      commit(types.REMOVE_PRODUCT_START);
      try {
        const productsInstance = state.contractInstance();
        const tx = await productsInstance.removeProduct(productId, {
          from: rootState.conn.currentAddress,
          gas: 200000,
        }); console.log({ txRemoveProduct: tx });
        commit(types.REMOVE_PRODUCT_SUCCESS);
      } catch (err) {
        console.log(err);
        Notification.showError(err);
        commit(types.REMOVE_PRODUCT_ERROR);
      }
    },

    //
    //
    // Getters
    //
    //

    async getProducts({ rootState, state, commit, dispatch }) {
      commit(types.FIND_PRODUCTS_START);
      const productsInstance = state.contractInstance();

      try {
        const productCountBN = await productsInstance.productIdCounter();
        if (productCountBN.eq(0)) {
          commit(types.FIND_PRODUCT_SUCCESS, []);
          // START WATCHING FOR UPDATES
          dispatch('watchNewProducts');
          return;
        }
        const productCount = parseInt(productCountBN.toString(), 10);


        const foundProducts = [];

        // TODO: add limit to fetch --> implement batching
        for (let productId = productCount; productId >= MIN_PRODUCT_ID; productId -= 1) {
          const storesInstance = rootState.stores.contractInstance();
          const ipfsConn = rootState.conn.ipfs();
          const web3 = rootState.conn.web3();
          const foundProduct = await getProductInfo(web3, ipfsConn, productsInstance, storesInstance, productId);
          if (foundProduct) {
            foundProducts.push(foundProduct);
          }
        }

        foundProducts.sort((a, b) => {
          a.createdAt - b.createdAt
        });

        commit(types.FIND_PRODUCTS_SUCCESS, foundProducts);

        // START WATCHING FOR UPDATES
        dispatch('watchNewProducts');
      } catch (err) {
        Notification.showError(err);
        console.log(err);
        commit(types.FIND_PRODUCTS_ERROR, err);
      }
    },

    //
    //
    // Getters
    //
    //

    async getProduct({ rootState, state, commit, dispatch }, { productId }) {
      commit(types.FIND_PRODUCT_START);

      try {
        const productsInstance = state.contractInstance();
        const storesInstance = rootState.stores.contractInstance();
        const ipfsConn = rootState.conn.ipfs();
        const web3 = rootState.conn.web3();
        const foundProduct = await getProductInfo(web3, ipfsConn, productsInstance, storesInstance, productId);
        if (!foundProduct) {
          throw new Error('product not found');
        }
        commit(types.FIND_PRODUCT_SUCCESS, foundProduct);
      } catch (err) {
        Notification.showError(err);
        commit(types.FIND_PRODUCT_ERROR, err);
        console.log(err);
      }
    },

    async getStoreProducts({ rootState, state, commit, dispatch }, { storeId }) {
      commit(types.FIND_STORE_PRODUCTS_START);

      const productsInstance = state.contractInstance();

      try {
        // get product count of store from ethereum
        const storeProductCountBN = await productsInstance.getStoreProductCount(storeId);
        if (storeProductCountBN.eq(0)) {
          commit(types.FIND_STORE_PRODUCTS_SUCCESS, []);
          dispatch('watchNewStoreProducts', { storeId });
          return;
        }
        const storeProductCount = parseInt(storeProductCountBN.toString(), 10);

        let foundProducts = [];

        const storesInstance = rootState.stores.contractInstance();
        const web3 = rootState.conn.web3();
        const ipfsConn = rootState.conn.ipfs();

        // loop through list of productIds owned by the store
        for (let idx = 0; idx < storeProductCount; idx += 1) {
          const productId = await productsInstance.storeIdToProductIds(storeId, idx);
          const foundProduct = await getProductInfo(web3, ipfsConn, productsInstance, storesInstance, productId);
          foundProducts.push(foundProduct);
        }

        foundProducts.sort((a, b) => a.createdAt - b.createdAt);

        dispatch('watchNewStoreProducts', { storeId });
        commit(types.FIND_STORE_PRODUCTS_SUCCESS, foundProducts);
      } catch (err) {
        console.log(err);
        Notification.showError(err);
        commit(types.FIND_STORE_PRODUCTS_ERROR, err);
      }
    },
  },
};
