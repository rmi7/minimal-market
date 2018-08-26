<template>
  <app-layout-full>
    <app-card contextual-style="dark">
      <div slot="body">
        <div class="row">
          <div class="content">

            <div class="topBar">
              <h1 class="pageTitle">
                Product 📦
                <span :class="{ productOwnedByMe: foundProduct && currentAddress === foundProduct.owner }">{{ productId }}</span>

              </h1>

              <!-- <button class="updateProductButton" v-if="ownsThisProduct" @click="toggleUpdateForm()">>
                Update
              </button> -->

              <button class="removeProductButton" v-if="ownsThisProduct" @click="removeProduct(foundProduct.id)">
                Remove
              </button>
            </div>

            <div v-if="foundProduct" class="productContentBox">
              <div class="productName">
                <span>
                  {{foundProduct.name}}
                </span>
              </div>

              <div class="productCreated">
                <span>
                  {{dateFromNow(foundProduct.createdAt)}} ago
                </span>
              </div>

              <div class="productStore">
                <span>
                  <router-link :to="{ name: 'Store', params: { storeId: foundProduct.storeId } }" active-class="active" class="nav-item" tag="a">
                    {{foundProduct.storeName}}
                  </router-link>

                </span>
              </div>

              <div class="productPrice">
                <span>
                  Ξ {{foundProduct.price}}
                </span>
              </div>

              <div class="productQuantity">
                <span>
                  {{foundProduct.quantity.toString()}}
                </span>
              </div>

              <div class="productImage">
                <span>
                  <img :src="foundProduct.imageUrl" />
                </span>
              </div>

              <div class="productDescription">
                <span>
                  {{foundProduct.description}}
                </span>
              </div>

              <div v-if="currentRole === 'shopper'" class="purchaseProductBox">
                <div class="inputQuantityBox">
                  <input type="number" min="0" :max="foundProduct.quantity" v-model="buyQuantity" placeholder="quantity" />
                </div>
                <div class="purchaseButtonBox">
                  <button class="purchaseProductButton" :disabled="buyQuantity < 1" @click="purchaseProduct({ productId: foundProduct.id, price: foundProduct.price, quantity: buyQuantity })">
                    Purchase
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </app-card>
  </app-layout-full>
</template>

<script>
/* eslint-disable max-len */
import { mapGetters, mapActions } from 'vuex';
import timeFromNow from 'date-fns/distance_in_words_strict';
import LayoutFull from '../layout/full.vue';
import Card from '../components/card.vue';
// import ModalUpdateStore from '../modals/productUpdate.vue';
import Notification from '../notification';

export default {
  name: 'app-product',
  components: {
    'app-layout-full': LayoutFull,
    'app-card': Card,
  },
  data() {
    return {
      // update
      showUpdateForm: false, // TODO: can add css effect to everything below the modal (transparancy..)

      // buy
      buyQuantity: 1,
    };
  },
  mounted() {
    this.$store.dispatch('products/getProduct', { productId: this.$route.params.productId });
  },
  computed: {
    ...mapGetters('conn', ['currentAddress']),
    ...mapGetters('users', ['currentRole']),
    ...mapGetters('products', ['foundProduct', 'purchaseProductStatus', 'removeProductStatus']),
    productId() {
      return this.$route.params.productId;
    },
    ownsThisProduct() {
      return this.foundProduct &&
        this.currentAddress &&
        this.foundProduct.owner === this.currentAddress;
    },
  },
  watch: {
    purchaseProductStatus(newStatus) {
      if (newStatus === 'success') {
        Notification.showSuccess(`Purchased ${this.buyQuantity}x ${this.foundProduct.name}`);
        this.reset();
      }
    },
    removeProductStatus(newStatus) {
      if (newStatus === 'success') {
        Notification.showSuccess(`Removed Product: ${this.foundProduct.name}`);
        this.reset();

        // go back to Store page of store product belonged too
        this.$router.push({ name: 'Store', params: { storeId: this.foundProduct.storeId } });
      }
    },
  },
  methods: {
    reset() {
      this.buyQuantity = 1;
    },
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
    ...mapActions('products', ['removeProduct', 'purchaseProduct']),
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

    .updateProductButton {
      border: 1px solid rgb(106, 106, 106);
      cursor: pointer;
      font-weight: bold;
      color: black;
      grid-column-start: 9;
      grid-column-end: 10;
      grid-row-start: 2;
      grid-row-end: 3;
    }
    .updateProductButton:disabled {
      border: 1px solid rgb(212, 212, 212);
      color: rgb(212, 212, 212);
      cursor:default;
    }
    .updateProductButton:hover {
      background-color: black;
      color: white;
    }

    .removeProductButton {
      border: 1px solid rgb(106, 106, 106);
      cursor: pointer;
      font-weight: bold;
      color: black;
      grid-column-start: 9;
      grid-column-end: 10;
      grid-row-start: 2;
      grid-row-end: 3;
    }
    .removeProductButton:disabled {
      border: 1px solid rgb(212, 212, 212);
      color: rgb(212, 212, 212);
      cursor:default;
    }
    .removeProductButton:hover {
      background-color: black;
      color: white;
    }

  /*
    Store Content box
  */
  .productContentBox {
    display:grid;
    grid-template-columns: repeat(9, 1fr);
    grid-template-rows: repeat(9, 100px);
  }

    .productName {
      grid-column-start: 1;
      grid-column-end: 5;
      grid-row-start: 1;
      grid-row-end: 2;
      text-align: center;
      display:flex;
      align-items:flex-end;
      justify-content: center;
    }
      .productName span {
        flex: 1;
        font-size: 30px;
      }
      .pageTitle span.productOwnedByMe:after {
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

    .productCreated {
      grid-column-start: 1;
      grid-column-end: 5;
      grid-row-start: 1;
      grid-row-end: 1;
      text-align: center;
      display:flex;
      align-items:start;
      justify-content: center;
      padding-top:4px;
      padding-right:15px;
      font-size:20px;
    }
      .productCreated span {
        flex: 1;
        color: rgb(119, 119, 119);
      }
      .productCreated span:before {
        color: black;
        font-family:monospace;
        content: 'created ⏰';
      }

    .productStore {
      grid-column-start: 1;
      grid-column-end: 5;
      grid-row-start: 2;
      grid-row-end: 3;
      text-align: center;
      display:flex;
      align-items:start;
      justify-content: center;
      font-size:20px;
    }
      .productStore span {
        flex: 1;
      }
      .productStore span:before {
        color: black;
        content: '🏬';
        font-size: 24px;
      }

    .productPrice {
      grid-column-start: 1;
      grid-column-end: 5;
      grid-row-start: 4;
      grid-row-end: 5;
      text-align: right;
      display:flex;
      align-items:start;
      justify-content: center;
      font-size:30px;
      padding-right: 15px;
    }
      .productPrice span {
        flex: 1;
        color: rgb(119, 119, 119);
      }
      .productPrice span:before {
        color: black;
        font-family:monospace;
        content: 'price ';
        font-size: 30px;
      }

    .productQuantity {
      grid-column-start: 1;
      grid-column-end: 5;
      grid-row-start: 4;
      grid-row-end: 5;
      text-align: right;
      display:flex;
      align-items:start;
      justify-content: center;
      font-size:30px;
      padding-top:45px;
      padding-right: 15px;
    }
      .productQuantity span {
        flex: 1;
        color: rgb(119, 119, 119);
      }
      .productQuantity span:before {
        color: black;
        font-family:monospace;
        content: 'quantity 📉';
        font-size: 30px;
      }

    .productDescription {
      border-bottom: 1px solid rgb(203, 203, 203);
      grid-column-start: 1;
      grid-column-end: 5;
      grid-row-start: 2;
      grid-row-end: 5;
      padding-top: 40px;
      text-align: left;
      display:flex;
      align-items:flex-start;
      justify-content: flex-start;
    }
      .productDescription span {
        flex: 1;
        font-size: 20px;
      }

    .productImage {
      border-left: 1px solid rgb(203, 203, 203);
      border-bottom: 1px solid rgb(203, 203, 203);
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
      .productImage span {
        flex: 1;
        width:100%;
        height:100%;
      }
        .productImage span img {
          transition: all .2s linear;
          max-width: 90%;
          max-height: 90%;
          height: auto;
        }

    /*
      Purchase Product box
    */
    .purchaseProductBox {
      grid-column-start: 5;
      grid-column-end: 10;
      grid-row-start: 5;
      grid-row-end: 6;

      display:flex;
      flex-direction:row;
    }
      .inputQuantityBox {
        flex: 1;
        display:flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-end;
      }
        .inputQuantityBox input {
          margin-right:5px;
          max-width:100px;
          flex: 1;

        }
      .purchaseButtonBox {
        flex: 1;
        display:flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
      }
        .purchaseProductButton {
          margin-left:5px;
          padding: 10px 20px;
          border: 1px solid rgb(106, 106, 106);
          cursor: pointer;
          font-weight: bold;
          font-size: 20px;
          color: black;
          grid-column-start: 9;
          grid-column-end: 10;
          grid-row-start: 2;
          grid-row-end: 3;
        }
        .purchaseProductButton:disabled {
          border: 1px solid rgb(212, 212, 212);
          color: rgb(212, 212, 212);
          cursor:default;
        }
        .purchaseProductButton:hover {
          background-color: black;
          color: white;
        }
</style>
