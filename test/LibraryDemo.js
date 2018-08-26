/* eslint-env node, mocha */
/* global artifacts, contract, assert */
/* eslint-disable no-await-in-loop, max-len, no-unused-vars */
const LibraryDemo = artifacts.require('LibraryDemo.sol');

contract('LibraryDemo', (accounts) => {
  let instance;

  beforeEach(async () => {
    instance = await LibraryDemo.new();
  });

  describe('oraclize-api', () => {
    it('successfully converts number as string to uint', async () => {
      const NUMNER_STRING = '7';

      await instance.loadNumFromStr(NUMNER_STRING);

      const inContractValue = await instance.myNumber();

      assert(inContractValue.eq(parseInt(NUMNER_STRING, 10)), 'saved number did not match');
    });
  });

  describe('bytes', () => {
    it('successfully extracts address from bytes (at offset)', async () => {
      const ADDRESS = '383fa3b60f9b4ab7fbf6835d3c26c3765cd2b2e2';
      const BYTES_ARRAY = `0xf00dfeed${ADDRESS}f00dfeed`;
      const EXPECTED_ADDRESS = `0x${ADDRESS}`;

      await instance.extractAddressFromBytesAtOffset(BYTES_ARRAY);

      const inContractValue = await instance.myAddress();

      assert(inContractValue === EXPECTED_ADDRESS, 'extracted address did not match');
    });
  });
});
