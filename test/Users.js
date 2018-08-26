/* eslint-env node, mocha */
/* global artifacts, web3, contract, assert */

const EmergencyStop = artifacts.require('EmergencyStop');
const Users = artifacts.require('Users');
const truffleAssert = require('truffle-assertions');

contract('Users', (accounts) => {
  const [deployer, admin, storeowner, shopper1, shopper2] = accounts;

  describe('Instantiation', () => {
    let breakerInstance;

    beforeEach(async () => {
      breakerInstance = await EmergencyStop.new({ from: deployer });
    });

    it('error if not passing address as arg1', async () => {
      try {
        await Users.new(undefined, { from: deployer });
      } catch (err) {
        return;
      }
      assert(false, 'should have thrown');
    });

    it('success if passing in address as arg1', async () => {
      const usersInstance = await Users.new(breakerInstance.address, { from: deployer });
      assert(usersInstance);
      const imAdmin = await usersInstance.isAdmin(deployer);
      assert(imAdmin, 'deployer should\'ve been set as admin');
    });
  });

  describe('fallback function', () => {
    let breakerInstance;
    let usersInstance;

    beforeEach(async () => {
      breakerInstance = await EmergencyStop.new({ from: deployer });
      usersInstance = await Users.new(breakerInstance.address, { from: deployer });
    });
    it('should throw when sending ETH', async () => {
      try {
        await usersInstance.sendTransaction({ value: 1, from: deployer });
      } catch (err) {
        return;
      }
      assert(false, 'should have thrown');
    });
    it('should throw when not sending ETH', async () => {
      try {
        await usersInstance.sendTransaction({ value: 0, from: deployer });
      } catch (err) {
        return;
      }
      assert(false, 'should have thrown');
    });
  });

  describe('Setters', () => {
    let breakerInstance;
    let usersInstance;

    beforeEach(async () => {
      breakerInstance = await EmergencyStop.new({ from: deployer });
      usersInstance = await Users.new(breakerInstance.address, { from: deployer });
      await breakerInstance.disableBreaker({ from: deployer });
      await usersInstance.addAdmin(admin, { from: deployer });
      await usersInstance.addStoreowner(storeowner, { from: admin });
    });

    describe('Admin', () => {
      describe('addAdmin(address addr_)', () => {
        it('error when trying to send ETH to this method', async () => {
          try {
            await usersInstance.addAdmin(shopper1, {
              from: admin,
              value: web3.toWei(1),
            });
          } catch (err) {
            return;
          }
          assert(false, 'should have thrown');
        });
        it('error if caller is a shopper', async () => {
          try {
            await usersInstance.addAdmin(shopper1, {
              from: shopper2,
            });
          } catch (err) {
            return;
          }
          assert(false, 'should have thrown');
        });
        it('error if caller is a storeowner', async () => {
          try {
            await usersInstance.addAdmin(shopper1, {
              from: storeowner,
            });
          } catch (err) {
            return;
          }
          assert(false, 'should have thrown');
        });
        it('error if new admin is a storeowner', async () => {
          try {
            await usersInstance.addAdmin(storeowner, {
              from: admin,
            });
          } catch (err) {
            return;
          }
          assert(false, 'should have thrown');
        });
        it('error if new admin is the same as caller', async () => {
          try {
            await usersInstance.addAdmin(admin, {
              from: admin,
            });
          } catch (err) {
            return;
          }
          assert(false, 'should have thrown');
        });
        it('error if emergency stop enabled', async () => {
          await breakerInstance.enableBreaker({ from: deployer });
          try {
            await usersInstance.addAdmin(admin, {
              from: admin,
            });
          } catch (err) {
            return;
          }
          assert(false, 'should have thrown');
        });
        it('success if caller is an admin and new admin is a shopper', async () => {
          const tx = await usersInstance.addAdmin(shopper1, {
            from: admin,
          });

          truffleAssert.eventEmitted(tx, 'AdminAdded', ev => (
            ev.newAdmin === shopper1 && ev.byAdmin === admin
          ), 'StoreAdded should be emitted with correct parameters');
        });
      });
    });

    describe('Storeowner', () => {
      describe('addStoreowner(address addr_)', () => {
        it('error when trying to send ETH to this method', async () => {
          try {
            await usersInstance.addStoreowner(shopper1, {
              from: storeowner,
              value: web3.toWei(1),
            });
          } catch (err) {
            return;
          }
          assert(false, 'should have thrown');
        });
        it('error if caller is a shopper', async () => {
          try {
            await usersInstance.addStoreowner(shopper1, {
              from: shopper2,
            });
          } catch (err) {
            return;
          }
          assert(false, 'should have thrown');
        });
        it('error if caller is a storeowner', async () => {
          try {
            await usersInstance.addStoreowner(shopper1, {
              from: storeowner,
            });
          } catch (err) {
            return;
          }
          assert(false, 'should have thrown');
        });
        it('error if new storeowner is already a storeowner', async () => {
          try {
            await usersInstance.addStoreowner(storeowner, {
              from: admin,
            });
          } catch (err) {
            return;
          }
          assert(false, 'should have thrown');
        });
        it('error if emergency stop enabled', async () => {
          await breakerInstance.enableBreaker({ from: deployer });
          try {
            await usersInstance.addStoreowner(shopper1, {
              from: admin,
            });
          } catch (err) {
            return;
          }
          assert(false, 'should have thrown');
        });
        it('success if caller is an admin and new storeowner is a shopper', async () => {
          const tx = await usersInstance.addStoreowner(shopper1, {
            from: admin,
          });

          truffleAssert.eventEmitted(tx, 'StoreownerAdded', ev => (
            ev.newStoreOwner === shopper1 && ev.byAdmin === admin
          ), 'StoreAdded should be emitted with correct parameters');
        });
      });

      describe('removeStoreowner(address addr_)', () => {
        it('error when trying to send ETH to this method', async () => {
          try {
            await usersInstance.removeStoreowner(storeowner, {
              from: admin,
              value: web3.toWei(1),
            });
          } catch (err) {
            return;
          }
          assert(false, 'should have thrown');
        });
        it('error if caller is a shopper', async () => {
          try {
            await usersInstance.removeStoreowner(storeowner, {
              from: shopper1,
            });
          } catch (err) {
            return;
          }
          assert(false, 'should have thrown');
        });
        it('error if caller is a storeowner', async () => {
          try {
            await usersInstance.removeStoreowner(storeowner, {
              from: storeowner,
            });
          } catch (err) {
            return;
          }
          assert(false, 'should have thrown');
        });
        it('error if remove storeowner is not a storeowner', async () => {
          try {
            await usersInstance.removeStoreowner(shopper2, {
              from: admin,
            });
          } catch (err) {
            return;
          }
          assert(false, 'should have thrown');
        });
        it('error if emergency stop enabled', async () => {
          await breakerInstance.enableBreaker({ from: deployer });
          try {
            await usersInstance.removeStoreowner(storeowner, {
              from: admin,
            });
          } catch (err) {
            return;
          }
          assert(false, 'should have thrown');
        });
        it('success admin can remove a storeowner', async () => {
          const storeownerLengthBefore = await usersInstance.getStoreownerCount();

          const tx = await usersInstance.removeStoreowner(storeowner, {
            from: admin,
          });

          truffleAssert.eventEmitted(tx, 'StoreownerRemoved', ev => (
            ev.removedStoreOwner === storeowner && ev.byAdmin === admin
          ), 'StoreownerRemoved should be emitted with correct parameters');

          const exists = await usersInstance.isStoreowner(storeowner);
          assert(!exists, 'removed storeowner should still return true from isStoreowner');

          const storeownerLengthAfter = await usersInstance.getStoreownerCount();
          assert(storeownerLengthAfter.eq(storeownerLengthBefore.sub(1)), 'storeowner length should have decreased by 1');
        });
      });
    });
  });
  describe('Getters', () => {
    let breakerInstance;
    let usersInstance;

    beforeEach(async () => {
      breakerInstance = await EmergencyStop.new({ from: deployer });
      usersInstance = await Users.new(breakerInstance.address, { from: deployer });
      await breakerInstance.disableBreaker({ from: deployer });
      await usersInstance.addAdmin(admin, { from: deployer });
      await usersInstance.addStoreowner(storeowner, { from: admin });
    });

    describe('isAdmin(address addr_)', () => {
      it('success returns false if arg is storeowner', async () => {
        const result = await usersInstance.isAdmin(storeowner, {
          from: admin,
        });

        assert(result === false, 'result should be false');
      });
      it('success returns false if arg is shopper', async () => {
        const result = await usersInstance.isAdmin(shopper1, {
          from: admin,
        });

        assert(result === false, 'result should be false');
      });
      it('success returns true if arg is admin', async () => {
        const result = await usersInstance.isAdmin(admin, {
          from: admin,
        });

        assert(result === true, 'result should be true');
      });
      it('success can be called by admin/storeowner/shopper', async () => {
        const result1 = await usersInstance.isAdmin(admin, {
          from: admin,
        });

        const result2 = await usersInstance.isAdmin(admin, {
          from: storeowner,
        });

        const result3 = await usersInstance.isAdmin(admin, {
          from: shopper1,
        });

        assert(result1 && result2 && result3, 'result should be true');
      });

      it('success can be called by admin/storeowner/shopper when emergency stop enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        const result1 = await usersInstance.isAdmin(admin, {
          from: admin,
        });

        const result2 = await usersInstance.isAdmin(admin, {
          from: storeowner,
        });

        const result3 = await usersInstance.isAdmin(admin, {
          from: shopper1,
        });

        assert(result1 && result2 && result3, 'result should be true');
      });
    });
    describe('isStoreowner(address addr_)', () => {
      it('success returns false if arg is admin', async () => {
        const result = await usersInstance.isStoreowner(admin, {
          from: admin,
        });

        assert(result === false, 'result should be false');
      });
      it('success returns false if arg is shopper', async () => {
        const result = await usersInstance.isStoreowner(shopper1, {
          from: admin,
        });

        assert(result === false, 'result should be false');
      });
      it('success returns true if arg is storeowner', async () => {
        const result = await usersInstance.isStoreowner(storeowner, {
          from: admin,
        });

        assert(result === true, 'result should be true');
      });
      it('success can be called by admin/storeowner/shopper', async () => {
        const result1 = await usersInstance.isStoreowner(storeowner, {
          from: admin,
        });

        const result2 = await usersInstance.isStoreowner(storeowner, {
          from: storeowner,
        });

        const result3 = await usersInstance.isStoreowner(storeowner, {
          from: shopper1,
        });

        assert(result1 && result2 && result3, 'result should be true');
      });
      it('success can be called by admin/storeowner/shopper when emergency stop enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        const result1 = await usersInstance.isStoreowner(storeowner, {
          from: admin,
        });

        const result2 = await usersInstance.isStoreowner(storeowner, {
          from: storeowner,
        });

        const result3 = await usersInstance.isStoreowner(storeowner, {
          from: shopper1,
        });

        assert(result1 && result2 && result3, 'result should be true');
      });
    });
    describe('isShopper(address addr_)', () => {
      it('success returns false if arg is admin', async () => {
        const result = await usersInstance.isShopper(admin, {
          from: admin,
        });

        assert(result === false, 'result should be false');
      });
      it('success returns false if arg is storeowner', async () => {
        const result = await usersInstance.isShopper(storeowner, {
          from: admin,
        });

        assert(result === false, 'result should be false');
      });
      it('success returns true if arg is shopper', async () => {
        const result = await usersInstance.isShopper(shopper1, {
          from: admin,
        });

        assert(result === true, 'result should be true');
      });
      it('success can be called by admin/storeowner/shopper', async () => {
        const result1 = await usersInstance.isShopper(shopper1, {
          from: admin,
        });

        const result2 = await usersInstance.isShopper(shopper1, {
          from: storeowner,
        });

        const result3 = await usersInstance.isShopper(shopper2, {
          from: shopper1,
        });

        assert(result1 && result2 && result3, 'result should be true');
      });
      it('success can be called by admin/storeowner/shopper when emergency stop enabled', async () => {
        await breakerInstance.enableBreaker({ from: deployer });
        const result1 = await usersInstance.isShopper(shopper1, {
          from: admin,
        });

        const result2 = await usersInstance.isShopper(shopper1, {
          from: storeowner,
        });

        const result3 = await usersInstance.isShopper(shopper2, {
          from: shopper1,
        });

        assert(result1 && result2 && result3, 'result should be true');
      });
    });
  });
});
