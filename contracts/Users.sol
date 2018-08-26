pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/math/SafeMath.sol";


/// @title interface to EmergencyStop contract
interface IEmergencyStop {
  function breakerIsDisabled() external returns(bool);
  function breakerIsEnabled() external returns(bool);
}


/// @author Alexander 'rmi7' Remie
/// @title Users contract
contract Users {
  //
  //
  // Variables
  //
  //

  IEmergencyStop private breaker;

  mapping(address => bool) private addrIsAdmin;
  mapping(address => bool) private addrIsStoreowner;

  address[] public storeowners;
  mapping(address => uint) private storeownerToIndex;

  //
  //
  // Events
  //
  //

  event AdminAdded(address indexed newAdmin, address indexed byAdmin);
  event StoreownerAdded(address indexed newStoreOwner, address indexed byAdmin);
  event StoreownerRemoved(address indexed removedStoreOwner, address indexed byAdmin);

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

    // set deployer as the initial only admin
    addrIsAdmin[msg.sender] = true;
  }

  //
  //
  // Functions: Setters
  //
  //

  /// @notice add a new admin
  /// @dev will throw if emergency stop is active
  /// @param addr_ The address of the admin
  function addAdmin(address addr_)
    external
  {
    require(breaker.breakerIsDisabled(), "contract breaker is active");
    require(isAdmin(msg.sender), "caller is not an admin");
    require(isShopper(addr_), "arg is not a shopper");

    addrIsAdmin[addr_] = true;

    emit AdminAdded(addr_, msg.sender);
  }

  /// @notice add a new storeowner
  /// @dev will throw if emergency stop is active
  /// @param addr_ The address of the storeowner
  function addStoreowner(address addr_)
    external
  {
    require(breaker.breakerIsDisabled(), "contract breaker is active");
    require(isAdmin(msg.sender), "caller is not an admin");
    require(isShopper(addr_), "arg is not a shopper");

    addrIsStoreowner[addr_] = true;

    // - append addr to storeowners array
    // - save index of added item to storeowners array in a: mapping(addr) = idx
    // - cannot undeflow
    storeownerToIndex[addr_] = storeowners.push(addr_) - 1;

    emit StoreownerAdded(addr_, msg.sender);
  }

  /// @notice remove a storeowner
  /// @dev will throw if emergency stop is active
  /// @param addr_ The address of the storeowner
  function removeStoreowner(address addr_)
    external
  {
    require(breaker.breakerIsDisabled(), "contract breaker is active");
    require(isAdmin(msg.sender), "caller is not an admin");
    require(isStoreowner(addr_), "arg is not a storeowner");

    addrIsStoreowner[addr_] = false;

    // we need to:
    // - remove it from storeowners array
    // - update storeownerToIndex

    // get its idx inside storeowners array
    uint storeownerIndex = storeownerToIndex[addr_];

    // replace the storeowner at this idx inside the array 'storeowners'
    // with the last item in the storeowners array, this could be the current
    // item itself, but that doesn't matter ,update always works
    address lastStoreowner = storeowners[SafeMath.sub(storeowners.length, 1)];

    // move the last storeowner to the index of the to-be-removed storeowner
    storeowners[storeownerIndex] = lastStoreowner;

    // update index of previous last storeowner
    storeownerToIndex[lastStoreowner] = storeownerIndex;

    // remove last item from stored array
    storeowners.length = SafeMath.sub(storeowners.length, 1);

    emit StoreownerRemoved(addr_, msg.sender);
  }

  //
  //
  // Functions: Getters
  //
  //

  /// @notice check if an address is an admin
  /// @dev will work even if emergency stop is active
  /// @param addr_ The address to check
  /// @return true if admin, false otherwise
  function isAdmin(address addr_)
    public
    view
    returns(bool)
  {
    return addrIsAdmin[addr_];
  }

  /// @notice check if an address is a storeowner
  /// @dev will work even if emergency stop is active
  /// @param addr_ The address to check
  /// @return true if storeowner, false otherwise
  function isStoreowner(address addr_)
    public
    view
    returns(bool)
  {
    return addrIsStoreowner[addr_];
  }

  /// @notice check if an address is a shopper
  /// @dev will work even if emergency stop is active
  /// @param addr_ The address to check
  /// @return true if shopper, false otherwise
  function isShopper(address addr_)
    public
    view
    returns(bool)
  {
    return addrIsAdmin[addr_] == false && addrIsStoreowner[addr_] == false;
  }

  /// @notice get the number of store owners
  /// @dev will work even if emergency stop is active
  /// @return the number of store owners
  function getStoreownerCount()
    external
    view
    returns(uint)
  {
    return storeowners.length;
  }
}
