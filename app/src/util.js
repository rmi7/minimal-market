import bs58 from 'bs58';

const { Buffer } = require('buffer/');

// Add our default ipfs values for first 2 bytes:
// function:0x12=sha2, size:0x20=256 bits + cut off leading '0x'
export const getIpfsHashFromBytes32 = bytes32Hex => (
  bs58.encode(Buffer.from(`1220${bytes32Hex.slice(2)}`, 'hex'))
);

// storing IPFS has as bytes32 helper functions --> https://ethereum.stackexchange.com/a/39961
export const getBytes32FromIpfsHash = ipfsListing => (
  `0x${bs58.decode(ipfsListing).slice(2).toString('hex')}`
);
