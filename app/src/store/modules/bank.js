/* eslint-disable no-await-in-loop, max-len, function-paren-newline */
/* eslint-disable */
import contract from 'truffle-contract';
import _ from 'lodash';
import Notification from '../../notification';
import BankArtifact from '../../../../build/contracts/Bank.json';

export const types = {
  SET_CONTRACT_INSTANCE: 'SET_CONTRACT_INSTANCE',
  CLEAR_CONTRACT_INSTANCE: 'CLEAR_CONTRACT_INSTANCE',

  GET_WITDHRAW_AMOUNT_START: 'GET_WITDHRAW_AMOUNT_START',
  GET_WITDHRAW_AMOUNT_SUCCESS: 'GET_WITDHRAW_AMOUNT_SUCCESS',
  GET_WITDHRAW_AMOUNT_ERROR: 'GET_WITDHRAW_AMOUNT_ERROR',

  WITDHRAW_FUNDS_START: 'WITDHRAW_FUNDS_START',
  WITDHRAW_FUNDS_SUCCESS: 'WITDHRAW_FUNDS_SUCCESS',
  WITDHRAW_FUNDS_ERROR: 'WITDHRAW_FUNDS_ERROR',
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
    // Setters
    //

    withdrawFundsStatus: '',

    //
    // Getters
    //

    withdrawAmount: 0,
    withdrawAmountStatus: '',
  },
  getters: {
    contractIsLoaded: state => state.contractIsLoaded,
    withdrawAmount: state => state.withdrawAmount,
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
    // Setters
    //
    [types.WITDHRAW_FUNDS_START](state) {
      state.withdrawFundsStatus = 'loading';
    },
    [types.WITDHRAW_FUNDS_SUCCESS](state) {
      state.withdrawFundsStatus = 'mined';
    },
    [types.WITDHRAW_FUNDS_ERROR](state, error) {
      state.withdrawFundsStatus = '';
    },

    //
    // Getters
    //
    [types.GET_WITDHRAW_AMOUNT_START](state) {
      state.withdrawAmountStatus = 'loading';
    },
    [types.GET_WITDHRAW_AMOUNT_SUCCESS](state, foundWithdrawAmount) {
      state.withdrawAmountStatus = 'success';
      state.withdrawAmount = foundWithdrawAmount.toString();
    },
    [types.GET_WITDHRAW_AMOUNT_ERROR](state, error) {
      state.withdrawAmountStatus = '';
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
        const contractInstance = contract(BankArtifact);

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
    // Setters
    //
    //

    async withdrawFunds({ rootState, state, commit }) {
      commit(types.WITDHRAW_FUNDS_START);

      try {
        const bankInstance = state.contractInstance();
        await bankInstance.withdraw({
          from: rootState.conn.currentAddress,
          gas: 2e5,
        });
        commit(types.WITDHRAW_FUNDS_SUCCESS);
      } catch (err) {
        Notification.showError(err);
        console.log(err);
        commit(types.WITDHRAW_FUNDS_ERROR, { err });
      }
    },

    //
    //
    // Getters
    //
    //

    async getWithdrawAmount({ rootState, state, commit }) {
      commit(types.GET_WITDHRAW_AMOUNT_START);

      const web3 = rootState.conn.web3();

      try {
        const bankInstance = state.contractInstance();
        const withdrawAmount = await bankInstance.addressToBalance(rootState.conn.currentAddress);
        commit(types.GET_WITDHRAW_AMOUNT_SUCCESS, web3.utils.fromWei(withdrawAmount.toString()));
      } catch (err) {
        Notification.showError(err);
        console.log(err);
        commit(types.GET_WITDHRAW_AMOUNT_ERROR, err);
      }
    },
  },
};
