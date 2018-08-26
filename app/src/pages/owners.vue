<template>
  <app-layout-full>
    <app-card contextual-style="dark">
      <div slot="body">
        <div class="row">
          <div class="content">

            <div class="topBar">
              <h1 class="pageTitle">Owners</h1>

              <button class="addOwnerButton" v-if="currentRole === 'admin'" @click="toggleCreateForm()">
                Add Owner
              </button>
            </div>

            <ul v-if="foundOwners.length" class="ownerList">
              <router-link v-for="owner in foundOwners" :to="{ name: 'Owner', params: { ownerAddr: owner.address } }" class="owner-thumb" tag="li">
                <div class="ownerAddr">
                  <span>{{owner.address}}</span>
                </div>
                <div class="ownerNumStores">{{owner.numStores}}</div>
                <div class="ownerNumProducts">{{owner.numProducts}}</div>
                <div v-if="currentAddress === owner.address" class="isMe"><span>IS ME</span></div>
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
import LayoutFull from '../layout/full.vue';
import Card from '../components/card.vue';
import ModalCreateOwner from '../modals/ownerCreate.vue';

export default {
  name: 'app-owners',
  components: {
    'app-layout-full': LayoutFull,
    'app-card': Card,
  },
  mounted() {
    this.$store.dispatch('users/getOwners');
  },
  computed: {
    ...mapGetters('conn', ['currentAddress']),
    ...mapGetters('users', ['currentRole', 'foundOwners']),
  },
  methods: {
    toggleCreateForm() {
      this.$modal.show(ModalCreateOwner, {}, {
        height: '240px',
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

    .addOwnerButton {
      border: 1px solid rgb(106, 106, 106);
      cursor: pointer;
      font-weight: bold;
      color: black;
      grid-column-start: 9;
      grid-column-end: 10;
      grid-row-start: 2;
      grid-row-end: 3;
    }
    .addOwnerButton:disabled {
      border: 1px solid rgb(212, 212, 212);
      color: rgb(212, 212, 212);
      cursor:default;
    }
    .addOwnerButton:hover {
      background-color: black;
      color: white;
    }

  .ownerList {
    list-style-type: none;
    grid-template-rows: repeat(3, 1fr);
    grid-template-columns: repeat(2, 1fr);
    gap: 50px;
    padding:0; /* undo ul default style */
    display:grid;
  }

    .owner-thumb {
      grid-column-start: auto;
      grid-row-start: auto;
      cursor: pointer;

      display: grid;
      grid-template-columns: repeat(9, 1fr);
      grid-template-rows: repeat(1, 1fr);
      border: 1px solid rgb(203, 203, 203);
    }

      .ownerAddr {
        grid-column-start: 1;
        grid-column-end: 10;
        grid-row-start: 1;
        grid-row-end: 2;
        padding-left: 5px;
        font-size: 21px;
        text-align: center;
        color:black;
        font-family: monospace;
      }
      .owner-thumb:hover .ownerAddr {
        background-color: rgb(0,255,127);
        border-color: transparent;
      }

      .ownerNumStores {
        grid-column-start: 1;
        grid-column-end: 5;
        grid-row-start: 1;
        grid-row-end: 1;
        padding-top:45px;
        padding-right: 5px;
        padding-left: 5px;
        font-size:30px;
        text-align: right;
      }
        .ownerNumStores span {
          padding-left: 5px;
          color: rgb(97, 97, 97);
        }
        .ownerNumStores:before {
          padding-right:5px;
          color: black;
          font-weight: bold;
          content: '🏬';
        }

      .ownerNumProducts {
        grid-column-start: 6;
        grid-column-end: 10;
        grid-row-start: 1;
        grid-row-end: 2;
        padding-top:41px;
        text-align: left;
        padding-right: 5px;
        padding-left: 5px;
        font-size:30px;
      }
        .ownerNumProducts span {
          font-size:19px;
          color: black;
        }
        .ownerNumProducts:before {
          color: black;
          font-weight: bold;
          padding-right:7px;
          content: '📦';
        }
      .isMe {
        grid-column-start: 8;
        grid-column-end: 10;
        grid-row-start: 1;
        grid-row-end: 2;
        padding-top: 40px;
      }
        .isMe span {
          background-color: rgb(255, 130, 0);
          font-size: 15px;
          color: black;
          padding: 5px 10px;

          font-weight:bold;
          text-transform: uppercase;
          border-radius:5px;
        }

</style>
