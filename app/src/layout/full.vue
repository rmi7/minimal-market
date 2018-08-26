<template>
  <div>
    <h1 class="appTitle">MINIMAL MARKET</h1>
    <app-navbar></app-navbar>
    <div class="container pt-4 app-box">
      <div class="row">
        <div class="col col-12">
          <!-- Content will be placed here -->
          <slot></slot>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import Navbar from '../components/navbar.vue';

export default {
  name: 'app-layout-full',
  components: {
    'app-navbar': Navbar,
  },
};
</script>

<style>
.appTitle {
  text-align: center;
  border-bottom: 1px solid rgb(203, 203, 203);
}
.container {
    width: 100%;
    padding-right: 15px;
    padding-left: 15px;
    margin-right: auto;
    margin-left: auto;
}

@media (min-width: 576px) {
  .container {
      max-width: 540px;
  }
}

@media (min-width: 768px) {
  .container {
      max-width: 720px;
  }
}

@media (min-width: 992px) {
  .container {
      max-width: 960px;
  }
}

@media (min-width: 1331px) {
  .container {
      max-width: 1331px;
  }
}

</style>
