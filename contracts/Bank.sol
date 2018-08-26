pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


/// @author Alexander 'rmi7' Remie
/// @title interface to EmergencyStop contract
interface IEmergencyStop {
  function breakerIsDisabled() external returns(bool);
  function breakerIsEnabled() external returns(bool);
}


/// @author Alexander Remie
/// @title Bank contract
contract Bank is Ownable {
  //
  //
  // Variables
  //
  //

  IEmergencyStop private breaker;

  address productsContractAddress;

  //       address withdrawableEth
  mapping (address => uint) public addressToBalance;

  //
  //
  // Constructor
  //
  //

  /// @notice contract constructor
  /// @param breakerContract_ The address of the EmergencyStop contract
  constructor(address breakerContract_) public {
    require(breakerContract_ != address(0), "breaker contract address should not be 0x0");

    breaker = IEmergencyStop(breakerContract_);
  }

  //
  //
  // Functions: Setters
  //
  //

  /// @notice initialize the reference to the Product contract
  /// @dev will throw if emergency stop is not active
  /// @param productsContract_ The address of the Products contract
  function setProductsContractAddress(address productsContract_)
    onlyOwner
    external
  {
    require(breaker.breakerIsEnabled(), "can only be called if emergency stop is active");
    require(productsContract_ != address(0), "products contract address should not be 0x0");

    productsContractAddress = productsContract_;
  }

  /// @notice add withdrawable funds to an address (=storeowner)
  /// @dev Design Pattern: Checks-Effects-Interactions
  /// @dev can only be called by the set stores contract
  /// @dev will throw if emergency stop is active
  /// @dev accepts ETH (=payable)
  /// @param addr_ The address to add funds to
  function addFunds(address addr_)
    external
    payable
  {
    require(msg.sender == productsContractAddress, "can onyl be called by products contract");
    require(breaker.breakerIsDisabled(), "contract breaker is active");

    addressToBalance[addr_] = SafeMath.add(addressToBalance[addr_], msg.value);
  }

  /// @notice withdraw collected funds to the caller
  /// @dev Design Pattern: Checks-Effects-Interactions
  /// @dev Design Pattern: Withdrawable pattern (pull over push)
  /// @dev will work even if emergency stop is active
  function withdraw()
    external
  {
    require(addressToBalance[msg.sender] > 0, "store has zero balance");
    uint toReturn = addressToBalance[msg.sender];
    addressToBalance[msg.sender] = 0;
    msg.sender.transfer(toReturn);
  }
}
