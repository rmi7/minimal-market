/* global artifacts:true */
/* eslint-disable no-await-in-loop, max-len */
const path = require('path');
const bs58 = require('bs58');
const fs = require('fs');

const Users = artifacts.require('Users');
const Stores = artifacts.require('Stores');
const Products = artifacts.require('Products');

const Web3 = require('web3');
const ipfsAPI = require('ipfs-api');

const faker = require('faker/locale/en');
const loremIpsum = require('lorem-ipsum');
const download = require('image-downloader');

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
const ipfs = ipfsAPI('localhost', '5001');

let storeIdCounter = 0;
let productIdCounter = 0;

let usersInstance;
let storesInstance;
let productsInstance;

(async () => {
  usersInstance = await Users.deployed();
  storesInstance = await Stores.deployed();
  productsInstance = await Products.deployed();
})();

// storing IPFS has as bytes32 helper functions --> https://ethereum.stackexchange.com/a/39961
const getBytes32FromIpfsHash = ipfsListing => (
  `0x${bs58.decode(ipfsListing).slice(2).toString('hex')}`
);

const str = val => val.toString();
// const getRandomBytes32 = () => web3.utils.randomHex(32);

// min = inclusive, max = exclusive
const randFloatBetween = (min, max) => Math.random() * (max - min) + min; // eslint-disable-line no-mixed-operators, max-len
const randIntBetween = (min, max) => Math.floor(randFloatBetween(min, max));

const randEthPrice = () => randFloatBetween(1, 10).toFixed(2);
const randQuantity = () => randIntBetween(1, 100);

const TMP_IMAGE_PATH = path.join(__dirname, 'tmp.jpg');

const addRandomImageToIpfs = async () => {
  const { image } = await download.image({
    url: 'https://picsum.photos/400/300/?random',
    dest: TMP_IMAGE_PATH,
  });
  const imageIpfsHash = (await ipfs.files.add(image))[0].hash;
  fs.unlinkSync(TMP_IMAGE_PATH);
  await ipfs.pin.add(imageIpfsHash);
  return imageIpfsHash;
};

const createRandomStoreContentObject = imageIpfsHash => ({
  name: faker.company.companyName(),
  description: loremIpsum({
    count: randIntBetween(1, 4),
    units: 'sentences',
    sentenceLowerBound: 5,
    sentenceUpperBound: 15,
  }),
  image: imageIpfsHash,
});

const createRandomProductContentObject = imageIpfsHash => ({
  name: faker.commerce.productName(),
  description: loremIpsum({
    count: randIntBetween(1, 4),
    units: 'sentences',
    sentenceLowerBound: 5,
    sentenceUpperBound: 15,
  }),
  image: imageIpfsHash,
});

const addContentObjToIpfs = async (contentObj) => {
  const contentIpfsHash = (await ipfs.add([Buffer.from(JSON.stringify(contentObj))]))[0].hash;
  await ipfs.pin.add(contentIpfsHash);
  return contentIpfsHash;
};

const createRandomProducts = async (storeId, account) => {
  const numProducts = randIntBetween(1, 6);
  for (let i = 0; i < numProducts; i += 1) {
    const imageIpfsHash = await addRandomImageToIpfs();
    const content = createRandomProductContentObject(imageIpfsHash);
    const contentIpfsHash = await addContentObjToIpfs(content);
    await productsInstance.addProduct( // smart contract update
      str(storeId), // storeId
      getBytes32FromIpfsHash(contentIpfsHash).valueOf(), // content hash
      web3.utils.toWei(str(randEthPrice())), // price
      str(randQuantity()), // quantity
      { from: account },
    );
    productIdCounter += 1;
  }
};

const createRandomStore = async (account) => {
  const imageIpfsHash = await addRandomImageToIpfs();
  const content = createRandomStoreContentObject(imageIpfsHash);
  const contentIpfsHash = await addContentObjToIpfs(content);
  await storesInstance.addStore(getBytes32FromIpfsHash(contentIpfsHash).valueOf(), { from: account }); // eslint-disable-line max-len
  const storeId = ++storeIdCounter; // eslint-disable-line
  return storeId;
};

module.exports = (cb) => {
  web3.eth.getAccounts().then(async (accounts) => {
    // accounts[0] = admin
    // accounts[1] = owner
    // accounts[2] = owner
    // accounts[3] = owner
    // accounts[4] = owner
    // accounts[5] = owner
    // accounts[6] = shopper

    const admin = accounts[0];
    const ownerAccounts = accounts.slice(1, 6);

    for (let ownerAccIdx = 0; ownerAccIdx < ownerAccounts.length; ownerAccIdx += 1) {
      // FOR EACH owner
      const account = ownerAccounts[ownerAccIdx];
      await usersInstance.addStoreowner(account, { from: admin });
      const numStores = randIntBetween(1, 4);
      for (let i = 0; i < numStores; i += 1) {
        const storeId = await createRandomStore(account); // create store
        await createRandomProducts(storeId, account); // create products
      }
    }

    console.log(`created ${storeIdCounter} stores, ${productIdCounter} products`);
    cb();
  }).catch((err) => {
    console.log(err);
    throw err;
  });
};
