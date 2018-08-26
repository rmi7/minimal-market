<template>
  <app-layout-full>
    <app-card contextual-style="dark">
      <div slot="body">
        <div class="row">
          <div class="content">

            <div class="topBar">
              <h1 class="pageTitle">
                Store 🏬
                <span :class="{ storeOwnedByMe: foundStore && currentAddress === foundStore.owner }">{{ storeId }}</span>
              </h1>

              <button class="createProductButton" v-if="ownsThisStore" @click="toggleCreateProductForm()">
                Create Product
              </button>

              <!-- <button class="updateStoreButton" v-if="ownsThisStore" @click="toggleUpdateForm()">
                Update
              </button> -->

              <button class="removeStoreButton" v-if="ownsThisStore" :disabled="stillHasProducts" @click="removeStore(foundStore.id)">
                Remove
              </button>
            </div>

            <div v-if="foundStore" class="storeContentBox">
              <div class="storeName">
                <span>
                  {{foundStore.name}}
                </span>
              </div>

              <div class="storeOwner">
                <span>
                  <router-link
                    :to="{ name: 'Owner', params: { ownerAddr: foundStore.owner } }"
                    tag="a"
                  >
                    {{foundStore.owner}}
                  </router-link>
                </span>
              </div>

              <div class="storeCreated">
                <span>
                  {{dateFromNow(foundStore.createdAt)}} ago
                </span>
              </div>

              <div class="storeProductCount">
                <span>
                  {{foundStore.productCount.toString()}}
                </span>
              </div>


              <div class="storeImage">
                <span>
                  <img :src="foundStore.imageUrl" />
                </span>
              </div>

              <div class="storeDescription">
                <span>
                  {{foundStore.description}}
                </span>
              </div>

              <div v-if="foundStoreProducts" class="storeProductsTitle">
                <h1>Products ({{foundStoreProducts.length}})</h1>
              </div>

              <ul v-if="foundStoreProducts" class="storeProductsBox">
                <router-link
                  v-for="product in foundStoreProducts"
                  :to="{ name: 'Product', params: { productId: product.id } }"
                  class="product-thumb"
                  tag="li"
                >
                  <div class="productId">#{{product.id}}</div>
                  <div class="productName"><span>{{product.name}}</span></div>
                  <div class="productCreated"><span>{{dateFromNow(product.createdAt)}} ago</span></div>
                  <div class="productQuantity"><span>{{product.quantity.toString()}}</span></div>
                  <div class="productPrice"><span>{{product.price}} Ξ</span></div>
                  <div class="productImage"><span><img :src="product.imageUrl" /></span></div>
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
// import ModalUpdateStore from '../modals/storeUpdate.vue';
import ModalCreateProduct from '../modals/productCreate.vue';
import Notification from '../notification';

export default {
  name: 'app-store',
  components: {
    'app-layout-full': LayoutFull,
    'app-card': Card,
  },
  mounted() {
    this.$store.dispatch('stores/getStore', { storeId: this.$route.params.storeId });
    this.$store.dispatch('products/getStoreProducts', { storeId: this.$route.params.storeId });
  },
  beforeDestroy() {
    this.$store.dispatch('products/unwatchNewStoreProducts');
  },
  computed: {
    ...mapGetters('conn', ['currentAddress']),
    ...mapGetters('stores', ['foundStore', 'removeStoreStatus']),
    storeId() {
      return this.$route.params.storeId;
    },
    ownsThisStore() {
      return this.currentAddress &&
        this.foundStore &&
        this.foundStore.owner === this.currentAddress;
    },
    stillHasProducts() {
      return this.foundStore && this.foundStore.productCount.toNumber() > 0;
    },
    ...mapGetters('products', ['foundStoreProducts']),
  },
  watch: {
    removeStoreStatus(newStatus) {
      if (newStatus === 'success') {
        Notification.showSuccess(`Removed Store: ${this.foundStore.name}`);
        // go back to Products page, this page no longer exists, Product was removed
        this.$router.replace({ name: 'Stores' });
      }
    },
  },
  methods: {
    dateFromNow(timestamp) {
      return timeFromNow(timestamp * 1000, new Date());
    },

    // // updating/removing by owner
    // toggleUpdateForm() {
    //   this.$modal.show(ModalUpdateStore, {}, {
    //     height: '400px',
    //     width: '500px',
    //   });
    // },

    // updating/removing by owner
    toggleCreateProductForm() {
      this.$modal.show(ModalCreateProduct, {
        preSetStoreId: this.foundStore.id,
      }, {
        height: '500px',
        width: '500px',
      });
    },

    ...mapActions('stores', ['removeStore']),
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
      .pageTitle span {
        padding-left:10px;
        font-weight: normal;
      }
      .pageTitle span:before {
        content: "#";
        color: rgb(96, 96, 96);
      }

      .pageTitle span.storeOwnedByMe:after {
        content: "MINE";
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

    /* possibly update store form open button */
    .createProductButton {
      border: 1px solid rgb(106, 106, 106);
      cursor: pointer;
      font-weight: bold;
      color: black;
      grid-column-start: 8;
      grid-column-end: 9;
      grid-row-start: 2;
      grid-row-end: 3;
      margin-right:10px;
    }
    .createProductButton:disabled {
      border: 1px solid rgb(212, 212, 212);
      color: rgb(212, 212, 212);
      cursor:default;
    }
    .createProductButton:hover {
      background-color: black;
      color: white;
    }

    /* possibly update store form open button */
    .updateStoreButton {
      border: 1px solid rgb(106, 106, 106);
      cursor: pointer;
      font-weight: bold;
      color: black;
      grid-column-start: 9;
      grid-column-end: 10;
      grid-row-start: 2;
      grid-row-end: 3;
    }
    .updateStoreButton:disabled {
      border: 1px solid rgb(212, 212, 212);
      color: rgb(212, 212, 212);
      cursor:default;
    }
    .updateStoreButton:hover {
      background-color: black;
      color: white;
    }

    /* possibly remove store form open button */
    .removeStoreButton {
      border: 1px solid rgb(106, 106, 106);
      cursor: pointer;
      font-weight: bold;
      color: black;
      grid-column-start: 9;
      grid-column-end: 10;
      grid-row-start: 2;
      grid-row-end: 3;
    }
    .removeStoreButton:disabled {
      border: 1px solid rgb(212, 212, 212);
      color: rgb(212, 212, 212);
      cursor:default;
    }
    .removeStoreButton:hover:enabled {
      background-color: black;
      color: white;
    }

  /*
    Store Content box
  */
  .storeContentBox {
    display:grid;
    grid-template-columns: repeat(9, 1fr);
    grid-template-rows: repeat(9, 100px);
    /* background-color: red; */
  }

    /* store name box */
    .storeName {
      /* background-color: green; */
      grid-column-start: 1;
      grid-column-end: 5;
      grid-row-start: 1;
      grid-row-end: 2;
      text-align: center;
      display:flex;
      align-items:flex-end;
      justify-content: center;
    }
      .storeName span {
        flex: 5;
        font-size: 30px;
      }
      .storeName.storeOwnedByMe span:after {
        content: "MINE";
        flex:1;
        /* background-color: rgb(244, 133, 17); */
        background-color: rgb(255, 130, 0);
        font-size: 30px;
        color: black;
        padding: 5px 10px;
        font-weight:bold;
        text-transform: uppercase;
        border-radius:5px;
      }

    .storeOwner {
      grid-column-start: 1;
      grid-column-end: 5;
      grid-row-start: 2;
      grid-row-end: 3;
      text-align: center;
      display:flex;
      align-items:start;
      justify-content: center;
    }
      .storeOwner span {
        flex: 1;
        padding-top: 30px;
      }
      .storeOwner span:before {
        padding-right:5px;
        color: black;
        font-size:16px;
        font-family:monospace;
        content: 'owner 🎩';
      }

    /* store created time box */
    .storeCreated {
      /* background-color: blue; */
      grid-column-start: 1;
      grid-column-end: 5;
      grid-row-start: 2;
      grid-row-end: 3;
      text-align: center;
      display:flex;
      align-items:start;
      justify-content: center;
    }
      .storeCreated span {
        flex: 1;
        padding-top: 50px;
      }
      .storeCreated span:before {
        padding-right:5px;
        color: black;
        font-size:16px;
        font-family:monospace;
        content: 'created ⏰';
      }

    .storeProductCount {
      /* background-color: blue; */
      grid-column-start: 1;
      grid-column-end: 5;
      grid-row-start: 2;
      grid-row-end: 3;
      text-align: center;
      display:flex;
      align-items:start;
      justify-content: center;
    }
      .storeProductCount span {
        flex: 1;
        padding-top: 70px;
      }
      .storeProductCount span:before {
        /* min-width:300px; */
        color: black;
        padding-right:5px;
        font-size:16px;
        font-family:monospace;
        content: 'products 📦';
      }

    /* store description box */
    .storeDescription {
      border-bottom: 1px solid rgb(203, 203, 203);
      /* background-color: orange; */
      grid-column-start: 1;
      grid-column-end: 5;
      grid-row-start: 3;
      grid-row-end: 5;
      text-align: center;
      display:flex;
      align-items:start;
      justify-content: center;
    }
      .storeDescription span {
        flex: 1;
        font-size: 20px;
      }

    /* store image box */
    .storeImage {
      border-left: 1px solid rgb(203, 203, 203);
      border-bottom: 1px solid rgb(203, 203, 203);
      /* background-color: yellow; */
      padding-top: 7px;
      grid-column-start: 5;
      grid-column-end: 10;
      grid-row-start: 1;
      grid-row-end: 5;
      text-align:center;
      display:flex;
      align-items:center;
      justify-content: center;
    }
      .storeImage span {
        flex: 1;
        width:100%;
        height:100%;
      }
        .storeImage span img {
          transition: all .2s linear;
          max-width: 90%;
          max-height: 90%;
          height: auto;
        }

    .storeProductsTitle {
      grid-column-start: 1;
      grid-column-end: 5;
      grid-row-start: 6;
      grid-row-end: 7;
    }

    /*
      Store Products box
    */
    .storeProductsBox {
      padding: 0; /* to undo the ul defaylt style */
      grid-column-start: 5;
      grid-column-end: 10;
      grid-row-start: 6;
      grid-row-end: 10;
      display:inline-block;
      overflow-y: visible;
    }

      /*
        a single product thumb
      */
      .product-thumb {
        box-sizing: border-box;
        flex: 1;
        cursor: pointer;
        margin-bottom:50px;
        min-height:100px;
        max-height:200px;
        display: grid;
        grid-template-columns: repeat(9, 1fr);
        grid-template-rows: repeat(9, 1fr);
        border-top: 1px solid rgb(203, 203, 203);
      }
      .product-thumb:hover {
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


        .productName {
          grid-column-start: 1;
          grid-column-end: 5;
          grid-row-start: 1;
          grid-row-end: 2;
          display: flex;
          padding-top:7px;
          padding-right:7px;
        }
          .productName span {
            flex: 1;
            font-size: 20px;
          }
        .productId {
          grid-column-start: 1;
          grid-column-end: 10;
          grid-row-start: 2;
          grid-row-end: 3;
          padding-top:45px;
          color: rgb(119, 119, 119);
        }
          .productId:before {
            padding-right:7px;
            color: black;
            font-size:16px;
            font-family:monospace;
            content: 'id';
          }
        .productCreated {
          grid-column-start: 1;
          grid-column-end: 5;
          grid-row-start: 3;
          grid-row-end: 4;
          padding-top:7px;
          padding-right:7px;
        }
          .productCreated span {
            flex: 1;
            color: rgb(97, 97, 97);
          }
          .productCreated span:before {
            padding-right:5px;
            color: black;
            font-size: 16px;
            font-family: monospace;
            content: 'created ⏰';
          }

        .productPrice {
          grid-column-start: 1;
          grid-column-end: 5;
          grid-row-start: 4;
          grid-row-end: 4;
          padding-top:7px;
          padding-right:7px;
        }
          .productPrice span {
            flex: 1;
            color: rgb(97, 97, 97);
          }
          .productPrice span:before {
            padding-right:5px;
            color: black;
            font-size: 16px;
            font-family: monospace;
            content: 'price 💵';
          }

        .productQuantity {
          grid-column-start: 1;
          grid-column-end: 5;
          grid-row-start: 5;
          grid-row-end: 5;
          padding-top:7px;
          padding-right: 7px;
        }
          .productQuantity span {
            padding-left: 5px;
            color: rgb(119, 119, 119);
          }
          .productQuantity:before {
            min-width:300px;
            color: black;
            font-family: monospace;
            font-size: 16px;
            content: 'quantity 📉';
          }

        .productImage {
          padding-top: 7px;
          grid-column-start: 5;
          grid-column-end: 10;
          grid-row-start: 1;
          grid-row-end: 10;
          text-align:center;
        }
          .productImage span {
            flex: 1;
          }
            .productImage span img {
              max-height:100%;
              transition: all .2s linear;
              max-width: 100%;
              height: auto;
            }


</style>
