/* eslint-env node, mocha */
/* global artifacts, contract, assert */
/* eslint-disable no-await-in-loop, max-len, no-unused-vars */

// bank ownership will be transferred to Products contract at deployment,
// so we need to test that case and therefore need all contracts
const EmergencyStop = artifacts.require('EmergencyStop');

contract('EmergencyStop', (accounts) => {
  const [deployer, account2] = accounts;

  describe('Instantiation', () => {
    it('success if passing in no args', async () => {
      const breakerInstance = await EmergencyStop.new({ from: deployer });
      const breakerEnabled = await breakerInstance.stopped();
      const breakerOwner = await breakerInstance.owner();
      assert(breakerEnabled === true, 'breaket should be enabled at deploy');
      assert(breakerOwner === deployer, 'initial owner should b the deployer account');
    });
  });

  describe('Setters', () => {
    let breakerInstance;

    beforeEach(async () => {
      breakerInstance = await EmergencyStop.new({ from: deployer });
    });

    describe('disableBreaker()', () => {
      it('error when already disabled', async () => {
        await breakerInstance.disableBreaker({ from: deployer });
        try {
          await breakerInstance.disableBreaker({
            from: deployer,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error when not called by owner', async () => {
        try {
          await breakerInstance.disableBreaker({
            from: account2,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });

      it('success when currently enabled', async () => {
        await breakerInstance.disableBreaker({
          from: deployer,
        });
      });
    });

    describe('enableBreaker()', () => {
      it('error when already enabled', async () => {
        try {
          await breakerInstance.enableBreaker({
            from: deployer,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });
      it('error when not called by owner', async () => {
        await breakerInstance.disableBreaker({ from: deployer });
        try {
          await breakerInstance.enableBreaker({
            from: account2,
          });
        } catch (err) {
          return;
        }
        assert(false, 'should have thrown');
      });

      it('success when currently disabled', async () => {
        await breakerInstance.disableBreaker({ from: deployer });
        await breakerInstance.enableBreaker({
          from: deployer,
        });
      });
    });
  });

  describe('Getters', () => {
    let breakerInstance;

    beforeEach(async () => {
      breakerInstance = await EmergencyStop.new({ from: deployer });
    });

    describe('function stopped()', () => {
      it('success returns false if currently disabled', async () => {
        await breakerInstance.disableBreaker({ from: deployer });
        const isStopped = await breakerInstance.stopped();
        assert(isStopped === false, 'stopped should be false');
      });
      it('success returns true if currently enabled', async () => {
        const isStopped = await breakerInstance.stopped();
        assert(isStopped === true, 'stopped should be true');
      });
    });

    describe('function breakerIsDisabled()', () => {
      it('success returns true if currently disabled', async () => {
        await breakerInstance.disableBreaker({ from: deployer });
        const isDisabled = await breakerInstance.breakerIsDisabled();
        assert(isDisabled === true, 'breaker is disabled should be true');
      });
      it('success returns false if currently enabled', async () => {
        const isDisabled = await breakerInstance.breakerIsDisabled();
        assert(isDisabled === false, 'breaker is disabled should be false');
      });
    });

    describe('function breakerIsEnabled()', () => {
      it('success returns false if currently disabled', async () => {
        await breakerInstance.disableBreaker({ from: deployer });
        const isEnabled = await breakerInstance.breakerIsEnabled();
        assert(isEnabled === false, 'breaker is enabled should be false');
      });
      it('success returns true if currently enabled', async () => {
        const isEnabled = await breakerInstance.breakerIsEnabled();
        assert(isEnabled === true, 'breaker is enabled should be true');
      });
    });
  });
});
