/* eslint-env node, mocha */
/* global artifacts, contract, assert */
/* eslint-disable no-await-in-loop, max-len, no-unused-vars */

const EmergencyStop = artifacts.require('EmergencyStop');
const Bank = artifacts.require('Bank');
const Users = artifacts.require('Users');
const Stores = artifacts.require('Stores');
const Products = artifacts.require('Products');

const truffleAssert = require('truffle-assertions');

// const bs58 = require('bs58');
const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

const ADDR_ZERO = '0x0000000000000000000000000000000000000000';
const BYTES32_ZEROED = '0x0000000000000000000000000000000000000000000000000000000000000000';

const getRandomBytes32 = () => (
  web3.utils.randomHex(32)
);

contract('Stores', (accounts) => {
  const [deployer, admin, storeowner1, storeowner2, shopper] = accounts;

  describe('Instantiation', () => {
    let breakerInstance;
    let usersInstance;

    beforeEach(async () => {
      breakerInstance = await EmergencyStop.new({ from: deployer });
      usersInstance = await Users.new(breakerInstance.address, { from: deployer });
    });

    it('error if not passing address as arg1', async () => {
      try {
        await Stores.new(undefined, usersInstance.address, { from: deployer });
      } catch (err) {
        return;
      }
      assert(false, 'should have thrown');
    });
    it('error if not passing address as arg2', async () => {
      try {
        await Stores.new(breakerInstance.address, undefined, { from: deployer });
      } catch (err) {
        return;
      }
      assert(false, 'should have thrown');
    });
    it('success if passing in an address as arg1', async () => {
      const storesInstance = await Stores.new(breakerInstance.address, usersInstance.address, { from: deployer });
      assert(storesInstance);
    });
  });

  describe('Fallback function', () => {
    let storesInstance;

    beforeEach(async () => {
      const breakerInstance = await EmergencyStop.new({ from: deployer });
      const usersInstance = await Users.new(breakerInstance.address, { from: deployer });
      storesInstance = await Stores.new(breakerInstance.address, usersInstance.address, { from: deployer });
    });
    it('should throw when sending ETH', async () => {
      try {
        await storesInstance.sendTransaction({ value: 1, from: deployer });
      } catch (err) {
        return;
      }
      assert(false, 'should have thrown');
    });
    it('should throw when not sending ETH', async () => {
      try {
        await storesInstance.sendTransaction({ value: 0, from: deployer });
      } catch (err) {
        return;
      }
      assert(false, 'should have thrown');
    });
  });

  describe('Setup', () => {
    let breakerInstance;
    let bankInstance;
    let usersInstance;
    let storesInstance;
    let productsInstance;

    beforeEach(async () => {
      breakerInstance = await EmergencyStop.new({ from: deployer });
      bankInstance = await Bank.new(breakerInstance.address, { from: deployer });
      usersInstance = await Users.new(breakerInstance.address, { from: deployer });
      storesInstance = await Stores.new(breakerInstance.address, usersInstance.address, { from: deployer });
      productsInstance = await Products.new(breakerInstance.address, usersInstance.address, storesInstance.address, bankInstance.address, { from: deployer });

      // await storesInstance.setProductsContract(productsInstance.address, { from: deployer });
      // await bankInstance.setProductsContractAddress(productsInstance.address, { from: deployer });
      await breakerInstance.disableBreaker({ from: deployer });

      await usersInstance.addAdmin(admin, { from: deployer });
      await usersInstance.addStoreowner(storeowner1, { from: admin });
      await usersInstance.addStoreowner(storeowner2, { from: admin });
    });

    describe('setProductsContract(address productsContract_)', () => {
      beforeEach(async () => {
        await breakerInstance.enableBreaker({ from: deployer });
      });

      it('error when contract breaker is disabled', async () => {
        await breakerInstance.disableBreaker({ from: deployer });
        try {
          await storesInstance.setProductsContract(productsInstance.address, {
            from: deployer,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error when called by storeowner', async () => {
        try {
          await storesInstance.setProductsContract(productsInstance.address, {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error when called by shopper', async () => {
        try {
          await storesInstance.setProductsContract(productsInstance.address, {
            from: shopper,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error when called by admin', async () => {
        try {
          await storesInstance.setProductsContract(productsInstance.address, {
            from: admin,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('success if called by owner and emergency stop is enabled', async () => {
        await storesInstance.setProductsContract(productsInstance.address, {
          from: deployer,
        });
      });
    });
  });

  describe('Setters', () => {
    let breakerInstance;
    let bankInstance;
    let usersInstance;
    let storesInstance;
    let productsInstance;

    beforeEach(async () => {
      breakerInstance = await EmergencyStop.new({ from: deployer });
      bankInstance = await Bank.new(breakerInstance.address, { from: deployer });
      usersInstance = await Users.new(breakerInstance.address, { from: deployer });
      storesInstance = await Stores.new(breakerInstance.address, usersInstance.address, { from: deployer });
      productsInstance = await Products.new(breakerInstance.address, usersInstance.address, storesInstance.address, bankInstance.address, { from: deployer });

      await storesInstance.setProductsContract(productsInstance.address, { from: deployer });
      await bankInstance.setProductsContractAddress(productsInstance.address, { from: deployer });
      await breakerInstance.disableBreaker({ from: deployer });

      await usersInstance.addAdmin(admin, { from: deployer });
      await usersInstance.addStoreowner(storeowner1, { from: admin });
      await usersInstance.addStoreowner(storeowner2, { from: admin });
    });

    describe('addStore(bytes32 ipfsHash_)', () => {
      it('error when trying to send ETH to this method', async () => {
        try {
          await storesInstance.addStore(getRandomBytes32(), {
            from: storeowner1,
            value: web3.toWei(1),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if account is not a storeowner', async () => {
        try {
          await storesInstance.addStore(getRandomBytes32(), {
            from: shopper,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if no first argument (bytes32 contentHash)', async () => {
        try {
          await storesInstance.addStore({
            from: shopper,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if first argument (bytes32 contentHash) is bytes32(0)', async () => {
        try {
          await storesInstance.addStore(BYTES32_ZEROED, {
            from: shopper,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if emergency stop enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        try {
          await storesInstance.addStore(getRandomBytes32(), {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('success if account is a storeowner, 1 store', async () => {
        const expectedStoreContentHash = getRandomBytes32();

        const expectedStoreId = (await storesInstance.storeIdCounter()).add(1);

        const tx = await storesInstance.addStore(expectedStoreContentHash, {
          from: storeowner1,
        });

        truffleAssert.eventEmitted(tx, 'StoreAdded', ev => (
          ev.storeId.eq(expectedStoreId) &&
          ev.storeOwner === storeowner1 &&
          ev.contentHash === expectedStoreContentHash
        ), 'StoreAdded should be emitted with correct parameters');

        const storeIdCounter = await storesInstance.storeIdCounter();
        assert(storeIdCounter.eq(1), 'storeIdCounter should have increased to 1');

        const ownerStoreIdCount = await storesInstance.getOwnerStoreCount(storeowner1);
        assert(ownerStoreIdCount.eq(1), 'ownerStoreIdCount should have increased to 1');
      });

      it('success if account is a storeowner, multiple stores', async () => {
        // 1
        {
          const expectedStoreContentHash = getRandomBytes32();

          const expectedStoreId = (await storesInstance.storeIdCounter()).add(1);

          const tx = await storesInstance.addStore(expectedStoreContentHash, {
            from: storeowner1,
          });

          truffleAssert.eventEmitted(tx, 'StoreAdded', ev => (
            ev.storeId.eq(expectedStoreId) &&
            ev.storeOwner === storeowner1 &&
            ev.contentHash === expectedStoreContentHash
          ), 'StoreAdded should be emitted with correct parameters');

          const storeIdCounter = await storesInstance.storeIdCounter();
          assert(storeIdCounter.eq(1), 'storeIdCounter should have increased to 1');

          const ownerStoreIdCount = await storesInstance.getOwnerStoreCount(storeowner1);
          assert(ownerStoreIdCount.eq(1), 'ownerStoreIdCount should have increased to 1');

          const [onchainStoreId, onchainStoreOwner, onchainStoreContent, contentHash, createdAt, updatedAt] = await storesInstance.getStore(expectedStoreId);
          assert(expectedStoreContentHash === onchainStoreContent, 'store content hash did not match');
          assert(storeowner1 === onchainStoreOwner, 'store owner is not expected value');
        }
        // 2
        {
          const expectedStoreContentHash = getRandomBytes32();

          const expectedStoreId = (await storesInstance.storeIdCounter()).add(1);

          const tx = await storesInstance.addStore(expectedStoreContentHash, {
            from: storeowner1,
          });

          truffleAssert.eventEmitted(tx, 'StoreAdded', ev => (
            ev.storeId.eq(expectedStoreId) &&
            ev.storeOwner === storeowner1 &&
            ev.contentHash === expectedStoreContentHash
          ), 'StoreAdded should be emitted with correct parameters');

          const storeIdCounter = await storesInstance.storeIdCounter();
          assert(storeIdCounter.eq(2), 'storeIdCounter should have increased to 2');

          const ownerStoreIdCount = await storesInstance.getOwnerStoreCount(storeowner1);
          assert(ownerStoreIdCount.eq(2), 'ownerStoreIdCount should have increased to 2');

          const [onchainStoreId, onchainStoreOwner, onchainStoreContent, contentHash, createdAt, updatedAt] = await storesInstance.getStore(expectedStoreId);
          assert(expectedStoreContentHash === onchainStoreContent, 'store content hash did not match');
          assert(storeowner1 === onchainStoreOwner, 'store owner is not expected value');
        }
      });
    });

    describe('removeStore(uint storeId_)', () => {
      const createdStoreIds = [];
      let createdStoreContentHash;

      beforeEach(async () => {
        createdStoreContentHash = getRandomBytes32();

        createdStoreIds.push((await storesInstance.storeIdCounter()).add(1));

        await storesInstance.addStore(createdStoreContentHash, {
          from: storeowner1,
        });
      });

      it('error when trying to send ETH to this method', async () => {
        try {
          await storesInstance.removeStore(createdStoreIds[0], {
            from: storeowner1,
            value: web3.toWei(1),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if account is not a storeowner', async () => {
        try {
          await storesInstance.removeStore(createdStoreIds[0], {
            from: shopper,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if account is not the storeowner of the store', async () => {
        try {
          await storesInstance.removeStore(createdStoreIds[0], {
            from: storeowner2,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if store does not exist', async () => {
        try {
          await storesInstance.removeStore('2222', {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });

      it('error if store still has products', async () => {
        for (let i = 0; i < 3; i += 1) {
          await productsInstance.addProduct(createdStoreIds[0], getRandomBytes32(), web3.utils.toWei('1'), '5', {
            from: storeowner1,
          });
        }
        try {
          const tx = await storesInstance.removeStore(createdStoreIds[0], {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if emergency stop enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        try {
          await storesInstance.removeStore(createdStoreIds[0], {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('success if correct caller, store exists, and it has zero products', async () => {
        const tx = await storesInstance.removeStore(createdStoreIds[0], {
          from: storeowner1,
        });
        truffleAssert.eventEmitted(tx, 'StoreRemoved', ev => (
          ev.storeId.eq(createdStoreIds[0]) && ev.storeOwner === storeowner1
        ), 'StoreRemoved should be emitted with correct parameters');

        const storeIdCounter = await storesInstance.storeIdCounter();
        assert(storeIdCounter.eq(1), 'storeIdCounter should tay the same');

        const ownerStoreIdCount = await storesInstance.getOwnerStoreCount(storeowner1);
        assert(ownerStoreIdCount.eq(0), 'ownerStoreIdCount should have decreased to zero');

        const [onchainStoreId, onchainStoreOwner, onchainStoreContent, contentHash, createdAt, updatedAt] = await storesInstance.getStore(createdStoreIds[0]);
        assert(BYTES32_ZEROED === onchainStoreContent, 'store content hash should be zeroed out');
      });
    });

    describe('updateStoreContent(uint storeId_, bytes32 newContentHash_)', () => {
      let createdStoreId;
      let createdStoreContentHash;

      beforeEach(async () => {
        createdStoreContentHash = getRandomBytes32();

        createdStoreId = (await storesInstance.storeIdCounter()).add(1);

        await storesInstance.addStore(createdStoreContentHash, {
          from: storeowner1,
        });
      });

      it('error when trying to send ETH to this method', async () => {
        try {
          await storesInstance.updateStoreContent(createdStoreId, getRandomBytes32(), {
            from: storeowner1,
            value: web3.toWei(1),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if account is not a storeowner', async () => {
        try {
          await storesInstance.updateStoreContent(createdStoreId, getRandomBytes32(), {
            from: shopper,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if account is not the storeowner of the store', async () => {
        try {
          await storesInstance.updateStoreContent(createdStoreId, getRandomBytes32(), {
            from: storeowner2,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if store does not exist', async () => {
        try {
          await storesInstance.updateStoreContent('22', getRandomBytes32(), {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if not sending arg1', async () => {
        try {
          await storesInstance.updateProductContent(undefined, getRandomBytes32(), {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if not sending arg2', async () => {
        try {
          await storesInstance.updateProductContent(createdStoreId, undefined, {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if sending bytes32(0) as arg2, store content hash cannot be 0x0 ', async () => {
        try {
          await storesInstance.updateProductContent(createdStoreId, BYTES32_ZEROED, {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if emergency stop enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        try {
          await storesInstance.updateStoreContent(createdStoreId, getRandomBytes32(), {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('success if store exists and caller owns store and new content hash is valid', async () => {
        const updatedStoreContentHash = getRandomBytes32();

        const tx = await storesInstance.updateStoreContent(createdStoreId, updatedStoreContentHash, {
          from: storeowner1,
        });

        truffleAssert.eventEmitted(tx, 'StoreUpdatedContent', ev => (
          ev.storeId.eq(createdStoreId) &&
          ev.oldContentHash === createdStoreContentHash &&
          ev.newContentHash === updatedStoreContentHash
        ), 'StoreUpdatedContent should be emitted with correct parameters');

        const storeIdCounter = await storesInstance.storeIdCounter();
        assert(storeIdCounter.eq(1), 'storeIdCounter should stay the same, 1');

        const ownerStoreCount = await storesInstance.getOwnerStoreCount(storeowner1);
        assert(ownerStoreCount.eq(1), 'ownerStoreIdCount should stay the same, 1');

        const [onchainStoreId, onchainStoreOwner, onchainStoreContentHash, onchainStorePrice] = await storesInstance.getStore(createdStoreId);
        assert(onchainStoreId.eq(createdStoreId), 'store id should stay the same');
        assert(onchainStoreOwner === storeowner1, 'store owner should stay the same');
        assert(onchainStoreContentHash === updatedStoreContentHash, 'content hash should have updated to new contentHash');
      });
    });
  });

  describe('Getters', () => {
    const createdStores = {};
    let breakerInstance;
    let bankInstance;
    let usersInstance;
    let storesInstance;
    let productsInstance;

    const createStoresFor = async (storeowner, howMany) => {
      const ret = [];

      for (let i = 0; i < howMany; i += 1) {
        const item = {};

        item.hash = getRandomBytes32();

        const tx = await storesInstance.addStore(item.hash, {
          from: storeowner,
        });

        truffleAssert.eventEmitted(tx, 'StoreAdded', (ev) => {
          item.id = ev.storeId;
          return ev.storeOwner === storeowner && ev.contentHash === item.hash;
        }, 'StoreAdded should be emitted with correct parameters');

        ret.push(item);
      }

      return ret;
    };

    beforeEach(async () => {
      breakerInstance = await EmergencyStop.new({ from: deployer });
      bankInstance = await Bank.new(breakerInstance.address, { from: deployer });
      usersInstance = await Users.new(breakerInstance.address, { from: deployer });
      storesInstance = await Stores.new(breakerInstance.address, usersInstance.address, { from: deployer });
      productsInstance = await Products.new(breakerInstance.address, usersInstance.address, storesInstance.address, bankInstance.address, { from: deployer });

      await storesInstance.setProductsContract(productsInstance.address, { from: deployer });
      await bankInstance.setProductsContractAddress(productsInstance.address, { from: deployer });
      await breakerInstance.disableBreaker({ from: deployer });

      await usersInstance.addAdmin(admin, { from: deployer });
      await usersInstance.addStoreowner(storeowner1, { from: admin });
      await usersInstance.addStoreowner(storeowner2, { from: admin });

      // these functions only test getters, so we only need to run the setup once
      // at boot, after that there will be no changes
      createdStores[storeowner1] = await createStoresFor(storeowner1, 7);
      createdStores[storeowner2] = await createStoresFor(storeowner2, 4);
    });

    describe('function storeIdCounter()', () => {
      it('success returns correct store count', async () => {
        const storeIdCounter = await storesInstance.storeIdCounter();
        assert(storeIdCounter.eq(11), 'storeIdCounter should be 7 + 4 = 11');
      });
      it('success returns correct store count when emergency stop enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        const storeIdCounter = await storesInstance.storeIdCounter();
        assert(storeIdCounter.eq(11), 'storeIdCounter should be 7 + 4 = 11');
      });
    });

    describe('function ownerToStoreIds(address storeowner_, uint index)', () => {
      it('returns correct number of stores', async () => {
        const storeCountOwner1 = await storesInstance.getOwnerStoreCount(storeowner1);
        const storeCountOwner2 = await storesInstance.getOwnerStoreCount(storeowner2);

        for (let i = 0; i < storeCountOwner1; i += 1) {
          const foundStoreId = await storesInstance.ownerToStoreIds(storeowner1, i);
          const expectedStoreItem = createdStores[storeowner1][i];
          assert(foundStoreId.eq(expectedStoreItem.id), 'store id should match expected');
          const [onchainStoreId, onchainStoreOwner, onchainStoreContent, contentHash, createdAt, updatedAt] = await storesInstance.getStore(foundStoreId);
          assert(expectedStoreItem.hash === onchainStoreContent, 'store content hash did not match expected');
          assert(storeowner1 === onchainStoreOwner, 'store owner did not match expected');
        }

        for (let i = 0; i < storeCountOwner2; i += 1) {
          const foundStoreId = await storesInstance.ownerToStoreIds(storeowner2, i);
          const expectedStoreItem = createdStores[storeowner2][i];
          assert(expectedStoreItem.id.eq(foundStoreId), 'store id should match expected');
          const [onchainStoreId, onchainStoreOwner, onchainStoreContent, contentHash, createdAt, updatedAt] = await storesInstance.getStore(foundStoreId);
          assert(expectedStoreItem.hash === onchainStoreContent, 'store content hash did not match expected');
          assert(storeowner2 === onchainStoreOwner, 'store owner did not match expected');
        }
      });
      it('returns correct number of stores when emergency stop enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        const storeCountOwner1 = await storesInstance.getOwnerStoreCount(storeowner1);
        const storeCountOwner2 = await storesInstance.getOwnerStoreCount(storeowner2);

        for (let i = 0; i < storeCountOwner1; i += 1) {
          const foundStoreId = await storesInstance.ownerToStoreIds(storeowner1, i);
          const expectedStoreItem = createdStores[storeowner1][i];
          assert(foundStoreId.eq(expectedStoreItem.id), 'store id should match expected');
          const [onchainStoreId, onchainStoreOwner, onchainStoreContent, contentHash, createdAt, updatedAt] = await storesInstance.getStore(foundStoreId);
          assert(expectedStoreItem.hash === onchainStoreContent, 'store content hash did not match expected');
          assert(storeowner1 === onchainStoreOwner, 'store owner did not match expected');
        }

        for (let i = 0; i < storeCountOwner2; i += 1) {
          const foundStoreId = await storesInstance.ownerToStoreIds(storeowner2, i);
          const expectedStoreItem = createdStores[storeowner2][i];
          assert(expectedStoreItem.id.eq(foundStoreId), 'store id should match expected');
          const [onchainStoreId, onchainStoreOwner, onchainStoreContent, contentHash, createdAt, updatedAt] = await storesInstance.getStore(foundStoreId);
          assert(expectedStoreItem.hash === onchainStoreContent, 'store content hash did not match expected');
          assert(storeowner2 === onchainStoreOwner, 'store owner did not match expected');
        }
      });
    });

    describe('function getStore(uint productId_)', () => {
      it('error if no arg1', async () => {
        try {
          await storesInstance.getStore(undefined, {
            from: shopper,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('returns correct store', async () => {
        const [onchainStoreId, onchainStoreOwner, onchainStoreContentHash] = await storesInstance.getStore(createdStores[storeowner1][0].id);
        assert(onchainStoreId.eq(createdStores[storeowner1][0].id), 'product id did not match expected');
        assert(onchainStoreOwner === storeowner1, 'product store id did not match expected');
        assert(onchainStoreContentHash === createdStores[storeowner1][0].hash, 'product content hash did not match expected');
      });
      it('returns correct store when emergency stop enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        const [onchainStoreId, onchainStoreOwner, onchainStoreContentHash] = await storesInstance.getStore(createdStores[storeowner1][0].id);
        assert(onchainStoreId.eq(createdStores[storeowner1][0].id), 'product id did not match expected');
        assert(onchainStoreOwner === storeowner1, 'product store id did not match expected');
        assert(onchainStoreContentHash === createdStores[storeowner1][0].hash, 'product content hash did not match expected');
        // TODO: test createdAt && updatedAt
      });
    });

    describe('function getOwnerStoreCount(address storeowner_)', () => {
      it('returns correct storeowner store count', async () => {
        const storeCountOwner1 = await storesInstance.getOwnerStoreCount(storeowner1);
        assert(storeCountOwner1.eq(7), 'storeowner1 should have 7 stores');

        const storeCountOwner2 = await storesInstance.getOwnerStoreCount(storeowner2);
        assert(storeCountOwner2.eq(4), 'storeowner2 should have 4 stores');
      });
      it('returns correct storeowner store count when emergency stop enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        const storeCountOwner1 = await storesInstance.getOwnerStoreCount(storeowner1);
        assert(storeCountOwner1.eq(7), 'storeowner1 should have 7 stores');

        const storeCountOwner2 = await storesInstance.getOwnerStoreCount(storeowner2);
        assert(storeCountOwner2.eq(4), 'storeowner2 should have 4 stores');
      });
    });

    describe('storeExists(uint storeId_)', () => {
      it('success returns false if store does not exist', async () => {
        const result = await storesInstance.storeExists('99');
        assert(result === false, 'should return false since store does not exist');
      });
      it('success returns true if store exists', async () => {
        const result = await storesInstance.storeExists(createdStores[storeowner1][0].id);
        assert(result === true, 'store should exist');
      });
      it('success returns true if store exists and emergency stop enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        const result = await storesInstance.storeExists(createdStores[storeowner1][0].id);
        assert(result === true, 'store should exist');
      });
    });

    describe('getStoreOwner(uint storeId_)', () => {
      it('success returns zero if store does not exist', async () => {
        const result = await storesInstance.getStoreOwner('99');
        assert(result === ADDR_ZERO, 'storeowner should be address(0)');
      });
      it('success returns correct storeowner if store exists', async () => {
        const result = await storesInstance.getStoreOwner(createdStores[storeowner1][0].id);
        assert(result === storeowner1, 'storeowner should be address(0)');
      });
      it('success returns correct storeowner if store exists and emergency stop enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        const result = await storesInstance.getStoreOwner(createdStores[storeowner1][0].id);
        assert(result === storeowner1, 'storeowner should be address(0)');
      });
    });
  });
});
