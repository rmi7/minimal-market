# Design Pattern Decisions

## Implemented Design Patterns

- **Separation of Concerns**

  The application's functionality can be divided into several parts: `EmergencyStop`, `Bank`, `Users`, `Stores` and `Products`.
  This is reflected in the created contracts of the same name.

  - putting all code inside 1 contract could exceed the block gas limit (would be a little over 8 million gas)
  - easier to think about/work with the app when the code is divided into different files(=parts).

- **Restricting Access**

  The `Users.sol` contract defines three user roles, `Admin`, `Storeowner` and `Shopper`. Each contract also inherits
  from `Ownable.sol`. So there really are 4 user roles. We use these roles to restrict certain functionality to certain roles.

- **[Withdrawable](https://solidity.readthedocs.io/en/v0.4.24/common-patterns.html#withdrawal-from-contracts) (pull over push) Pattern**

  The pull over push pattern exists because pushing funds to an address which is not the caller account can lead to a DoS since the receiving address can be a contract with a payable fallback function which just throws.

  Inside `Product.purchaseProduct` this would make it impossible for shoppers to buy certain products which have their store's owner set to a contract with a throwing payable fallback function, leading to confusion for users. We can prevent this by gathering funds in a mapping and letting addresses withdraw their funds (if any).

  - whenever a product is purchased, the gathered funds from the buyer will be transferred to the `Bank` contract.
  The function `Products.purchaseProduct` will call `Bank.addFunds`.
  - inside the `Bank` contract the funds are saved in a mapping with key `address` and value `withdrawable funds`.
  - withdrawable funds can at all times be withdrawn by calling `Bank.withdraw`.


- **Emergency Stop**

  There is an application-wide emergency stop defined in the `EmergencyStop.sol` contract.
  This contract is `Ownable`, and the initial owner is set to the deploy account (just like all the other contracts).
  - The only account allowed to enable/disable the emergency stop is the `owner` of the `EmergencyStop` contract.
  - When deployed the emergency stop will initially to enabled, to give us time to call some set-up functions in other contracts, after which we disable the emergency stop, and the app is ready for use.

  Whenever the emergency stop is enabled:
  - all Getter functions still work
  - all Setter (state-changing) functions will throw
  - the only Setter which still works is the `Bank.withdraw` function,
    since we always want to allow people to withdraw their funds.


- **Refund Excess Eth amount**

  Inside `Products.purchaseProduct`, when purchasing a product and sending more ETH to the contract than `quantity * price`,
  the excess ETH is immediately refunded to the caller account.
  - caller could DoS **himself** by making the caller a contract which has a payable fallback function which throws.


- **Interfaces**

  We define [`Interfaces`](https://solidity.readthedocs.io/en/v0.4.24/contracts.html#interfaces) of the other contracts and the functions that we need instead of importing the entire contract.
  - saves gas
  - makes it more clear which other-contract functions this contract calls

## Not Implemented Design Patterns

- **Upgradeable Contract**

  Researched this for a [bit](https://blog.zeppelinos.org/proxy-patterns/) and thought about applying it to this project.
  But due to time contraints did not implement it.

  The zeppelin [`Unstructured Storage`](https://blog.zeppelinos.org/upgradeability-using-unstructured-storage/) Pattern looks promising, or maybe go all the way and use [`ZeppelinOs`](https://zeppelinos.org/) and its upgrading features [doc1](https://docs.zeppelinos.org/docs/building.html) [doc2](https://blog.zeppelinos.org/getting-started-with-zeppelinos/)

- **Factory Contract**

  Not implemented currently.

  This should be implemented by replacing the `Stores` and `Products` contracts with the contracts:
  `StoreFactory`, `Store`, `ProductFactory`, `Product`.

  Instead of having a `struct Store` in `Stores` and `struct Product` in `Products`.
  The structs fields would become variables in the new `Store` and `Product` contracts.
  Each time a `Store`/`Product` is created a new `Store`/`Product` contract will be deployed.
  We would no longer need `storeId`/`productId` since they each would have an `address` --> `storeAddr`/`productAddr`.

  Thinking about upgradeability and using `delegatecall` with contracts that deploy on each creation,
  as described in the above paragraph,
  will require some thinking.

- **State Machine**

  Didn't see a reason to use this for the current contracts/features.

  This would have definitely been used when implementing Auctions for selling Products,
  which at least would've had the two states `STARTED`, `FINISHED`.

- **Speed Bump**

  Not implemented
