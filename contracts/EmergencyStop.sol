pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";


/// @author Alexander 'rmi7' Remie
/// @title EmergencyStop contract
contract EmergencyStop is Ownable {
  //
  //
  // Variables
  //
  //

  // initially start in stopped state so we can do some calls to setup the contracts,
  // after which we will update 'stopped' to false so that the app is 'open, reay for action'
  bool public stopped = true;

  //
  //
  // Functions: Setters
  //
  //

  /// @notice disable the breaker
  /// @dev will throw if emergency stop is already disabled
  /// @dev can only be called by the contract owner
  function disableBreaker()
    external
    onlyOwner
  {
    require(stopped == true, "breaker is not enabled, can not disable");
    stopped = false;
  }

  /// @notice enable the breaker
  /// @dev will throw if emergency stop is already enabled
  /// @dev can only be called by the contract owner
  function enableBreaker()
    external
    onlyOwner
  {
    require(stopped == false, "breaker is already enabled");
    stopped = true;
  }

  //
  //
  // Functions: Getters
  //
  //

  /// @notice check if emergency stop is disabled
  /// @return True if emergency stop disabled, false otherwise
  function breakerIsDisabled()
    external
    view
    returns(bool)
  {
    return stopped == false;
  }

  /// @notice check if emergency stop is enabled
  /// @return True if emergency stop enabled, false otherwise
  function breakerIsEnabled()
    external
    view
    returns(bool)
  {
    return stopped == true;
  }
}
