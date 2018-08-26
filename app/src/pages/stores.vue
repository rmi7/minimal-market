<template>
  <app-layout-full>
    <app-card contextual-style="dark">
      <div slot="body">
        <div class="row">
          <div class="content">

            <div class="topBar">
              <h1 class="pageTitle">Stores 🏬</h1>

              <button class="createStoreButton" v-if="currentRole === 'owner'" @click="toggleCreateForm()">
                Create Store
              </button>
            </div>

            <ul v-if="foundStores.length" class="storeList">
              <router-link v-for="store in foundStores" :to="{ name: 'Store', params: { storeId: store.id } }" class="store-thumb" tag="li">
                <div class="storeName">
                  <span>{{store.name}}</span>
                  <span class="storeOwnedByMe" v-if="currentAddress === store.owner">MINE</span>
                </div>
                <div class="storeId">#{{store.id.toString()}}</div>
                <div class="storeCreated"><span>{{dateFromNow(store.createdAt)}} ago</span></div>
                <div class="storeProductCount"><span>{{store.productCount.toString()}}</span></div>
                <div class="storeImage"><img :src="store.imageUrl" /></div>
              </router-link>
            </ul>

          </div>
        </div>
      </div>
    </app-card>
  </app-layout-full>
</template>

<script>
import { mapGetters } from 'vuex';
import timeFromNow from 'date-fns/distance_in_words_strict';
import LayoutFull from '../layout/full.vue';
import Card from '../components/card.vue';
import ModalCreateStore from '../modals/storeCreate.vue';
import Notification from '../notification';

export default {
  name: 'app-stores',
  components: {
    'app-layout-full': LayoutFull,
    'app-card': Card,
  },
  mounted() {
    this.$store.dispatch('stores/getStores'); // will dispatch watchStores after getStores
  },
  beforeDestroy() {
    this.$store.dispatch('stores/unwatchNewStores');
  },
  computed: {
    ...mapGetters('conn', ['currentAddress']),
    ...mapGetters('users', ['currentRole']),
    ...mapGetters('stores', ['foundStores', 'createStoreStatus']),
  },
  watch: {
    createStoreStatus(newStatus) {
      if (newStatus === 'success') {
        Notification.showSuccess('Created Store');
      }
    },
  },
  methods: {
    dateFromNow(timestamp) {
      return timeFromNow(timestamp * 1000, new Date());
    },
    toggleCreateForm() {
      this.$modal.show(ModalCreateStore, {}, {
        height: '400px',
        width: '500px',
      });
    },
  },
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}
.content {
  width:90%;
  margin: 0 auto;
}

  .topBar {
    display:grid;
    grid-template-columns: repeat(9, 1fr);
    grid-template-rows: repeat(3, 1fr);
  }

    .pageTitle {
      grid-column-start: 1;
      grid-column-end: 9;
      grid-row-start: 2;
      grid-row-end: 3;
    }

    .createStoreButton {
      border: 1px solid rgb(106, 106, 106);
      cursor: pointer;
      font-weight: bold;
      color: black;
      grid-column-start: 9;
      grid-column-end: 10;
      grid-row-start: 2;
      grid-row-end: 3;
    }
    .createStoreButton:disabled {
      border: 1px solid rgb(212, 212, 212);
      color: rgb(212, 212, 212);
      cursor:default;
    }
    .createStoreButton:hover {
      background-color: black;
      color: white;
    }

  .storeList {
    list-style-type: none;
    grid-template-rows: repeat(3, 1fr);
    grid-template-columns: repeat(3, 1fr);
    gap: 50px;
    padding:0; /* undo ul default style */
    display:grid;
  }

    .store-thumb {
      grid-column-start: auto;
      grid-row-start: auto;
      cursor: pointer;

      display: grid;
      grid-template-columns: repeat(9, 1fr);
      grid-template-rows: repeat(3, 1fr);
    }

      .storeName {
        grid-column-start: 1;
        grid-column-end: 10;
        grid-row-start: 1;
        grid-row-end: 3;
        padding-left: 5px;
        border: 1px solid rgb(203, 203, 203);
        border-bottom: none;
        font-size:19px;
        color:black;
      }
      .store-thumb:hover .storeName {
        background-color: rgb(0,255,127);
        border-color: transparent;
      }
        .storeName .storeOwnedByMe {
          background-color: rgb(255, 130, 0);
          font-size: 15px;
          color: black;
          padding: 5px 10px;
          font-weight:bold;
          text-transform: uppercase;
          border-radius:5px;
        }

      .storeId {
        grid-column-start: 1;
        grid-column-end: 10;
        grid-row-start: 1;
        grid-row-end: 1;
        padding-top:45px;
        padding-left: 5px;
        color: rgb(119, 119, 119);
      }
        .storeId:before {
          padding-right:5px;
          color: black;
          font-size:16px;
          font-family:monospace;
          content: 'id';
        }

      .storeCreated {
        grid-column-start: 1;
        grid-column-end: 10;
        grid-row-start: 1;
        grid-row-end: 1;
        padding-top:65px;
        padding-right: 5px;
        padding-left: 5px;
      }
        .storeCreated span {
          color: rgb(119, 119, 119);
        }
        .storeCreated:before {
          padding-right:5px;
          color: black;
          font-size:16px;
          font-family:monospace;
          content: 'created ⏰';
        }

      .storeProductCount {
        grid-column-start: 1;
        grid-column-end: 10;
        grid-row-start: 1;
        grid-row-end: 1;
        padding-top:85px;
        padding-left: 5px;
        padding-right: 5px;
      }
        .storeProductCount span {
          color: rgb(119, 119, 119);
        }
        .storeProductCount:before {
          min-width:300px;
          color: black;
          padding-right:5px;
          font-size:16px;
          font-family:monospace;
          content: 'products 📦';
        }

      .store-thumb:hover .storeImage {
        background: rgb(0,255,127);
        background: -moz-linear-gradient(top, rgb(0,255,127) 0%, rgba(246,246,246,1) 78%, rgba(255,255,255,1) 100%);
        background: -webkit-gradient(left top, left bottom, color-stop(0%, rgb(0,255,127)), color-stop(78%, rgba(246,246,246,1)), color-stop(100%, rgba(255,255,255,1)));
        background: -webkit-linear-gradient(top, rgb(0,255,127) 0%, rgba(246,246,246,1) 78%, rgba(255,255,255,1) 100%);
        background: -o-linear-gradient(top, rgb(0,255,127) 0%, rgba(246,246,246,1) 78%, rgba(255,255,255,1) 100%);
        background: -ms-linear-gradient(top, rgb(0,255,127) 0%, rgba(246,246,246,1) 78%, rgba(255,255,255,1) 100%);
        background: linear-gradient(to bottom, rgb(0,255,127) 0%, rgba(246,246,246,1) 78%, rgba(255,255,255,1) 100%);
        filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#00ff7f', endColorstr='#ffffff', GradientType=0 );
      }
      .storeImage {
        padding-top: 7px;
        grid-column-start: 1;
        grid-column-end: 10;
        grid-row-start: 2;
        grid-row-end: 5;
        text-align:center;
      }
        .storeImage img {
          max-height:90%;
          max-width: 90%;
          height: auto;

        }
</style>
