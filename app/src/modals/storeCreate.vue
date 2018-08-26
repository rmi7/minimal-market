<template>
  <div class="modalBox">

    <div class="topBar">
      <div class="modalTitleContainer">
        <h2 class="modalTitle">Create Store</h2>
      </div>
      <button class="closeButton" @click="$emit('close')"><font-awesome-icon :icon="['fas', 'times']" /></button>
    </div>

    <div class="form">

      <div class="inputName">
        <label>Name:</label>
        <input type="text" v-model="name" placeholder="store name">
      </div>

      <div class="inputDescription">
        <label>Description:</label>
        <textarea v-model="description" placeholder="store description"></textarea>
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

export default {
  name: 'app-modal-store-create',
  data() {
    return {
      name: '',
      description: '',
      image: null,
      imageName: '',
    };
  },
  computed: {
    ...mapGetters('stores', ['createStoreStatus']),
    canSubmit() {
      return !!this.name && !!this.description && !!this.image;
    },
  },
  watch: {
    createStoreStatus(newStatus) {
      if (newStatus === 'success') {
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
      this.$store.dispatch('stores/createStore', {
        name: this.name,
        description: this.description,
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
    grid-row-end: 3;
    cursor: pointer;
    border: none;
    font-size:35px;
  }

.form {
  display:grid;
  grid-template-columns: repeat(20, 1fr);
  grid-template-rows: repeat(7, 1fr);
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
  .inputDescription {
    grid-column-start: 2;
    grid-column-end: 20;
    grid-row-start: 3;
    grid-row-end: 5;
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
    grid-row-start: 5;
    grid-row-end: 6;
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
    grid-row-start: 6;
    grid-row-end: 7;
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
