/* eslint-disable no-await-in-loop, max-len, function-paren-newline */
/* eslint-disable */

import contract from 'truffle-contract';
import ipfsAPI from 'ipfs-api';
import _ from 'lodash';
import Notification from '../../notification';
import Web3 from 'web3';

export const types = {
  SET_WEB3_STATUS: 'SET_WEB3_STATUS',

  SET_IPFS_OBJECT: 'SET_IPFS_OBJECT',

  SET_WEB3_OBJECT: 'SET_WEB3_OBJECT',
  CLEAR_WEB3_OBJECT: 'CLEAR_WEB3_OBJECT',

  CLEAR_CURRENT_ACCOUNT: 'CLEAR_CURRENT_ACCOUNT',
  SET_CURRENT_ACCOUNT: 'SET_CURRENT_ACCOUNT',
};

// web3.version.getNetwork((err, netId) => {
//   switch (netId) {
//     case "1":
//       console.log('This is mainnet')
//       break
//     case "2":
//       console.log('This is the deprecated Morden test network.')
//       break
//     case "3":
//       console.log('This is the ropsten test network.')
//       break
//     case "4":
//       console.log('This is the Rinkeby test network.')
//       break
//     case "42":
//       console.log('This is the Kovan test network.')
//       break
//     default:
//       console.log('This is an unknown network.')
//   }
// })

const WEB3_INIT_INTERVAL = 1e3; // 1 sec
const WEB3_ACCOUNT_CHECK_INTERVAL = 3e3; // 3 secs

export default {
  namespaced: true,
  state: {
    currentAddress: '',
    web3status: 'not found',
    web3: null,
    ipfs: null,
  },
  getters: {
    currentAddress: state => state.currentAddress,
    web3: state => state.web3,
    ipfs: state => state.ipfs,
  },
  mutations: {
    [types.SET_IPFS_OBJECT](state, getIpfsfn) {
      state.ipfs = getIpfsfn;
    },

    [types.SET_WEB3_STATUS](state, newStatus) {
      state.web3status = newStatus;
    },
    [types.SET_WEB3_OBJECT](state, getWeb3fn) {
      state.web3 = getWeb3fn;
    },
    [types.CLEAR_WEB3_OBJECT](state) {
      state.web3 = null;
    },

    [types.SET_CURRENT_ACCOUNT](state, newCurrentAccount) {
      state.currentAddress = newCurrentAccount;
    },
    [types.CLEAR_CURRENT_ACCOUNT](state) {
      state.currentAddress = '';
    },
  },
  actions: {
    async initIpfs({ commit }) {
      const ipfs = ipfsAPI('localhost', '5001');
      const id = await ipfs.id();

      commit(types.SET_IPFS_OBJECT, () => ipfs);
    },
    initWeb3({ state, commit, dispatch }) {
      console.log('starting initWeb3');

      const watchWeb3 = setInterval(() => { console.log('reloading web3');
        if (!typeof window.web3 === 'undefined') { console.log('found NO web3');
          commit(types.SET_WEB3_STATUS, 'not found');
          commit(types.CLEAR_WEB3_OBJECT);

          dispatch('bank/unloadContract', null, { root: true });
          dispatch('users/unloadContract', null, { root: true });
          dispatch('stores/unloadContract', null, { root: true });
          dispatch('products/unloadContract', null, { root: true });

        } else { console.log('found web3');
          const web3 = new Web3(Web3.givenProvider);
          clearInterval(watchWeb3);

          commit(types.SET_WEB3_STATUS, 'found');
          commit(types.SET_WEB3_OBJECT, () => web3);

          // FOUND ACCOUNT, now gonna start changes to the account
          const watchAccount = setInterval(async () => {
            let firstWeb3Account = (await state.web3().eth.getAccounts())[0];

            if (!firstWeb3Account) { console.log('watchWeb3Account found no first web3 account, aborting');
              // found no account, must mean metamask was logged off
              clearInterval(watchAccount);
              commit(types.CLEAR_CURRENT_ACCOUNT);

              // let's start at the beginning
              dispatch('initWeb3');
              return;
            }

            firstWeb3Account = firstWeb3Account.toLowerCase();

            // account did not change
            if (firstWeb3Account === state.currentAddress) {
              return;
            }

            // account changed, need to update
            commit(types.SET_CURRENT_ACCOUNT, firstWeb3Account); console.log('web3 active account changed', { newCurrent: firstWeb3Account });

            // call loadContract
            dispatch('bank/loadContract', null, { root: true });
            dispatch('users/loadContract', null, { root: true });
            dispatch('stores/loadContract', null, { root: true });
            dispatch('products/loadContract', null, { root: true });

          }, WEB3_ACCOUNT_CHECK_INTERVAL);
        }
      }, WEB3_INIT_INTERVAL);
    },
  },
}
