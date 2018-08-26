<template>
  <div class="modalBox">

    <div class="topBar">
      <div class="modalTitleContainer">
        <h2 class="modalTitle">Create Owner</h2>
      </div>
      <button class="closeButton" @click="$emit('close')"><font-awesome-icon :icon="['fas', 'times']" /></button>
    </div>

    <div class="form">

      <div class="inputAddress">
        <label>Address:</label>
        <input type="text" v-model="address" placeholder="owner address">
      </div>

      <button :class="{ active: canSubmit, submitButton: true }" :disabled="!canSubmit" @click.prevent="doSubmit()">Submit</button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'app-modal-owner-create',
  data() {
    return {
      address: '',
    };
  },
  computed: {
    ...mapGetters('users', ['createOwnerStatus']),
    ...mapGetters('conn', ['web3']),
    canSubmit() {
      return !!this.address && this.web3().utils.isAddress(this.address);
    },
  },
  watch: {
    createOwnerStatus(newStatus) {
      if (newStatus === 'success') {
        this.$emit('close');
      }
    },
  },
  methods: {
    doSubmit() {
      this.$store.dispatch('users/createOwner', {
        address: this.address,
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
  grid-template-rows: repeat(4, 1fr);
}
  .inputAddress {
    grid-column-start: 2;
    grid-column-end: 20;
    grid-row-start: 2;
    grid-row-end: 3;
    display:flex;
    align-items: center;
  }
    .inputAddress label {
      flex:1;
      text-align:right;
    }
    .inputAddress input {
      margin-left:13px;
      flex:3;
    }

  .submitButton {
    border: 1px solid rgb(106, 106, 106);
    cursor: pointer;
    font-weight: bold;
    color: black;
    grid-column-start: 16;
    grid-column-end: 20;
    grid-row-start: 4;
    grid-row-end: 5;
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
