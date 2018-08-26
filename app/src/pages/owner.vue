<template>
  <app-layout-full>
    <app-card contextual-style="dark">
      <div slot="body">
        <div class="row">
          <div class="content">

            <div class="topBar">
              <h1 class="pageTitle">
                Owner
                <span :class="{ isMe: foundOwner && currentAddress === foundOwner.address }"></span>
              </h1>
              <button class="removeOwnerButton" v-if="currentRole === 'admin'" @click="removeOwner(ownerAddr)">
                Remove Owner
              </button>
            </div>

            <div v-if="foundOwner" class="ownerContentBox">
              <div class="ownerAddr">
                <span>{{foundOwner.address}}</span>
              </div>
              <div class="ownerNumStores">
                <span>
                  {{foundOwner.numStores}}
                </span>
              </div>

              <div class="ownerNumProducts">
                <span>
                  {{foundOwner.numProducts}}
                </span>
              </div>

              <div v-if="foundOwnerStores.length" class="ownerStoresTitle">
                <h1>Stores ({{foundOwnerStores.length}})</h1>
              </div>

              <ul v-if="foundOwnerStores.length" class="ownerStoresBox">
                <router-link
                  v-for="store in foundOwnerStores"
                  :to="{ name: 'Store', params: { storeId: store.id } }"
                  class="store-thumb"
                  tag="li"
                >
                  <div class="storeName">
                    <span>
                      {{store.name}}
                    </span>
                  </div>

                  <div class="storeCreated">
                    <span>
                      {{dateFromNow(store.createdAt)}} ago
                    </span>
                  </div>

                  <div class="storeProductCount">
                    <span>
                      {{store.productCount.toString()}}
                    </span>
                  </div>


                  <div class="storeImage">
                    <span>
                      <img :src="store.imageUrl" />
                    </span>
                  </div>
                </router-link>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </app-card>
  </app-layout-full>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import timeFromNow from 'date-fns/distance_in_words_strict';
import LayoutFull from '../layout/full.vue';
import Card from '../components/card.vue';
import Notification from '../notification';

export default {
  name: 'app-owner',
  components: {
    'app-layout-full': LayoutFull,
    'app-card': Card,
  },
  mounted() {
    this.$store.dispatch('users/getOwner', { ownerAddr: this.$route.params.ownerAddr });
    this.$store.dispatch('stores/getOwnerStores', { ownerAddr: this.$route.params.ownerAddr });
  },
  computed: {
    ...mapGetters('conn', ['currentAddress']),
    ...mapGetters('users', ['currentRole', 'foundOwner', 'removeOwnerStatus']),
    ...mapGetters('stores', ['foundOwnerStores']),
    ownerAddr() {
      return this.$route.params.ownerAddr;
    },
  },
  watch: {
    removeOwnerStatus(newStatus) {
      if (newStatus === 'success') {
        Notification.showSuccess('Removed Owner');
        // go back to Store page of store product belonged too
        this.$router.push({ name: 'Owners' });
      }
    },
  },
  methods: {
    dateFromNow(timestamp) {
      return timeFromNow(timestamp * 1000, new Date());
    },
    ...mapActions('users', ['removeOwner']),
  },
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}
.content {
  width:100%;
}
  /*
    Top Bar
  */
  .topBar {
    display:grid;
    grid-template-columns: repeat(9, 1fr);
    grid-template-rows: repeat(3, 1fr);
  }
    /* page title */
    .pageTitle {
      grid-column-start: 1;
      grid-column-end: 9;
      grid-row-start: 2;
      grid-row-end: 3;
    }

    .pageTitle span.isMe:after {
      content: "IS ME";
      flex:1;
      background-color: rgb(255, 130, 0);
      font-size: 30px;
      color: black;
      margin-left:20px;
      padding: 5px 10px;
      font-weight:bold;
      text-transform: uppercase;
      border-radius:5px;
    }

    /* possibly remove store form open button */
    .removeOwnerButton {
      border: 1px solid rgb(106, 106, 106);
      cursor: pointer;
      font-weight: bold;
      color: black;
      grid-column-start: 9;
      grid-column-end: 10;
      grid-row-start: 2;
      grid-row-end: 3;
    }
    .removeOwnerButton:disabled {
      border: 1px solid rgb(212, 212, 212);
      color: rgb(212, 212, 212);
      cursor:default;
    }
    .removeOwnerButton:hover {
      background-color: black;
      color: white;
    }

  /*
    Owner Content box
  */
  .ownerContentBox {
    display:grid;
    grid-template-columns: repeat(9, 1fr);
    grid-template-rows: repeat(9, 100px);
    /* background-color: red; */
  }

    /* store name box */
    .ownerAddr {
      /* background-color: green; */
      grid-column-start: 1;
      grid-column-end: 5;
      grid-row-start: 1;
      grid-row-end: 2;
      text-align: center;
      display:flex;
      align-items:flex-end;
      justify-content: center;
      font-family:monospace;
    }
      .ownerAddr span {
        flex: 5;
        font-size: 23px;
      }


    /* owner created time box */
    .ownerNumStores {
      grid-column-start: 1;
      grid-column-end: 5;
      grid-row-start: 2;
      grid-row-end: 3;
      text-align: center;
      display:flex;
      align-items:flex-end;
      justify-content: center;
      font-size:30px;
    }
    .ownerNumStores:before {
      padding-right:5px;
      color: black;
      font-family: monospace;
      content: 'stores 🏬';
      margin-right: 10px;
    }

    /* owner created time box */
    .ownerNumProducts {
      grid-column-start: 1;
      grid-column-end: 5;
      grid-row-start: 3;
      grid-row-end: 4;
      text-align: center;
      display:flex;
      align-items:start;
      justify-content: center;
      font-size: 30px;
    }
    .ownerNumProducts:before {
      padding-right:5px;
      color: black;
      font-family: monospace;
      content: 'products 📦';
      margin-right: 10px;
    }

    /* products title */
    .ownerStoresTitle {
      grid-column-start: 1;
      grid-column-end: 5;
      grid-row-start: 6;
      grid-row-end: 7;
    }
    /*
      Owner Stores box
    */
    .ownerStoresBox {
      /* background-color: white; */
      padding: 0; /* to undo the ul defaylt style */
      grid-column-start: 5;
      grid-column-end: 10;
      grid-row-start: 6;
      grid-row-end: 10;

      display:inline-block;

      /* set up for vertical scrollable store-thumb feed, newest first */
      /* flex-direction: column;
      justify-content: flex-start;
      align-items: stretch; */
      overflow-y: visible;
    }
      /*
        a single product thumb
      */
      .store-thumb {
        box-sizing: border-box;
        flex: 1;
        cursor: pointer;
        margin-bottom:50px;
        min-height:100px;
        max-height:200px;
        /* height:300px; */
        display: grid;
        grid-template-columns: repeat(9, 1fr);
        grid-template-rows: repeat(9, 1fr);
        border-top: 1px solid rgb(147, 147, 147);
      }
      .store-thumb:hover {
        border-color: transparent;
        background: rgb(0,255,127);
        background: -moz-linear-gradient(top, rgb(0,255,127) 0%, rgba(246,246,246,1) 78%, rgba(255,255,255,1) 100%);
        background: -webkit-gradient(left top, left bottom, color-stop(0%, rgb(0,255,127)), color-stop(78%, rgba(246,246,246,1)), color-stop(100%, rgba(255,255,255,1)));
        background: -webkit-linear-gradient(top, rgb(0,255,127) 0%, rgba(246,246,246,1) 78%, rgba(255,255,255,1) 100%);
        background: -o-linear-gradient(top, rgb(0,255,127) 0%, rgba(246,246,246,1) 78%, rgba(255,255,255,1) 100%);
        background: -ms-linear-gradient(top, rgb(0,255,127) 0%, rgba(246,246,246,1) 78%, rgba(255,255,255,1) 100%);
        background: linear-gradient(to bottom, rgb(0,255,127) 0%, rgba(246,246,246,1) 78%, rgba(255,255,255,1) 100%);
        filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#fd5f00', endColorstr='#ffffff', GradientType=0 );
      }

        .storeName {
          grid-column-start: 1;
          grid-column-end: 5;
          grid-row-start: 1;
          grid-row-end: 2;
          display: flex;
          padding-top:7px;
          padding-right:7px;
        }
          .storeName span {
            flex: 1;
            font-size: 20px;
          }

        .storeCreated {
          grid-column-start: 1;
          grid-column-end: 5;
          grid-row-start: 2;
          grid-row-end: 3;
          padding-top:7px;
          padding-right:7px;
        }
          .storeCreated span {
            flex: 1;
          }
          .storeCreated span:before {
            padding-right:5px;
            color: black;
            font-size:16px;
            font-family:monospace;
            content: 'created ⏰';
          }

        .storeProductCount {
          grid-column-start: 1;
          grid-column-end: 5;
          grid-row-start: 3;
          grid-row-end: 3;
          padding-top:7px;
          padding-right:7px;
        }
          .storeProductCount span {
            flex: 1;
          }
          .storeProductCount span:before {
            /* min-width:300px; */
            color: black;
            padding-right:5px;
            font-size:16px;
            font-family:monospace;
            content: 'products 📦';
          }

        .storeImage {
          padding-top: 7px;
          grid-column-start: 5;
          grid-column-end: 10;
          grid-row-start: 1;
          grid-row-end: 10;
          text-align:center;
        }
          .storeImage span {
            flex: 1;
          }
            .storeImage span img {
              max-height:100%;
              transition: all .2s linear;
              max-width: 100%;
              height: auto;
            }
</style>
