pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


/// @title interface to EmergencyStop contract
interface IEmergencyStop {
  function breakerIsDisabled() external returns(bool);
  function breakerIsEnabled() external returns(bool);
}


/// @title interface to Users contract
interface IUsers {
  function isStoreowner(address addr_) external returns(bool);
}


/// @title interface to Products contract
interface IProducts {
  function getStoreProductCount(uint storeId_) external returns(uint);

}


/// @author Alexander 'rmi7' Remie
/// @title Stores contract
contract Stores is Ownable {
  //
  //
  // Variables
  //
  //

  IEmergencyStop private breaker;
  IProducts private products;
  IUsers private users;

  // we use storeIds instead of directly contentHashes such that a store owner
  // can update a store without the store losing it's id, only its linked to
  // contentHash is updated
  uint public storeIdCounter = 0;

  //      storeOwner storeIds
  mapping(address => uint[]) public ownerToStoreIds;

  // private because:
  // - other contracts know nothing about Store struct
  // - cannot return struct to web3
  //      storeId store
  mapping(uint => Store) private storeIdToStore;

  //      storeId storeIdIdx
  mapping(uint => uint) private storeIdToIndex;

  struct Store {
    uint id;
    address storeowner;
    bytes32 contentHash; // can change
    uint createdAt;
    uint updatedAt;      // can change
    bool exists;         // can change
  }

  //
  //
  // Events
  //
  //

  event StoreAdded(uint indexed storeId, address indexed storeOwner, bytes32 indexed contentHash);
  event StoreRemoved(uint indexed storeId, address indexed storeOwner);
  event StoreUpdatedContent(uint indexed storeId, bytes32 indexed oldContentHash, bytes32 indexed newContentHash);

  //
  //
  // Constructor
  //
  //

  /// @notice contract constructor
  /// @param breakerContract_ The address of the EmergencyStop contract
  /// @param usersContract_ The address of the Users contract
  constructor(address breakerContract_, address usersContract_) public {
    require(usersContract_ != address(0), "breaker contract address should not be 0x0");
    require(breakerContract_ != address(0), "breaker contract address should not be 0x0");

    breaker = IEmergencyStop(breakerContract_);
    users = IUsers(usersContract_);
  }

  //
  //
  // Functions: Setters
  //
  //

  /// @notice initialize the reference to the Product contract
  /// @dev will throw if emergency stop is not active
  /// @param productsContract_ The address of the Products contract
  function setProductsContract(address productsContract_)
    onlyOwner
    external
  {
    require(breaker.breakerIsEnabled(), "can only be called if emergency stop is active");
    require(productsContract_ != address(0), "breaker contract address should not be 0x0");

    products = IProducts(productsContract_);
  }

  /// @notice add a new store
  /// @param contentHash_ The IPFS content hash as bytes32
  function addStore(bytes32 contentHash_)
    external
  {
    require(breaker.breakerIsDisabled(), "emergency stop is active");
    require(users.isStoreowner(msg.sender), "caller must be a storeowner");
    require(contentHash_ != bytes32(0), "content hash cannot be 0x0");

    storeIdCounter = SafeMath.add(storeIdCounter, 1);

    // will increment the storage variable and return the new value (in that order);
    uint newStoreId = storeIdCounter; // first run will be, ++0 = 1

    Store memory newStore = Store({
      id: newStoreId,
      storeowner: msg.sender,
      contentHash: contentHash_,
      // NOTE: we don't do anything besides using them for sorting so it's ok to use the block.timestamp
      createdAt: now,
      updatedAt: now,
      exists: true
    });
    storeIdToStore[newStoreId] = newStore;

    // - cannot underflow
    storeIdToIndex[newStoreId] = ownerToStoreIds[msg.sender].push(newStoreId) - 1;

    emit StoreAdded(newStoreId, msg.sender, contentHash_);
  }

  /// @notice update the contentHash of a store
  /// @dev will throw if emergency stop is active
  /// @dev a store can only be removed if it has no more products
  /// @param storeId_ The id of the store
  /// @param newContentHash_ The new IPFS content hash as bytes32
  function updateStoreContent(uint storeId_, bytes32 newContentHash_)
    external
  {
    require(breaker.breakerIsDisabled(), "emergency stop is active");
    require(storeExists(storeId_), "store does not exist");
    require(getStoreOwner(storeId_) == msg.sender, "store is not owned by caller");
    require(newContentHash_ != bytes32(0), "content hash cannot be 0x0");

    bytes32 oldContentHash = storeIdToStore[storeId_].contentHash;
    storeIdToStore[storeId_].contentHash = newContentHash_;
    storeIdToStore[storeId_].updatedAt = now;

    emit StoreUpdatedContent(storeId_, oldContentHash, newContentHash_);
  }

  /// @notice remove a store
  /// @dev will throw if emergency stop is active
  /// @dev will throw if emergency stop is active
  /// @dev a store can only be removed if it has no more products
  /// @param storeId_ The id of the store
  function removeStore(uint storeId_)
    external
  {
    require(breaker.breakerIsDisabled(), "emergency stop is active");
    require(storeExists(storeId_), "store does not exist");
    require(getStoreOwner(storeId_) == msg.sender, "store is not owned by caller");
    require(products.getStoreProductCount(storeId_) == 0, "store still has products");

    // index of zero is valid here, we check this store actually exists in the above 2nd require
    uint storeIdIndex = storeIdToIndex[storeId_];

    uint ownerStoreIdsLen = ownerToStoreIds[msg.sender].length;

    ownerToStoreIds[msg.sender][storeIdIndex] = ownerToStoreIds[msg.sender][SafeMath.sub(ownerStoreIdsLen, 1)];

    // we've replaced all storeIds that needed to be updated
    // decrease array length by 1
    ownerToStoreIds[msg.sender].length = SafeMath.sub(ownerToStoreIds[msg.sender].length, 1);
    // we've removed 1 array item, should get a gas refund?

    // reset storage of store to all zeroes, should get a gas refund)
    storeIdToStore[storeId_] = Store(0, address(0), bytes32(0), 0, 0, false);

    // zero it out
    storeIdToIndex[storeId_] = 0;

    emit StoreRemoved(storeId_, msg.sender);
  }

  //
  //
  // Functions: Getters
  //
  //

  /// @notice retrieve a specific Store from its id
  /// @dev will work even if emergency stop is active
  /// @dev return as array since we cannot (yet) return a Struct from a solidity function
  /// @param storeId_ The id of the store
  /// @return _storeId The id of the store
  /// @return _storeowner The address of the owner of the store
  /// @return _contentHash The ipfs hash (as bytes32) of the store
  /// @return _createdAt The timestamp at which this store was created
  /// @return _updatedAt The timestamp at which this store was created
  /// @return _exists True if store exists, false otherwise
  function getStore(uint storeId_)
    external
    view
    returns(uint _storeId, address _storeowner, bytes32 _contentHash, uint _createdAt, uint _updatedAt, bool _exists)
  {
    Store memory store = storeIdToStore[storeId_];
    _storeId = store.id;
    _storeowner = store.storeowner;
    _contentHash = store.contentHash;
    _createdAt = store.createdAt;
    _updatedAt = store.updatedAt;
    _exists = store.exists;
  }

  /// @notice get the store count of a specific owner
  /// @dev will work even if emergency stop is active
  /// @param storeowner_ The address of the storeowner
  /// @return The number of stores owner by the storeowner
  function getOwnerStoreCount(address storeowner_)
    external
    view
    returns(uint)
  {
    return ownerToStoreIds[storeowner_].length;
  }

  /// @notice check if a store exists
  /// @dev will work even if emergency stop is active
  /// @param storeId_ The id of the store
  /// @return True if store exists, false otherwise
  function storeExists(uint storeId_)
    public // also called by update/removeStore
    view
    returns(bool)
  {
    return storeIdToStore[storeId_].exists;
  }

  /// @notice retrieve the store owner of a particulat store
  /// @dev will work even if emergency stop is active
  /// @param storeId_ The id of the store
  /// @return the address of the store owner
  function getStoreOwner(uint storeId_)
    public // also called by update/removeStore
    view
    returns(address)
  {
    return storeIdToStore[storeId_].storeowner;
  }


}
