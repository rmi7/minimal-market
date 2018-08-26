<template>
  <div class="nav-wrapper">
    <div class="container">
      <nav class="navbar navbar-expand-lg navbar-light">

        <button class="navbar-toggler" type="button" @click="menuCollapse">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse lessnavbar" :class="{ show : menuCollapsed}">
          <ul class="navbar-nav mr-auto">
            <router-link :to="{ name: 'Owners' }" active-class="active" class="nav-item" tag="li">
              <a class="nav-link">
                Owners
              </a>
            </router-link>
            <router-link :to="{ name: 'Stores' }" active-class="active" class="nav-item" tag="li">
              <a class="nav-link">
                Stores
              </a>
            </router-link>
            <router-link :to="{ name: 'Products' }" active-class="active" class="nav-item" tag="li">
              <a class="nav-link">
                Products
              </a>
            </router-link>

            <button class="withdrawBox" :disabled="!withdrawAmount || withdrawAmount ==='0'" v-if="withdrawAmount" @click="withdrawFunds()">
              <label>withdraw</label>
              <span>{{withdrawAmount}} Ξ</span>
            </button>
          </ul>

          <span class="navbar-text ml-5">
            <div class="m-3">
              Account: <span class="myAddress">{{currentAddress}}</span>
            </div>
          </span>

          <span class="navbar-text ml-5">
            <div class="m-3">
              Role: <span class="myRole">{{currentRole}}</span>
            </div>
          </span>
        </div>
      </nav>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'app-navbar',
  mounted() {
    this.$store.dispatch('bank/getWithdrawAmount');
  },
  computed: {
    ...mapGetters('bank', ['withdrawAmount']),
    ...mapGetters('conn', ['currentAddress']),
    ...mapGetters('users', ['currentRole']),
    ...mapGetters('ui', ['menuCollapsed']),
  },
  methods: {
    menuCollapse() {
      this.$store.dispatch('ui/collapseMenu');
    },
    ...mapActions('bank', ['withdrawFunds']),
  },
};
</script>

<style scoped>


.nav-item.active {
  background-color: rgb(0,255,127);
  font-weight:bold;
}
.nav-item:hover {
  background-color: rgb(0,255,127);
}

.myAddress {
  background-color: #3e00ff;
  font-size: 15px;
  color: white;
  padding: 5px 10px;
  border-radius:5px;
}
.myRole {
  background-color: rgb(255, 130, 0);
  font-size: 15px;
  color: black;
  padding: 5px 10px;
  font-weight:bold;
  text-transform: uppercase;
  border-radius:5px;
}
.withdrawBox {
  border: 1px solid rgb(106, 106, 106);
  cursor: pointer;
  font-weight: bold;
  color: black;
  min-width:65%;
  display:flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-left:20px;
}
.withdrawBox:enabled {
  cursor: pointer;
}
.withdrawBox:disabled {
  border: 1px solid rgb(212, 212, 212);
  color: rgb(212, 212, 212);
  cursor:default;
}
.withdrawBox:hover:enabled {
  background-color: black;
  color: white;
}
  .withdrawBox label {
    flex:2;
    text-align:left;
    margin-bottom:0;
  }
  .withdrawBox:enabled label {
    cursor: pointer;
  }
  .withdrawBox span {
    flex: 1;
    text-align:right;
  }
  .withdrawBox:enabled label {
    cursor: pointer;
  }

</style>
