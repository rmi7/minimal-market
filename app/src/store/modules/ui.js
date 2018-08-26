export const types = {
  TOGGLE_MENU_COLLAPSE: 'TOGGLE_MENU_COLLAPSE',
};

export default {
  namespaced: true,
  mutations: {
    [types.TOGGLE_MENU_COLLAPSE](state) {
      state.menuCollapsed = !state.menuCollapsed;
    },
  },
  state: {
    menuCollapsed: false,
  },
  getters: {
    menuCollapsed: state => state.menuCollapsed,
  },
  actions: {
    collapseMenu({ commit }) {
      commit(types.TOGGLE_MENU_COLLAPSE);
    },
  },
};
