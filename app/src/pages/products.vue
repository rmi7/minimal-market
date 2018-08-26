<template>
  <app-layout-full>
    <app-card contextual-style="dark">
      <div slot="body">
        <div class="row">
          <div class="content">

            <div class="topBar">
              <h1 class="pageTitle">Products 📦</h1>

              <button class="createProductButton" v-if="currentRole === 'owner'" @click="toggleCreateForm()">
                Create Product
              </button>
            </div>

            <ul v-if="foundProducts.length" class="productList">
              <router-link v-for="product in foundProducts" :to="{ name: 'Product', params: { productId: product.id } }" class="product-thumb" tag="li">
                <div class="productName">
                  <span>{{product.name}}</span>
                  <span class="productOwnedByMe" v-if="currentAddress === product.owner">MINE</span>
                </div>
                <div class="productStore"><span>{{product.storeName}}</span></div>
                <div class="productId">#{{product.id.toString()}}</div>
                <div class="productCreated"><span>{{dateFromNow(product.createdAt)}} ago</span></div>
                <div class="productPrice"><span>{{product.price.toString()}}</span></div>
                <div class="productQuantity"><span>{{product.quantity.toString()}}</span></div>
                <div class="productImage"><img :src="product.imageUrl" /></div>
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
import ModalCreateProduct from '../modals/productCreate.vue';

export default {
  name: 'app-products',
  components: {
    'app-layout-full': LayoutFull,
    'app-card': Card,
  },
  mounted() {
    this.$store.dispatch('products/getProducts');
  },
  beforeDestroy() {
    this.$store.dispatch('products/unwatchNewProducts');
  },
  computed: {
    ...mapGetters('conn', ['currentAddress']),
    ...mapGetters('users', ['currentRole']),
    ...mapGetters('products', ['foundProducts']),
  },
  methods: {
    dateFromNow(timestamp) {
      return timeFromNow(timestamp * 1000, new Date());
    },
    toggleCreateForm() {
      this.$modal.show(ModalCreateProduct, {}, {
        height: '500px',
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

    .createProductButton {
      border: 1px solid rgb(106, 106, 106);
      cursor: pointer;
      font-weight: bold;
      color: black;
      grid-column-start: 9;
      grid-column-end: 10;
      grid-row-start: 2;
      grid-row-end: 3;
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

  .productList {
    list-style-type: none;
    grid-template-rows: repeat(3, 1fr);
    grid-template-columns: repeat(3, 1fr);
    gap: 50px;
    padding:0; /* undo ul default style */
    display:grid;
  }

    .product-thumb {
      grid-column-start: auto;
      grid-row-start: auto;
      cursor: pointer;

      display: grid;
      grid-template-columns: repeat(9, 1fr);
      grid-template-rows: repeat(3, 1fr);
    }

      .productName {
        grid-column-start: 1;
        grid-column-end: 10;
        grid-row-start: 1;
        grid-row-end: 3;
        padding-left: 5px;
        font-size: 19px;
        border: 1px solid rgb(203, 203, 203);
        border-bottom: none;
        color:black;
      }
      .product-thumb:hover .productName {
        background-color: rgb(0,255,127);
        border-color: transparent;
      }
        .productName .productOwnedByMe {
          background-color: rgb(255, 130, 0);
          font-size: 15px;
          color: black;
          padding: 5px 10px;
          font-weight:bold;
          text-transform: uppercase;
          border-radius:5px;
        }

      .productId {
        grid-column-start: 1;
        grid-column-end: 10;
        grid-row-start: 1;
        grid-row-end: 1;
        padding-top:45px;
        padding-left: 5px;
        color: rgb(119, 119, 119);
      }
        .productId:before {
          padding-right:5px;
          color: black;
          font-size:16px;
          font-family:monospace;
          content: 'id';
        }

      .productCreated {
        grid-column-start: 1;
        grid-column-end: 10;
        grid-row-start: 1;
        grid-row-end: 1;
        padding-top:65px;
        padding-right: 5px;
        padding-left: 5px;
      }
        .productCreated span {
          padding-left: 5px;
          color: rgb(97, 97, 97);
        }
        .productCreated:before {
          padding-right:5px;
          color: black;
          font-size: 16px;
          font-family: monospace;
          content: 'created ⏰';
        }

      .productPrice {
        grid-column-start: 5;
        grid-column-end: 10;
        grid-row-start: 1;
        grid-row-end: 2;
        padding-top:105px;
        text-align: right;
        padding-right: 5px;
        padding-left: 5px;
      }
        .productPrice span {
          font-size:16px;
          color: rgb(97, 97, 97);
        }
        .productPrice:before {
          color: black;
          padding-right:5px;
          font-size: 16px;
          content: 'Ξ';
        }

      .productStore {
        grid-column-start: 1;
        grid-column-end: 10;
        grid-row-start: 1;
        grid-row-end: 2;
        padding-top:85px;
        padding-right: 5px;
        padding-left: 5px;
      }
        .productStore span {
          font-size:16px;
          color: rgb(119, 119, 119);
        }
        .productStore:before {
          color: black;
          font-size:16px;
          padding-right:5px;
          font-family: monospace;
          content: 'store 🏬';
        }

      .productQuantity {
        grid-column-start: 1;
        grid-column-end: 10;
        grid-row-start: 1;
        grid-row-end: 1;
        padding-top:105px;
        padding-left: 5px;
        padding-right: 10px;
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

      .product-thumb:hover .productImage {
        background: rgb(0,255,127);
        background: -moz-linear-gradient(top, rgb(0,255,127) 0%, rgba(246,246,246,1) 78%, rgba(255,255,255,1) 100%);
        background: -webkit-gradient(left top, left bottom, color-stop(0%, rgb(0,255,127)), color-stop(78%, rgba(246,246,246,1)), color-stop(100%, rgba(255,255,255,1)));
        background: -webkit-linear-gradient(top, rgb(0,255,127) 0%, rgba(246,246,246,1) 78%, rgba(255,255,255,1) 100%);
        background: -o-linear-gradient(top, rgb(0,255,127) 0%, rgba(246,246,246,1) 78%, rgba(255,255,255,1) 100%);
        background: -ms-linear-gradient(top, rgb(0,255,127) 0%, rgba(246,246,246,1) 78%, rgba(255,255,255,1) 100%);
        background: linear-gradient(to bottom, rgb(0,255,127) 0%, rgba(246,246,246,1) 78%, rgba(255,255,255,1) 100%);
        filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#00ff7f', endColorstr='#ffffff', GradientType=0 );
      }
      .productImage {
        padding-top: 7px;
        grid-column-start: 1;
        grid-column-end: 10;
        grid-row-start: 2;
        grid-row-end: 5;
        text-align:center;
      }
        .productImage img {
          max-height:90%;
          max-width: 90%;
          height: auto;

        }
</style>
