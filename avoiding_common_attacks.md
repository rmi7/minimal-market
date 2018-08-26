# Avoiding Common Attacks

When trying to write secure smart contracts there are a number of things you can do.

## 1. Use Best Practices

There are a number of sites which contain Solidity security related tips/best practices, such as [ConsenSys Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/). After having read through these online documents/guides, I've tried to apply them to my best effort in the contracts.

## 2. Write Tests

An application should always be tested. This project contains 209 tests.

These tests were written to:
- test all input params of each function
- verify that contract's storage has been updated correctly after each call
- verify each function's behaviour when emergency stop is enabled
- verify functions with restricted access are only accessible by correct account(s)

The tests are grouped per function signature.

The tests also contain features which are not yet implemented in the ui (emergency stop, update store/product).

## 3. Make use of open-source solidity modules

[`zeppelin-solidity`](https://github.com/OpenZeppelin/openzeppelin-solidity) (installed using `npm`).
contains a lot of solidity contracts/libraries which are useful as base or as helper/addon to your own contracts.

To prevent against under/overflow almost all Math operations in the contract's are called using `SafeMath.sol` from `zeppelin-solidity`

All of this project's contracts are `Ownable`. Which is used to limit certain functions to only be accessed by the `owner`.

## 4. Perform Automated Analysis

There are a number of tools publicly available to get (security related) info about your smart contracts.

- [`mythril`](https://github.com/ConsenSys/mythril)
- [`oyente`](https://github.com/melonproject/oyente)
- [`surya`](https://github.com/ConsenSys/surya)
- [`solhint`](https://github.com/protofire/solhint)
- [`solium`](https://github.com/duaraghav8/Solium)
- [`solidity-analyzer`](https://github.com/quantstamp/solidity-analyzer)
- [`solidity-coverage`](https://github.com/sc-forks/solidity-coverage)
- [`securify`](https://securify.ch/)
- [`manticore`](https://github.com/trailofbits/manticore)
- [`porosity`](https://github.com/comaeio/porosity/tree/master/porosity/porosity)
- [`echidnda`](https://github.com/trailofbits/echidna)
- [`rattle`](https://github.com/trailofbits/rattle)
- [`eth-gas-reporter`](https://github.com/cgewecke/eth-gas-reporter)
- ..

It's a matter of choosing some --> running the contracts through them -->
analyzing the output --> updating the contracts -∞-> repeat until no more fixes needed.

I've ran multiple of the above tools (`mythril`, `oyente`, `surya`, `eth-gas-reporter`, `solium`, `solhint`) on this project
Found some warnings and applied some fixed. Also saved gas report in [gas-usage-report](./test/gas-usage-report.txt).

Some `Warnings` not yet applied:

- `Stores.sol`

  - `solhint` returned: `Contract has 18 states declarations but allowed no more than 15      max-states-count`

    Would be solved when migrating to Factory pattern --> dividing this contract into `StoreFactory.sol` and `Store.sol`.

- `Products.sol`

  - `solhint` returned: `Contract has 29 states declarations but allowed no more than 15      max-states-count`

    Would be solved when migrating to Factory pattern --> dividing this contract into `ProductFactory.sol` and `Product.sol`.

## 5. Perform Manual Analysis

Manually went through all the contract's and check if any of the bugs/vulns in these lists exist:
- [Contract Safety and Security Checklist](https://www.kingoftheether.com/contract-safety-checklist.html)
- [ConsenSys Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)

## 6. External Analysis
Since I'm the one that wrote the code it's hard to be 'objective' when reviewing. This should ideally also be performed by some external actor.
