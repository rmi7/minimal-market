/* global artifacts:true */
/* eslint-disable max-len, no-mixed-operators, no-restricted-syntax, no-await-in-loop */

const EmergencyStop = artifacts.require('EmergencyStop');
const Bank = artifacts.require('Bank');
const Users = artifacts.require('Users');
const Stores = artifacts.require('Stores');
const Products = artifacts.require('Products');

// NOTE: async/await support has been added to truffle v5, which is currently in beta
module.exports = (deployer) => { // deploy from default --> accounts[0]
  deployer.deploy(EmergencyStop).then(breakerInstance => (
    deployer.deploy(Bank, breakerInstance.address).then(bankInstance => (
      deployer.deploy(Users, breakerInstance.address).then(usersInstance => (
        deployer.deploy(Stores, breakerInstance.address, usersInstance.address).then(storesInstance => (
          deployer.deploy(Products, breakerInstance.address, usersInstance.address, storesInstance.address, bankInstance.address).then(productsInstance => (
            // Product calls Bank.addFunds with each product purchase
            bankInstance.setProductsContractAddress(productsInstance.address).then(() => (
              // Stores.removeStore will check that it has zero Products
              storesInstance.setProductsContract(productsInstance.address).then(() => (
                // since we've setup the contracts we disable the breaker so the app can be used
                breakerInstance.disableBreaker()
              ))
            ))
          ))
        ))
      ))
    ))
  ));
};
