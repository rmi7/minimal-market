# Minimal Market

This is my final project ("_online marketplace_") for the `ConsenSys Developer Program 2018`.

Other documents:
- [Design Pattern Decisions](./design_pattern_decisions.md)
- [Avoiding Common Attacks](./avoiding_common_attacks.md)

## Info

Minimal Market is an Ethereum dapp build using `truffle`, `ipfs-api`, `web3`, `zeppelin-solidity` and `VueJS`.

The dapp uses IPFS to store all data which is not strictly needed in the smart contracts: text, images, etc.

There is a development server provided by `webpack` (hot reload) + `nodemon`.

#### Dapp in a nutshell

An admin can add store owners, store owners can add stores, to which store owners can add products, these can be bought for ETH by accounts having the shopper role.

#### User Roles

Inside Minimal Market there are 4 user roles:
- Owner
  - implemented using `zeppelin-solidity` `Ownable.sol`
  - initially is set to deploy account
  - is owner of all deployed contracts
  - can enable/disable EmergencyStop
- Admin
  - implemented in `Users.sol`
  - initially deploy account is set to have admin role
  - can add/remove storeowner
- Owner
  - implemented in `Users.sol`
  - can add/update/remove his/her stores
  - can add/update/remove products to his/her stores
  - can withdraw any collected funds from products sold (even works if account loses storeowner role)
- Shopper
  - implemented in `Users.sol`
  - everyone who is not an admin/storeowner
  - can purchase products

All user roles can view all pages: Owner(s), Store(s), Products(s).

#### Known bugs/limitations

- removed product/store/owner could still be shown in the list of products/stores/owners, solution for now: hard refresh
- removing a storeowner should only be possible if it has no more stores, but that limitation is currently not included, so it'll break the ui
- emergency stop is not implemented in the ui (but it is in the smart contracts + tests)
- updating a store/product is not yet implemented in the ui (but it is in the smart contracts + tests)
- only a few contract events are currently listened for in the ui, so the updating of the ui might not happen as expected, a hard refresh of the page should get you to the correct state.
- does not keep track of transaction that are `sent` vs `mined`, this will be needed when using on mainnet/testnet to keep the user happy

## Requirements

- `truffle` (tested using `v4.1.14`)
- `ganache-cli` (tested using `v6.1.3`)
- `ipfs` (golang/js/any is ok as long as it runs on port `5001`)
- `MetaMask`

NOTE: successfully tested inside `VirtualBox` Ubuntu 16.04 Desktop.

## Setup

#### IPFS

```
ipfs init

# set CORS headers so that local browser can connect to this IPFS node's API
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "GET", "POST"]'

ipfs daemon
```

#### ganache-cli

To prevent having to `Import Account` in MetaMask every time you restart `ganache-cli`, you could run it
with the deterministic flag to always get the same created accounts

```
ganache-cli -d
```

#### demo data

There is a `truffle` script inside `scripts/` which will seed the app with "real" demo data.
- It will retrieve random images and store/product names using [`faker`](https://github.com/Marak/Faker.js).
- It will **Upload** (and **pin**) all data to ipfs
- It will add stores and products to deployed smart contracts
- It makes use of the `ganache-cli` provided accounts (add them to your MetaMask)
  - `accounts[0] = owner of all contracts + the only admin`
  - `accounts[1] = first storeowner`
  - `accounts[2] = second storeowner`
  - `accounts[3] = third storeowner`
  - `accounts[4] = fourth storeowner`
  - `accounts[5] = fifth storeowner`
  - `accounts[6] = shopper`

## Install

1. `git clone https://github.com/rmi7/minimal-market.git`
2. `cd minimal-market`
3. `npm i`

## Usage

1. make sure `ipfs` is running
2. make sure `ganache-cli` is running
3. `truffle compile`
4. `truffle migrate`
5. (if you want demo data) `truffle exec scripts/seed-demo-data.js`
6. `npm start` to start the development server
7. open `localhost:8099` in your browser
8. add the first account from `ganache-cli` to MetaMask,
   this is the account used for deploying (user role `admin`)

## Tests

`truffle test`

## Contract deployement on mainnet/testnet(s)

Not yet implemented

## App deployment on IPFS

Not yet implemented

## Other

#### LibraryDemo.sol

I did not see any reason to use an `EthPM` library in this project (`EthPM` looks deserted).
I therefore added a `LibraryDemo.sol` contract + tests + migration.

There are 2 EthPM modules which are tested in this contract, [`oraclize-api`](https://www.ethpm.com/registry/packages/37) and [`bytes`](https://www.ethpm.com/registry/packages/35).

- `oraclize-api`

This is a __`Contract`__ which you can inherit from. This contract is normally used to send requests to the Oraclize Oracle service.
We however are gonna test the helper function `parseInt(string _num)`,
which converts an input number as `string` to a `uint`.

- `bytes`

This is a __`Library`__ which provides some useful `bytes` arrays functions.
We are gonna test the `toAddress(bytes _bytes, uint _start)` function,
which extracts an Ethereum address from the `_bytes` variable starting at index `_start`.

## License

MIT
