/* eslint-env node, mocha */
/* global artifacts, contract, assert */
/* eslint-disable no-await-in-loop, max-len, no-unused-vars */

const EmergencyStop = artifacts.require('EmergencyStop');
const Bank = artifacts.require('Bank');
const Users = artifacts.require('Users');
const Stores = artifacts.require('Stores');
const Products = artifacts.require('Products');
const truffleAssert = require('truffle-assertions');
const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

const ADDR_ZERO = '0x0000000000000000000000000000000000000000';
const BYTES32_ZEROED = '0x0000000000000000000000000000000000000000000000000000000000000000';

// instead of transforming a real IPFS hash to bytes32, we a re just gonna generate
// some random bytes32
const getRandomBytes32 = () => (
  web3.utils.randomHex(32)
);

contract('Product', (accounts) => {
  const [deployer, admin, storeowner1, storeowner2, shopper] = accounts;

  describe('Instantiation', () => {
    let breakerInstance;
    let bankInstance;
    let usersInstance;
    let storesInstance;

    beforeEach(async () => {
      breakerInstance = await EmergencyStop.new({ from: deployer });
      bankInstance = await Bank.new(breakerInstance.address, { from: deployer });
      usersInstance = await Users.new(breakerInstance.address, { from: deployer });
      storesInstance = await Stores.new(breakerInstance.address, usersInstance.address, { from: deployer });
    });

    it('error if not passing address arg1', async () => {
      try {
        await Products.new(undefined, usersInstance.address, storesInstance.address, bankInstance.address, { from: deployer });
      } catch (err) {
        return;
      }
      assert(false, 'should have thrown');
    });
    it('error if not passing address arg2', async () => {
      try {
        await Products.new(breakerInstance.address, undefined, storesInstance.address, bankInstance.address, { from: deployer });
      } catch (err) {
        return;
      }
      assert(false, 'should have thrown');
    });
    it('error if not passing address arg3', async () => {
      try {
        await Products.new(breakerInstance.address, usersInstance.address, undefined, bankInstance.address, { from: deployer });
      } catch (err) {
        return;
      }
      assert(false, 'should have thrown');
    });
    it('error if not passing address arg4', async () => {
      try {
        await Products.new(breakerInstance.address, usersInstance.address, storesInstance.address, undefined, { from: deployer });
      } catch (err) {
        return;
      }
      assert(false, 'should have thrown');
    });
    it('error if passing address(0) as arg1', async () => {
      try {
        await Products.new(ADDR_ZERO, usersInstance.address, storesInstance.address, bankInstance.address, { from: deployer });
      } catch (err) {
        return;
      }
      assert(false, 'should have thrown');
    });
    it('error if passing address(0) as arg2', async () => {
      try {
        await Products.new(breakerInstance.address, ADDR_ZERO, storesInstance.address, bankInstance.address, { from: deployer });
      } catch (err) {
        return;
      }
      assert(false, 'should have thrown');
    });
    it('error if passing address(0) as arg3', async () => {
      try {
        await Products.new(breakerInstance.address, usersInstance.address, ADDR_ZERO, bankInstance.address, { from: deployer });
      } catch (err) {
        return;
      }
      assert(false, 'should have thrown');
    });
    it('error if passing address(0) as arg4', async () => {
      try {
        await Products.new(breakerInstance.address, usersInstance.address, storesInstance.address, ADDR_ZERO, { from: deployer });
      } catch (err) {
        return;
      }
      assert(false, 'should have thrown');
    });
    it('success if passing in a non-zero address as arg1 + arg2 + arg3', async () => {
      await Products.new(breakerInstance.address, usersInstance.address, storesInstance.address, bankInstance.address, { from: deployer });
    });
  });

  describe('Setters', () => {
    let breakerInstance;
    let usersInstance;
    let storesInstance;
    let productsInstance;
    let bankInstance;

    beforeEach(async () => {
      breakerInstance = await EmergencyStop.new({ from: deployer });
      bankInstance = await Bank.new(breakerInstance.address, { from: deployer });
      usersInstance = await Users.new(breakerInstance.address, { from: deployer });
      storesInstance = await Stores.new(breakerInstance.address, usersInstance.address, { from: deployer });
      productsInstance = await Products.new(breakerInstance.address, usersInstance.address, storesInstance.address, bankInstance.address, { from: deployer });

      await bankInstance.setProductsContractAddress(productsInstance.address, { from: deployer });
      await storesInstance.setProductsContract(productsInstance.address, { from: deployer });
      await breakerInstance.disableBreaker({ from: deployer });

      await usersInstance.addAdmin(admin, { from: deployer });
      await usersInstance.addStoreowner(storeowner1, { from: admin });
      await usersInstance.addStoreowner(storeowner2, { from: admin });
    });

    describe('addProduct(uint storeId_, bytes32 contentHash_, uint price_, uint quantity_)', () => {
      let createdStoreId;

      beforeEach(async () => {
        createdStoreId = (await storesInstance.storeIdCounter()).add(1);

        await storesInstance.addStore(getRandomBytes32(), {
          from: storeowner1,
        });
      });

      it('error when trying to send ETH to this method', async () => {
        try {
          await productsInstance.addProduct(createdStoreId, getRandomBytes32(), web3.utils.toWei('1'), '5', {
            from: storeowner1,
            value: web3.toWei(1),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if account is not a storeowner (shopper)', async () => {
        try {
          await productsInstance.addProduct(createdStoreId, getRandomBytes32(), web3.utils.toWei('1'), '5', {
            from: shopper,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if account is not a storeowner (admin)', async () => {
        try {
          await productsInstance.addProduct(createdStoreId, getRandomBytes32(), web3.utils.toWei('1'), '5', {
            from: admin,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if account is a storeowner, but not of the store we set as product.storeId', async () => {
        try {
          await productsInstance.addProduct(createdStoreId, getRandomBytes32(), web3.utils.toWei('1'), '5', {
            from: storeowner2,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if no first argument (uint storeId_)', async () => {
        try {
          await productsInstance.addProduct(undefined, getRandomBytes32(), web3.utils.toWei('1'), '5', {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if no second argument (bytes32 contentHash_)', async () => {
        try {
          await productsInstance.addProduct(createdStoreId, undefined, web3.utils.toWei('1'), '5', {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if no third argument (uint price_)', async () => {
        try {
          await productsInstance.addProduct(createdStoreId, getRandomBytes32(), undefined, '5', {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if no fourth argument (uint quantity_)', async () => {
        try {
          await productsInstance.addProduct(createdStoreId, getRandomBytes32(), web3.utils.toWei('1'), undefined, {
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
          await productsInstance.addProduct(createdStoreId, getRandomBytes32(), web3.utils.toWei('1'), '5', {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('success if account is correct storeowner and all arguments are valid, 1 product', async () => {
        const expectedProductContentHash = getRandomBytes32();

        const expectedProductId = (await productsInstance.productIdCounter()).add(1);

        const tx = await productsInstance.addProduct(createdStoreId, expectedProductContentHash, web3.utils.toWei('1'), '5', {
          from: storeowner1,
        });

        truffleAssert.eventEmitted(tx, 'ProductAdded', ev => (
          ev.productId.eq(expectedProductId) &&
          ev.storeId.eq(createdStoreId)
        ), 'ProductAdded should be emitted with correct parameters');

        const productIdCounter = await productsInstance.productIdCounter();
        assert(productIdCounter.eq(1), 'productIdCounter should have increased to 1');

        const storeProductCount = await productsInstance.getStoreProductCount(createdStoreId);
        assert(storeProductCount.eq(1), 'storeProductCount should have increased to 1');
      });

      it('success if account is correct storeowner and all arguments are valid, 1 product', async () => {
        // 1
        {
          const expectedProductContentHash = getRandomBytes32();

          const expectedProductId = (await productsInstance.productIdCounter()).add(1);

          // return;
          const tx = await productsInstance.addProduct(createdStoreId, expectedProductContentHash, web3.utils.toWei('1'), '5', {
            from: storeowner1,
          });

          truffleAssert.eventEmitted(tx, 'ProductAdded', ev => (
            ev.productId.eq(expectedProductId) &&
            ev.storeId.eq(createdStoreId)
          ), 'ProductAdded should be emitted with correct parameters');

          const productIdCounter = await productsInstance.productIdCounter();
          assert(productIdCounter.eq(1), 'productIdCounter should have increased to 1');

          const storeProductCount = await productsInstance.getStoreProductCount(createdStoreId);
          assert(storeProductCount.eq(1), 'storeProductCount should have increased to 1');
        }
        // 2
        {
          const expectedProductContentHash = getRandomBytes32();

          const expectedProductId = (await productsInstance.productIdCounter()).add(1);

          const tx = await productsInstance.addProduct(createdStoreId, expectedProductContentHash, web3.utils.toWei('1'), '5', {
            from: storeowner1,
          });

          truffleAssert.eventEmitted(tx, 'ProductAdded', ev => (
            ev.productId.eq(expectedProductId) &&
            ev.storeId.eq(createdStoreId)
          ), 'ProductAdded should be emitted with correct parameters');

          const productIdCounter = await productsInstance.productIdCounter();
          assert(productIdCounter.eq(2), 'productIdCounter should have increased to 2');

          const storeProductCount = await productsInstance.getStoreProductCount(createdStoreId);
          assert(storeProductCount.eq(2), 'storeProductCount should have increased to 2');
        }
      });
    });

    describe('removeProduct(uint storeId_)', () => {
      let createdStoreId;
      let createdProductId;

      beforeEach(async () => {
        createdStoreId = (await storesInstance.storeIdCounter()).add(1);

        await storesInstance.addStore(getRandomBytes32(), {
          from: storeowner1,
        });

        createdProductId = (await productsInstance.productIdCounter()).add(1);

        await productsInstance.addProduct(createdStoreId, getRandomBytes32(), web3.utils.toWei('1'), '5', {
          from: storeowner1,
        });
      });

      it('error when trying to send ETH to this method', async () => {
        try {
          await storesInstance.removeProduct(createdProductId, {
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
          await storesInstance.removeProduct(createdProductId, {
            from: shopper,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if account is not the storeowner of the store of the product', async () => {
        try {
          await storesInstance.removeProduct(createdProductId, {
            from: storeowner2,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if product does not exist', async () => {
        try {
          await storesInstance.removeProduct('3', {
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
          await productsInstance.removeProduct(createdProductId, {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('success if product exists and account owns store which owns product', async () => {
        const tx = await productsInstance.removeProduct(createdProductId, {
          from: storeowner1,
        });

        truffleAssert.eventEmitted(tx, 'ProductRemoved', ev => (
          ev.productId.eq(createdProductId) &&
          ev.storeId.eq(createdStoreId)
        ), 'ProductRemoved should be emitted with correct parameters');

        const storeIdCounter = await storesInstance.storeIdCounter();
        assert(storeIdCounter.eq(1), 'storeIdCounter should stay the same, 1');

        const ownerStoreIdCount = await storesInstance.getOwnerStoreCount(storeowner1);
        assert(ownerStoreIdCount.eq(1), 'ownerStoreIdCount should stay the same, 1');

        const productIdCounter = await productsInstance.productIdCounter();
        assert(productIdCounter.eq(1), 'productIdCounter should stay the same, 1');

        const storeProductCount = await productsInstance.getStoreProductCount(createdStoreId);
        assert(storeProductCount.eq(0), 'storeProductCount should have decreased 1, to 0');
      });
    });

    describe('updateProductContent(uint productId_, bytes32 newContentHash_)', () => {
      let createdStoreId;
      let createdProductId;
      let originalProductContentHash;
      let originalProductPrice;
      let originalProductQuantity;

      beforeEach(async () => {
        createdStoreId = (await storesInstance.storeIdCounter()).add(1);

        await storesInstance.addStore(getRandomBytes32(), {
          from: storeowner1,
        });

        createdProductId = (await productsInstance.productIdCounter()).add(1);

        originalProductContentHash = getRandomBytes32();
        originalProductPrice = web3.utils.toWei('1');
        originalProductQuantity = '5';

        await productsInstance.addProduct(
          createdStoreId,
          originalProductContentHash,
          originalProductPrice,
          originalProductQuantity,
          { from: storeowner1 },
        );
      });

      it('error when trying to send ETH to this method', async () => {
        try {
          await productsInstance.updateProductContent(createdProductId, getRandomBytes32(), {
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
          await productsInstance.updateProductContent(createdProductId, getRandomBytes32(), {
            from: shopper,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if account is not the storeowner of the store of the product', async () => {
        try {
          await productsInstance.updateProductContent(createdProductId, getRandomBytes32(), {
            from: storeowner2,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if product does not exist', async () => {
        try {
          await productsInstance.updateProductContent('7', getRandomBytes32(), {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if not sending arg2', async () => {
        try {
          await productsInstance.updateProductContent(createdProductId, undefined, {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if sending bytes 0x0 as arg2, product content hash cannot be 0x0 ', async () => {
        try {
          await productsInstance.updateProductContent(createdProductId, BYTES32_ZEROED, {
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
          await productsInstance.updateProductContent(createdProductId, getRandomBytes32(), {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('success if product exists and account owns store which owns product and new content hash is valid', async () => {
        const updatedProductContentHash = getRandomBytes32();

        const tx = await productsInstance.updateProductContent(createdProductId, updatedProductContentHash, {
          from: storeowner1,
        });

        truffleAssert.eventEmitted(tx, 'ProductUpdatedContent', ev => (
          ev.productId.eq(createdProductId) &&
          ev.oldContentHash === originalProductContentHash &&
          ev.newContentHash === updatedProductContentHash
        ), 'ProductUpdatedContent should be emitted with correct parameters');

        const storeIdCounter = await storesInstance.storeIdCounter();
        assert(storeIdCounter.eq(1), 'storeIdCounter should stay the same, 1');

        const ownerStoreIdCount = await storesInstance.getOwnerStoreCount(storeowner1);
        assert(ownerStoreIdCount.eq(1), 'ownerStoreIdCount should stay the same, 1');

        const productIdCounter = await productsInstance.productIdCounter();
        assert(productIdCounter.eq(1), 'productIdCounter should stay the same, 1');

        const storeProductCount = await productsInstance.getStoreProductCount(createdStoreId);
        assert(storeProductCount.eq(1), 'storeProductCount should stay the same, 1');

        const [onchainProductId, onchainProductStoreId, onchainProductContentHash, onchainProductPrice, onchainProductQuantity] = await productsInstance.getProduct(createdProductId);
        assert(onchainProductId.eq(createdProductId), 'product.id is not the expected product id');
        assert(onchainProductStoreId.eq(createdStoreId), 'store id is not the expected new content hash');
        assert(onchainProductContentHash === updatedProductContentHash, 'content hash should have updated to new contentHash');
        assert(onchainProductPrice.eq(originalProductPrice), 'price should stay the same, 1');
        assert(onchainProductQuantity.eq(originalProductQuantity), 'quantity should stay the same, 5');
      });
    });

    describe('updateProductPrice(uint productId_, uint newPrice_)', () => {
      let createdStoreId;
      let createdProductId;
      let originalProductContentHash;
      let originalProductPrice;
      let originalProductQuantity;

      beforeEach(async () => {
        createdStoreId = (await storesInstance.storeIdCounter()).add(1);

        await storesInstance.addStore(getRandomBytes32(), {
          from: storeowner1,
        });

        createdProductId = (await productsInstance.productIdCounter()).add(1);

        originalProductContentHash = getRandomBytes32();
        originalProductPrice = web3.utils.toWei('1');
        originalProductQuantity = '5';

        await productsInstance.addProduct(
          createdStoreId,
          originalProductContentHash,
          originalProductPrice,
          originalProductQuantity,
          { from: storeowner1 },
        );
      });

      it('error when trying to send ETH to this method', async () => {
        try {
          await productsInstance.updateProductPrice(createdProductId, getRandomBytes32(), {
            from: storeowner1,
            value: web3.toWei(1),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if account is not a storeowner (shopper)', async () => {
        try {
          await productsInstance.updateProductPrice(createdProductId, '2', {
            from: shopper,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if account is not a storeowner (admin)', async () => {
        try {
          await productsInstance.updateProductPrice(createdProductId, '2', {
            from: admin,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if account is not the storeowner of the store of the product', async () => {
        try {
          await productsInstance.updateProductPrice(createdProductId, '2', {
            from: storeowner2,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if product does not exist', async () => {
        try {
          await productsInstance.updateProductPrice('7', '2', {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if not sending arg2', async () => {
        try {
          await productsInstance.updateProductPrice(createdProductId, undefined, {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if sending zero as arg2, product needs to have a price > 0', async () => {
        try {
          await productsInstance.updateProductPrice(createdProductId, '0', {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });

      it('error if sending zero as arg2, product needs to have a price > 0', async () => {
        try {
          await productsInstance.updateProductPrice(createdProductId, '0', {
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
          await productsInstance.updateProductPrice(createdProductId, web3.utils.toWei('2'), {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('success if product exists and account owns store which owns product and new price is valid', async () => {
        const updatedProductPrice = web3.utils.toWei('2');

        const tx = await productsInstance.updateProductPrice(createdProductId, updatedProductPrice, {
          from: storeowner1,
        });

        truffleAssert.eventEmitted(tx, 'ProductUpdatedPrice', ev => (
          ev.productId.eq(createdProductId) &&
          ev.oldPrice.eq(originalProductPrice) &&
          ev.newPrice.eq(updatedProductPrice)
        ), 'ProductUpdatedPrice should be emitted with correct parameters');

        const storeIdCounter = await storesInstance.storeIdCounter();
        assert(storeIdCounter.eq(1), 'storeIdCounter should stay the same, 1');

        const ownerStoreIdCount = await storesInstance.getOwnerStoreCount(storeowner1);
        assert(ownerStoreIdCount.eq(1), 'ownerStoreIdCount should stay the same, 1');

        const productIdCounter = await productsInstance.productIdCounter();
        assert(productIdCounter.eq(1), 'productIdCounter should stay the same, 1');

        const storeProductCount = await productsInstance.getStoreProductCount(createdStoreId);
        assert(storeProductCount.eq(1), 'storeProductCount should stay the same, 1');

        const [onchainProductId, onchainProductStoreId, onchainProductContentHash, onchainProductPrice, onchainProductQuantity] = await productsInstance.getProduct(createdProductId);
        assert(onchainProductId.eq(createdProductId), 'product.id should stay the same');
        assert(onchainProductStoreId.eq(createdStoreId), 'store id should stay the same');
        assert(onchainProductContentHash === originalProductContentHash, 'content hash should stay the same');
        assert(onchainProductPrice.eq(updatedProductPrice), 'price should have updated to the new price, 7');
        assert(onchainProductQuantity.eq(originalProductQuantity), 'quantity should stay the same, 5');
      });
    });

    describe('updateProductContentAndPrice(uint productId_, bytes32 newContentHash_, uint newPrice_)', () => {
      let createdStoreId;
      let createdProductId;
      let originalProductContentHash;
      let originalProductPrice;
      let originalProductQuantity;

      beforeEach(async () => {
        createdStoreId = (await storesInstance.storeIdCounter()).add(1);

        await storesInstance.addStore(getRandomBytes32(), {
          from: storeowner1,
        });

        createdProductId = (await productsInstance.productIdCounter()).add(1);

        originalProductContentHash = getRandomBytes32();
        originalProductPrice = web3.utils.toWei('1');
        originalProductQuantity = '5';

        await productsInstance.addProduct(
          createdStoreId,
          originalProductContentHash,
          originalProductPrice,
          originalProductQuantity,
          { from: storeowner1 },
        );
      });

      it('error when trying to send ETH to this method', async () => {
        try {
          await productsInstance.updateProductContentAndPrice(createdProductId, getRandomBytes32(), '2', {
            from: storeowner1,
            value: web3.toWei(1),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if account is not a storeowner (shopper)', async () => {
        try {
          await productsInstance.updateProductContentAndPrice(createdProductId, getRandomBytes32(), '2', {
            from: shopper,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if account is not a storeowner (admin)', async () => {
        try {
          await productsInstance.updateProductContentAndPrice(createdProductId, getRandomBytes32(), '2', {
            from: admin,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if account is not the storeowner of the store of the product', async () => {
        try {
          await productsInstance.updateProductContentAndPrice(createdProductId, getRandomBytes32(), '2', {
            from: storeowner2,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if product does not exist', async () => {
        try {
          await productsInstance.updateProductContentAndPrice('7', getRandomBytes32(), '2', {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if not sending arg1', async () => {
        try {
          await productsInstance.updateProductContentAndPrice(createdProductId, undefined, '2', {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if not sending arg2', async () => {
        try {
          await productsInstance.updateProductContentAndPrice(createdProductId, getRandomBytes32(), undefined, {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if sending zero as arg2, product needs to have a price > 0', async () => {
        try {
          await productsInstance.updateProductContentAndPrice(createdProductId, '0', {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });

      it('error if sending bytes 0x0 as arg2, product content hash cannot be 0x0 ', async () => {
        try {
          await productsInstance.updateProductContent(createdProductId, BYTES32_ZEROED, '2', {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });

      it('error if sending zero as arg3, product needs to have a price > 0', async () => {
        try {
          await productsInstance.updateProductContentAndPrice(createdProductId, getRandomBytes32(), '0', {
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
          await productsInstance.updateProductContentAndPrice(createdProductId, getRandomBytes32(), web3.utils.toWei('2'), {
            from: storeowner1,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('success if product exists and account owns store which owns product and new price + content hash is valid', async () => {
        const updatedProductContent = getRandomBytes32();
        const updatedProductPrice = web3.utils.toWei('2');

        const tx = await productsInstance.updateProductContentAndPrice(createdProductId, updatedProductContent, updatedProductPrice, {
          from: storeowner1,
        });

        truffleAssert.eventEmitted(tx, 'ProductUpdatedContent', ev => (
          ev.productId.eq(createdProductId) &&
          ev.oldContentHash === originalProductContentHash &&
          ev.newContentHash === updatedProductContent
        ), 'ProductUpdatedContent should be emitted with correct parameters');


        truffleAssert.eventEmitted(tx, 'ProductUpdatedPrice', ev => (
          ev.productId.eq(createdProductId) &&
          ev.oldPrice.eq(originalProductPrice) &&
          ev.newPrice.eq(updatedProductPrice)
        ), 'ProductUpdatedPrice should be emitted with correct parameters');

        const storeIdCounter = await storesInstance.storeIdCounter();
        assert(storeIdCounter.eq(1), 'storeIdCounter should stay the same, 1');

        const ownerStoreIdCount = await storesInstance.getOwnerStoreCount(storeowner1);
        assert(ownerStoreIdCount.eq(1), 'ownerStoreIdCount should stay the same, 1');

        const productIdCounter = await productsInstance.productIdCounter();
        assert(productIdCounter.eq(1), 'productIdCounter should stay the same, 1');

        const storeProductCount = await productsInstance.getStoreProductCount(createdStoreId);
        assert(storeProductCount.eq(1), 'storeProductCount should stay the same, 1');

        const [onchainProductId, onchainProductStoreId, onchainProductContentHash, onchainProductPrice, onchainProductQuantity] = await productsInstance.getProduct(createdProductId);
        assert(onchainProductId.eq(createdProductId), 'product.id should stay the same');
        assert(onchainProductStoreId.eq(createdStoreId), 'store id should stay the same');
        assert(onchainProductContentHash === updatedProductContent, 'content hash should have updated to the new content hash');
        assert(onchainProductPrice.eq(updatedProductPrice), 'price should have updated to the new price, 7');
        assert(onchainProductQuantity.eq(originalProductQuantity), 'quantity should stay the same, 5');
      });
    });

    describe('purchaseProduct(uint productId_, uint quantity_)', () => {
      let createdStoreId;
      let createdProductId;
      let originalProductContentHash;
      let originalProductPrice;
      let originalProductQuantity;

      beforeEach(async () => {
        createdStoreId = (await storesInstance.storeIdCounter()).add(1);

        await storesInstance.addStore(getRandomBytes32(), {
          from: storeowner1,
        });

        createdProductId = (await productsInstance.productIdCounter()).add(1);

        originalProductContentHash = getRandomBytes32();
        originalProductPrice = web3.utils.toWei('1');
        originalProductQuantity = '5';

        await productsInstance.addProduct(
          createdStoreId,
          originalProductContentHash,
          originalProductPrice,
          originalProductQuantity,
          { from: storeowner1 },
        );
      });

      it('error if account is not a shopper (storeowner)', async () => {
        try {
          await productsInstance.purchaseProduct(createdProductId, web3.utils.toWei('1'), {
            from: storeowner1,
            value: web3.utils.toWei('1'),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if account is not a shopper (admin)', async () => {
        try {
          await productsInstance.purchaseProduct(createdProductId, web3.utils.toWei('1'), {
            from: admin,
            value: web3.utils.toWei('1'),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if product does not exist', async () => {
        try {
          await productsInstance.purchaseProduct(123, web3.utils.toWei('1'), {
            from: shopper,
            value: web3.utils.toWei('1'),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if not sending arg1 productId', async () => {
        try {
          await productsInstance.purchaseProduct(undefined, web3.utils.toWei('1'), {
            from: shopper,
            value: web3.utils.toWei('1'),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if not sending arg2 buyQuantity', async () => {
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
      it('error if sending not enough ETH to purchase product.price * quantity (too high quantity)', async () => {
        try {
          await productsInstance.purchaseProduct(createdProductId, '2', {
            from: shopper,
            value: web3.utils.toWei('1'),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });

      it('error if sending not enough ETH to purchase product.price * quantity (not enough ETH too buy only 1)', async () => {
        try {
          await productsInstance.purchaseProduct(createdProductId, '1', {
            from: shopper,
            value: web3.utils.toWei('0.9'),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error if emergency stop enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        try {
          await productsInstance.purchaseProduct(createdProductId, '2', {
            from: shopper,
            value: web3.utils.toWei('2'),
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('success if product exists and account is a shopper and send ETH >= product.price * quantity', async () => {
        const originalBalance = web3.utils.toBN(await web3.eth.getBalance(shopper));

        // we're gonna buy this product 2 times
        const sendEth = web3.utils.toWei('2');
        const buyQuantity = '2';

        const tx = await productsInstance.purchaseProduct(createdProductId, buyQuantity, {
          from: shopper,
          value: sendEth,
        });

        truffleAssert.eventEmitted(tx, 'ProductPurchased', ev => (
          ev.productId.eq(createdProductId) &&
          ev.quantity.eq(buyQuantity) &&
          ev.price.eq(web3.utils.toWei('1'))
        ), 'ProductPurchased should be emitted with correct parameters');

        const productIdCounter = await productsInstance.productIdCounter();
        assert(productIdCounter.eq(1), 'productIdCounter should stay the same, 1');

        const storeProductCount = await productsInstance.getStoreProductCount(createdStoreId);
        assert(storeProductCount.eq(1), 'storeProductCount should stay the same, 1');

        const [onchainProductId, onchainProductStoreId, onchainProductContentHash, onchainProductPrice, onchainProductQuantity] = await productsInstance.getProduct(createdProductId);
        assert(onchainProductId.eq(createdProductId), 'product.id should stay the same');
        assert(onchainProductStoreId.eq(createdStoreId), 'store id should stay the same');
        assert(onchainProductContentHash === originalProductContentHash, 'content hash should stay the same');
        assert(onchainProductPrice.eq(originalProductPrice), 'price should stay the same, 1');
        assert(onchainProductQuantity.eq(3), 'quantity should have decreased by 2, 5 to 3');

        const newBalance = web3.utils.toBN(await web3.eth.getBalance(shopper));
        const cost = originalBalance.sub(newBalance);

        assert(
          cost.gt(web3.utils.toBN(web3.utils.toWei('2')))
          && cost.lt(web3.utils.toBN(web3.utils.toWei('2.01'))),
          'shopper balance shoul\'ve decreased by a little more than 2',
        );
      });
    });
  });

  describe('Getters', () => {
    let breakerInstance;
    let bankInstance;
    let usersInstance;
    let storesInstance;
    let productsInstance;

    let createdStoreId;
    let createdProducts = [];

    beforeEach(async () => {
      createdProducts = [];
      createdStoreId = null;

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

      await storesInstance.addStore(getRandomBytes32(), {
        from: storeowner1,
      });

      // create 10 products in a store
      for (let i = 0; i < 10; i += 1) {
        const expectedProduct = {
          id: (await productsInstance.productIdCounter()).add(1),
          contentHash: getRandomBytes32(),
          storeId: createdStoreId,
          price: web3.utils.toWei('1'),
          quantity: '5',
        };

        const tx = await productsInstance.addProduct(
          expectedProduct.storeId,
          expectedProduct.contentHash,
          expectedProduct.price,
          expectedProduct.quantity,
          { from: storeowner1 },
        );

        truffleAssert.eventEmitted(tx, 'ProductAdded', ev => (
          ev.productId.eq(expectedProduct.id) &&
          ev.storeId.eq(expectedProduct.storeId)
        ), 'ProductAdded should be emitted with correct parameters');

        createdProducts.push(expectedProduct);
      }
    });

    describe('productIdCounter(uint index)', () => {
      it('error does not accept an arg1', async () => {
        try {
          await productsInstance.productIdCounter(1, {
            from: shopper,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('success returns correct product id counter value', async () => {
        const productIdCounter = await productsInstance.productIdCounter();
        assert(productIdCounter.eq(10), 'productIdCounter should be 10');
      });
      it('success returns correct product id counter value when emergency stop enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        const productIdCounter = await productsInstance.productIdCounter();
        assert(productIdCounter.eq(10), 'productIdCounter should be 10');
      });
    });

    describe('getStoreProductCount(uint storeId_)', () => {
      it('returns correct product count of a store', async () => {
        const storeProductCount = await productsInstance.getStoreProductCount(createdStoreId);
        assert(storeProductCount.eq(10), 'store should have 10 products');
      });
      it('returns correct product count of a store when emergency stop enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        const storeProductCount = await productsInstance.getStoreProductCount(createdStoreId);
        assert(storeProductCount.eq(10), 'store should have 10 products');
      });
    });

    describe('getProduct(uint productId_)', () => {
      it('error if no arg1', async () => {
        try {
          await productsInstance.getProduct(undefined, {
            from: shopper,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('returns correct product', async () => {
        const [onchainProductId, onchainProductStoreId, onchainProductContentHash, onchainProductPrice, onchainProductQuantity] = await productsInstance.getProduct(createdProducts[0].id);
        assert(onchainProductId.eq(createdProducts[0].id), 'product id did not match expected');
        assert(onchainProductStoreId.eq(createdProducts[0].storeId), 'product store id did not match expected');
        assert(onchainProductContentHash === createdProducts[0].contentHash, 'product content hash did not match expected');
        assert(onchainProductPrice.eq(createdProducts[0].price), 'product price did not match expected');
        assert(onchainProductQuantity.eq(createdProducts[0].quantity), 'product quantity did not match expected');
      });
      it('returns correct product when emergency stop enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        const [onchainProductId, onchainProductStoreId, onchainProductContentHash, onchainProductPrice, onchainProductQuantity] = await productsInstance.getProduct(createdProducts[0].id);
        assert(onchainProductId.eq(createdProducts[0].id), 'product id did not match expected');
        assert(onchainProductStoreId.eq(createdProducts[0].storeId), 'product store id did not match expected');
        assert(onchainProductContentHash === createdProducts[0].contentHash, 'product content hash did not match expected');
        assert(onchainProductPrice.eq(createdProducts[0].price), 'product price did not match expected');
        assert(onchainProductQuantity.eq(createdProducts[0].quantity), 'product quantity did not match expected');
      });
    });

    describe('productExists(uint productId_)', () => {
      it('returns false if product does not exist', async () => {
        const result = await productsInstance.productExists('99');
        assert(result === false, 'product exists should have returned false');
      });
      it('returns true if product does exist', async () => {
        const result = await productsInstance.productExists(createdProducts[0].id);
        assert(result === true, 'product exists should have returned true');
      });
      it('returns true if product does exist and circuti breaker enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        const result = await productsInstance.productExists(createdProducts[0].id);
        assert(result === true, 'product exists should have returned true');
      });
    });

    describe('productIsOwnedBy(uint productId_, address addr_)', () => {
      it('returns false if product is not owned by addr_', async () => {
        const result = await productsInstance.productIsOwnedBy(createdProducts[0].id, shopper);
        assert(result === false, 'product is owned by should have returned false');
      });
      it('returns true if product is owned by addr_', async () => {
        const result = await productsInstance.productIsOwnedBy(createdProducts[0].id, storeowner1);
        assert(result === true, 'product is owned by should have returned true');
      });
      it('returns true if product is owned by addr_ and emergency stop enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        const result = await productsInstance.productIsOwnedBy(createdProducts[0].id, storeowner1);
        assert(result === true, 'product is owned by should have returned true');
      });
    });

    describe('storeIdToProductIds(address storeId_, uint index)', () => {
      it('error throws if store id does not exist', async () => {
        try {
          const foundProductId = await productsInstance.storeIdToProductIds(123, 0);
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error throws if productId index does not exist', async () => {
        try {
          const foundProductId = await productsInstance.storeIdToProductIds(createdProducts[0].storeId, 10);
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('returns correct number of products', async () => {
        const storeProductCount = await productsInstance.getStoreProductCount(createdProducts[0].storeId);

        assert(storeProductCount.eq(10), 'there should be 10 stores');

        for (let i = 0; i < storeProductCount; i += 1) {
          const foundProductId = await productsInstance.storeIdToProductIds(createdProducts[0].storeId, i);
          assert(!foundProductId.eq(0), 'product id should never be zero');
          const expectedProductItem = createdProducts[i];
          assert(expectedProductItem.id.eq(foundProductId), 'product id should match expected');
        }
      });
      it('returns correct number of products when circuti breaker enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });

        const storeProductCount = await productsInstance.getStoreProductCount(createdProducts[0].storeId);

        assert(storeProductCount.eq(10), 'there should be 10 stores');

        for (let i = 0; i < storeProductCount; i += 1) {
          const foundProductId = await productsInstance.storeIdToProductIds(createdProducts[0].storeId, i);
          assert(!foundProductId.eq(0), 'product id should never be zero');
          const expectedProductItem = createdProducts[i];
          assert(expectedProductItem.id.eq(foundProductId), 'product id should match expected');
        }
      });
    });
  });
});
