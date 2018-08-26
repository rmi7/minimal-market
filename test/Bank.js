/* eslint-env node, mocha */
/* global artifacts, contract, assert */
/* eslint-disable no-await-in-loop, max-len, no-unused-vars */

const truffleAssert = require('truffle-assertions');
const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

// bank ownership will be transferred to Products contract at deployment,
// so we need to test that case and therefore need all contracts
const EmergencyStop = artifacts.require('EmergencyStop');
const Bank = artifacts.require('Bank');
const Users = artifacts.require('Users');
const Stores = artifacts.require('Stores');
const Products = artifacts.require('Products');

// instead of transforming a real IPFS hash to bytes32, we a re just gonna generate
// some random bytes32
const getRandomBytes32 = () => (
  web3.utils.randomHex(32)
);

contract('Bank', (accounts) => {
  const [deployer, admin, storeowner1, storeowner2, shopper] = accounts;

  describe('Instantiation', () => {
    let breakerInstance;

    beforeEach(async () => {
      breakerInstance = await EmergencyStop.new({ from: deployer });
    });

    it('error if not passing address arg1', async () => {
      try {
        await Bank.new(undefined, { from: deployer });
      } catch (err) {
        return;
      }
      assert(false, 'should have thrown');
    });

    it('success if passing in address arg1', async () => {
      const bankInstance = await Bank.new(breakerInstance.address, { from: deployer });
      assert(bankInstance);
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

      await breakerInstance.disableBreaker({ from: deployer });

      await usersInstance.addAdmin(admin, { from: deployer });
      await usersInstance.addStoreowner(storeowner1, { from: admin });
      await usersInstance.addStoreowner(storeowner2, { from: admin });
    });

    describe('setProductsContractAddress(address productsContract_)', () => {
      beforeEach(async () => {
        await breakerInstance.enableBreaker({ from: deployer });
      });

      it('error when contract breaker is disabled', async () => {
        await breakerInstance.disableBreaker({ from: deployer });
        try {
          await bankInstance.setProductsContractAddress(productsInstance.address, {
            from: deployer,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error when called by storeowner', async () => {
        try {
          await bankInstance.setProductsContractAddress(productsInstance.address, {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error when called by shopper', async () => {
        try {
          await bankInstance.setProductsContractAddress(productsInstance.address, {
            from: shopper,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error when called by admin', async () => {
        try {
          await bankInstance.setProductsContractAddress(productsInstance.address, {
            from: admin,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('success if called by owner and emergency stop is enabled', async () => {
        await bankInstance.setProductsContractAddress(productsInstance.address, {
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

    let createdStoreId;
    let createdProductId;

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

      createdStoreId = (await storesInstance.storeIdCounter()).add(1);
      await storesInstance.addStore(getRandomBytes32(), { from: storeowner1 });

      createdProductId = (await productsInstance.productIdCounter()).add(1);
      await productsInstance.addProduct(createdStoreId, getRandomBytes32(), web3.utils.toWei('1'), '5', { from: storeowner1 });
    });

    // can only be called by calling Products.purchaseProduct
    describe('addFunds(address storeowner_, uint amount_)', () => {
      it('error when not sending ETH to this method', async () => {
        try {
          await productsInstance.purchaseProduct(createdProductId, '1', {
            from: shopper,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if account is not a shopper (admin)', async () => {
        try {
          await productsInstance.purchaseProduct(createdProductId, '1', {
            from: admin,
            value: web3.utils.toWei('1'),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if account is not a shopper (storeowner, of this product\'s store)', async () => {
        try {
          await productsInstance.purchaseProduct(createdProductId, '1', {
            from: storeowner1,
            value: web3.utils.toWei('1'),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if account is not a shopper (storeowner, not of this product\'s store)', async () => {
        try {
          await productsInstance.purchaseProduct(createdProductId, '1', {
            from: storeowner2,
            value: web3.utils.toWei('1'),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if no first argument (uint productId_)', async () => {
        try {
          await productsInstance.purchaseProduct(undefined, '1', {
            from: shopper,
            value: web3.utils.toWei('1'),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if no second argument (uint quantity)', async () => {
        try {
          await productsInstance.purchaseProduct(createdProductId, undefined, {
            from: shopper,
            value: web3.utils.toWei('1'),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if third argument', async () => {
        try {
          await productsInstance.purchaseProduct(createdProductId, '1', 'some arg', {
            from: shopper,
            value: web3.utils.toWei('1'),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if emergency stop enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        try {
          await productsInstance.purchaseProduct(createdProductId, '1', {
            from: shopper,
            value: web3.utils.toWei('1'),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('success if account is shopper, proudct exists and price * quantiy >= msg.value', async () => {
        const oldBankBalance = await bankInstance.addressToBalance(storeowner1);
        assert(oldBankBalance.eq(0), 'initial Bank balance should be zero');

        const tx = await productsInstance.purchaseProduct(createdProductId, '1', {
          from: shopper,
          value: web3.utils.toWei('1'),
        });
        truffleAssert.eventEmitted(tx, 'ProductPurchased', ev => (
          ev.productId.eq(createdProductId) &&
          ev.buyer === shopper &&
          ev.quantity.eq(1) &&
          ev.price.eq(web3.utils.toWei('1'))
        ), 'ProductPurchased should be emitted with correct parameters');

        const newBankBalance = await bankInstance.addressToBalance(storeowner1);
        const profit = newBankBalance.sub(oldBankBalance);
        assert(newBankBalance.eq(web3.utils.toWei('1')), 'new bank balance should be 1');
        assert(profit.eq(web3.utils.toWei('1')), 'bank balance should have increased by 1 eth');
      });

      it('success if account is correct storeowner and all arguments are valid, 2 products', async () => {
        // 1
        {
          const oldBankBalance = await bankInstance.addressToBalance(storeowner1);
          assert(oldBankBalance.eq(0), 'initial Bank balance should be zero');

          const tx = await productsInstance.purchaseProduct(createdProductId, '1', {
            from: shopper,
            value: web3.utils.toWei('1'),
          });
          truffleAssert.eventEmitted(tx, 'ProductPurchased', ev => (
            ev.productId.eq(createdProductId) &&
            ev.buyer === shopper &&
            ev.quantity.eq(1) &&
            ev.price.eq(web3.utils.toWei('1'))
          ), 'ProductPurchased should be emitted with correct parameters');

          const [onchainProductId, onchainProductStoreId, onchainProductContentHash, onchainProductPrice, onchainProductQuantity] = await productsInstance.getProduct(createdProductId);
          assert(onchainProductId.eq(createdProductId), 'product id should stay the same');
          assert(onchainProductStoreId.eq(createdStoreId), 'product store id should stay the same');
          assert(onchainProductPrice.eq(web3.utils.toWei('1')), 'product price should stay the same');
          assert(onchainProductQuantity.eq(4), 'product quantity should have decreased by 1, to 4');

          const newBankBalance = await bankInstance.addressToBalance(storeowner1);
          const profit = newBankBalance.sub(oldBankBalance);
          assert(newBankBalance.eq(web3.utils.toWei('1')), 'new bank balance should be 1 eth');
          assert(profit.eq(web3.utils.toWei('1')), 'bank balance should have increased by 1 eth');
        }
        // 2
        {
          const oldBankBalance = await bankInstance.addressToBalance(storeowner1);
          assert(oldBankBalance.eq(web3.utils.toWei('1')), 'initial Bank balance should be 1 eth');

          const tx = await productsInstance.purchaseProduct(createdProductId, '1', {
            from: shopper,
            value: web3.utils.toWei('1'),
          });
          truffleAssert.eventEmitted(tx, 'ProductPurchased', ev => (
            ev.productId.eq(createdProductId) &&
            ev.quantity.eq(1) &&
            ev.price.eq(web3.utils.toWei('1'))
          ), 'ProductPurchased should be emitted with correct parameters');

          const [onchainProductId, onchainProductStoreId, onchainProductContentHash, onchainProductPrice, onchainProductQuantity] = await productsInstance.getProduct(createdProductId);
          assert(onchainProductId.eq(createdProductId), 'product id should stay the same');
          assert(onchainProductStoreId.eq(createdStoreId), 'product store id should stay the same');
          assert(onchainProductPrice.eq(web3.utils.toWei('1')), 'product price should stay the same');
          assert(onchainProductQuantity.eq(3), 'product quantity should have decreased by 1, to 3');

          const newBankBalance = await bankInstance.addressToBalance(storeowner1);
          const profit = newBankBalance.sub(oldBankBalance);
          assert(newBankBalance.eq(web3.utils.toWei('2')), 'new bank balance should be 2 eth');
          assert(profit.eq(web3.utils.toWei('1')), 'bank balance should have increased by 1 eth');
        }
      });
    });

    describe('withdraw()', () => {
      beforeEach(async () => {
        await productsInstance.purchaseProduct(createdProductId, '1', {
          from: shopper,
          value: web3.utils.toWei('1'),
        });
      });
      it('error when trying to send ETH to this method', async () => {
        try {
          await bankInstance.withdraw({
            from: storeowner1,
            value: web3.utils.toWei('1'),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error when passing in arg1', async () => {
        try {
          await bankInstance.withdraw('1', {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if there is no balance to withdraw', async () => {
        try {
          await bankInstance.withdraw({
            from: storeowner2,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('success if there is a balance to withdraw and emergency stop disabled', async () => {
        const oldBalance = web3.utils.toBN(await web3.eth.getBalance(storeowner1));
        const oldBankBalance = await bankInstance.addressToBalance(storeowner1);
        assert(oldBankBalance.eq(web3.utils.toWei('1')), 'initial Bank balance should be 1 eth');

        await bankInstance.withdraw({ from: storeowner1 });

        const newBankBalance = await bankInstance.addressToBalance(storeowner1);
        assert(newBankBalance.eq(0), 'new bank balance should be 0 eth');

        const newBalance = web3.utils.toBN(await web3.eth.getBalance(storeowner1));

        const balanceIncrease = newBalance.sub(oldBalance);
        assert(balanceIncrease.lt(web3.utils.toBN(web3.utils.toWei('1'))) && balanceIncrease.gt(web3.utils.toBN(web3.utils.toWei('0.9'))), 'eth balance should increased by a bit less than 1 eth');
      });

      it('success if there is a balance to withdraw and circuti breaker enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        const oldBalance = web3.utils.toBN(await web3.eth.getBalance(storeowner1));
        const oldBankBalance = await bankInstance.addressToBalance(storeowner1);
        assert(oldBankBalance.eq(web3.utils.toWei('1')), 'initial Bank balance should be 1 eth');

        await bankInstance.withdraw({ from: storeowner1 });

        const newBankBalance = await bankInstance.addressToBalance(storeowner1);
        assert(newBankBalance.eq(0), 'new bank balance should be 0 eth');

        const newBalance = web3.utils.toBN(await web3.eth.getBalance(storeowner1));

        const balanceIncrease = newBalance.sub(oldBalance);
        assert(balanceIncrease.lt(web3.utils.toBN(web3.utils.toWei('1'))) && balanceIncrease.gt(web3.utils.toBN(web3.utils.toWei('0.9'))), 'eth balance should increased by a bit less than 1 eth');
      });
    });
  });

  describe('Getters', () => {
    let breakerInstance;
    let bankInstance;

    before(async () => {
      breakerInstance = await EmergencyStop.new({ from: deployer });
      bankInstance = await Bank.new(breakerInstance.address, { from: deployer });
      const usersInstance = await Users.new(breakerInstance.address, { from: deployer });
      const storesInstance = await Stores.new(breakerInstance.address, usersInstance.address, { from: deployer });
      const productsInstance = await Products.new(breakerInstance.address, usersInstance.address, storesInstance.address, bankInstance.address, { from: deployer });

      await bankInstance.setProductsContractAddress(productsInstance.address, { from: deployer });
      await storesInstance.setProductsContract(productsInstance.address, { from: deployer });
      await breakerInstance.disableBreaker({ from: deployer });

      await usersInstance.addAdmin(admin, { from: deployer });
      await usersInstance.addStoreowner(storeowner1, { from: admin });
      await usersInstance.addStoreowner(storeowner2, { from: admin });

      const createdStoreId = (await storesInstance.storeIdCounter()).add(1);
      await storesInstance.addStore(getRandomBytes32(), { from: storeowner1 });

      const createdProductId = (await productsInstance.productIdCounter()).add(1);
      await productsInstance.addProduct(createdStoreId, getRandomBytes32(), web3.utils.toWei('1'), '5', { from: storeowner1 });

      await productsInstance.purchaseProduct(createdProductId, '1', { from: shopper, value: web3.utils.toWei('1') });
    });

    describe('function addressToBalance()', () => {
      it('success returns zero if address has no balance', async () => {
        const addressBalance = await bankInstance.addressToBalance(storeowner2);
        assert(addressBalance.eq(0), 'bank store balance should be zero');
      });
      it('success returns correct balance of address with a balance', async () => {
        const addressBalance = await bankInstance.addressToBalance(storeowner1);
        assert(addressBalance.eq(web3.utils.toWei('1')), 'bank store balance should be 1 eth');
      });
      it('success returns correct balance of address with a balance when emergency stop enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        const addressBalance = await bankInstance.addressToBalance(storeowner1);
        assert(addressBalance.eq(web3.utils.toWei('1')), 'bank store balance should be 1 eth');
      });
    });
  });
});
