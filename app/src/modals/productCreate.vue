<template>
  <div class="modalBox">

    <div class="topBar">
      <div class="modalTitleContainer">
        <h2 class="modalTitle">Create Product</h2>
      </div>
      <button class="closeButton" @click="$emit('close')"><font-awesome-icon :icon="['fas', 'times']" /></button>
    </div>

    <div class="form">

      <div class="inputStore">
        <label>Store:</label>
        <select v-model="selectedStore">
          <option v-if="getSelectableStores.length > 1" disabled value="">Please select one</option>
          <option v-for="store in getSelectableStores" :value="store.id">{{store.name}}</option>
        </select>
      </div>

      <div class="inputName">
        <label>Name:</label>
        <input type="text" v-model="name" placeholder="product name">
      </div>

      <div class="inputDescription">
        <label>Description:</label>
        <textarea v-model="description" placeholder="product description"></textarea>
      </div>

      <div class="inputPrice">
        <label>Price:</label>
        <input type="number" v-model.number="price" placeholder="product price" />
      </div>

      <div class="inputQuantity">
        <label>Quantity:</label>
        <input type="number" v-model.number="quantity" placeholder="product quantity" />
      </div>

      <div class="inputImage">
        <label>Image:</label>
        <div class="uploadBox">
          <label for="create_store_input_image">upload</label> {{imageName}}
          <input id="create_store_input_image" type="file" @change="processFile($event)" />
        </div>
      </div>

      <button :class="{ active: canSubmit, submitButton: true }" :disabled="!canSubmit" @click.prevent="doSubmit()">Submit</button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Notification from '../notification';

export default {
  name: 'app-modal-product-create',
  data() {
    return {
      name: '',
      description: '',
      image: null,
      imageName: '',
      price: 0,
      quantity: 0,
      selectedStore: '',
    };
  },
  props: ['preSetStoreId'],
  mounted() {
    this.$store.dispatch('stores/getOwnerStores', { ownerAddr: this.$store.getters['conn/currentAddress'] });
  },

  computed: {
    ...mapGetters('stores', ['foundOwnerStores']),
    ...mapGetters('products', ['createProductStatus']),
    canSubmit() {
      return !!this.selectedStore && !!this.name && !!this.description && !!this.price && !!this.quantity && !!this.image; // eslint-disable-line max-len
    },
    getSelectableStores() {
      if (this.foundOwnerStores) {
        if (this.preSetStoreId) {
          this.selectedStore = this.preSetStoreId;
          return this.foundOwnerStores.filter(foundStore => foundStore.id === this.preSetStoreId);
        }
        return this.foundOwnerStores;
      }

      return [];
    },
  },
  watch: {
    createProductStatus(newStatus) {
      if (newStatus === 'success') {
        Notification.showSuccess('Created Product');
        this.$emit('close');
      }
    },
  },
  methods: {
    processFile(event) {
      // https://github.com/ipfs/js-ipfs-api/blob/master/examples/upload-file-via-browser/src/App.js
      const file = event.target.files[0];
      const reader = new window.FileReader(); // eslint-disable-line
      reader.onloadend = () => {
        this.imageName = `${file.name.slice(0, 23)}..`;
        this.image = reader.result;
      };
      reader.readAsArrayBuffer(file);
    },
    doSubmit() {
      this.$store.dispatch('products/createProduct', {
        storeId: this.selectedStore,
        name: this.name,
        description: this.description,
        price: this.price,
        quantity: this.quantity,
        image: this.image,
        // imageName: this.imageName,
      });
    },
  },
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}
input[type=text], textarea {
    border-style: inset;
    border: 1px solid rgb(212, 212, 212);
}

.topBar {
  display:grid;
  grid-template-columns: repeat(18, 1fr);
  grid-template-rows: repeat(2, 30px);
  border-bottom: 1px solid rgb(182, 182, 182);
}
  .modalTitleContainer {
    grid-column-start: 1;
    grid-column-end: 18;
    grid-row-start: 1;
    grid-row-end: 3;
    display:flex;
    align-items: center;
  }
    .modalTitleContainer .modalTitle {
      flex:1;
      font-size:40px;
      margin-left:10px;
    }
  .closeButton {
    grid-column-start: 17;
    grid-column-end: 19;
    grid-row-start: 1;
    grid-row-end: 2;
    cursor: pointer;
    border: none;
    font-size:35px;
  }

.form {
  display:grid;
  grid-template-columns: repeat(20, 1fr);
  grid-template-rows: repeat(8, 1fr);
}
  .inputStore {
    grid-column-start: 2;
    grid-column-end: 20;
    grid-row-start: 1;
    grid-row-end: 2;
    display:flex;
    align-items: center;
  }
    .inputStore label {
      flex:1;
      text-align:right;
    }
    .inputStore select {
      margin-left:13px;
      flex:3;
    }
  .inputName {
    grid-column-start: 2;
    grid-column-end: 20;
    grid-row-start: 2;
    grid-row-end: 3;
    display:flex;
    align-items: center;
  }
    .inputName label {
      flex:1;
      text-align:right;
    }
    .inputName input {
      margin-left:13px;
      flex:3;
    }
  .inputPrice {
    grid-column-start: 2;
    grid-column-end: 20;
    grid-row-start: 3;
    grid-row-end: 4;
    display:flex;
    align-items: center;
  }
    .inputPrice label {
      flex:1;
      text-align:right;
    }
    .inputPrice input {
      margin-left:13px;
      flex:3;
    }
  .inputQuantity {
    grid-column-start: 2;
    grid-column-end: 20;
    grid-row-start: 4;
    grid-row-end: 5;
    display:flex;
    align-items: center;
  }
    .inputQuantity label {
      flex:1;
      text-align:right;
    }
    .inputQuantity input {
      margin-left:13px;
      flex:3;
    }
  .inputDescription {
    grid-column-start: 2;
    grid-column-end: 20;
    grid-row-start: 5;
    grid-row-end: 7;
    display:flex;
    align-items: center;
  }
    .inputDescription label {
      flex:1;
      text-align:right;
    }
    .inputDescription textarea {
      margin-left:13px;
      height:100px !important;
      flex:3;
      resize: none;
    }
  .inputImage {
    grid-column-start: 2;
    grid-column-end: 20;
    grid-row-start: 7;
    grid-row-end: 8;
    display:flex;
    align-items: center;
  }
    .inputImage label:nth-child(1) {
      flex:1;
      text-align:right;
    }
    .inputImage .uploadBox {
      margin-left:13px;
      width:1px; /* somehow this makes it work */
      flex:3;
    }
      .inputImage .uploadBox label {
        width:100px;
        text-align: center;
        font-weight: bold;
        border: 1px solid rgb(106, 106, 106);
        cursor: pointer;
      }
      .inputImage .uploadBox label:hover {
        background-color: black;
        color: white;
      }
    #create_store_input_image {
      display: none;
    }
  .submitButton {
    border: 1px solid rgb(106, 106, 106);
    cursor: pointer;
    font-weight: bold;
    color: black;
    grid-column-start: 16;
    grid-column-end: 20;
    grid-row-start: 8;
    grid-row-end: 9;
  }
  .submitButton:disabled {
    border: 1px solid rgb(212, 212, 212);
    color: rgb(212, 212, 212);
    cursor:default;
  }
  .submitButton.active:hover {
    background-color: black;
    color: white;
  }
</style>
