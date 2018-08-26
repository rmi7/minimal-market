pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


/// @title interface to EmergencyStop contract
interface IEmergencyStop {
  function breakerIsDisabled() external returns(bool);
}


/// @title interface to Bank contract
interface IBank {
  function addFunds(address addr_) external payable;
}


/// @title interface to Users contract
interface IUsers {
  function isStoreowner(address addr_) external returns(bool);
  function isShopper(address addr_) external returns(bool);
}


/// @title interface to Stores contract
interface IStores {
  function storeExists(uint storeId_) external returns (bool);
  function getStoreOwner(uint storeId_) external returns(address);
}


/// @author Alexander 'rmi7' Remie
/// @title Products contract
contract Products is Ownable {
  //
  //
  // Variables
  //
  //

  IEmergencyStop private breaker;
  IStores private stores;
  IUsers private users;
  IBank private bank;

  uint constant public MIN_PRODUCT_PRICE = 0.01 * 1 ether;
  uint constant public MIN_PRODUCT_QUANTITY = 1;
  uint constant public MAX_PRODUCT_QUANTITY = 1000;

  uint public productIdCounter = 0;

  //      storeId productIds
  mapping(uint => uint[]) public storeIdToProductIds;
  mapping(uint => uint) public productIdToStoreIndex;
  //      productId productIdIdx-inside-storeIdToProductIds-of-correct-store

  // currently cannot return a struct from solidity, so this will be used only internally
  // we implement a getProduct(id) function down below to fetch a product from solidity (using an array)
  //      productId product
  mapping(uint => Product) internal productIdToProduct;

  struct Product {
    uint id;
    uint storeId;
    bytes32 contentHash; // can be updated
    uint quantity;       // can be updated
    uint price;          // can be updated
    uint createdAt;
    uint updatedAt;      // will be updated
    bool exists;         // can be updated
  }

  //
  //
  // Events
  //
  //

  // this event is used to build the "All Products" page in the ui
  event ProductAdded(uint indexed productId, uint indexed storeId);
  event ProductRemoved(uint indexed productId, uint indexed storeId);
  event ProductPurchased(uint indexed productId, address indexed buyer, uint indexed price, uint quantity, uint newQuantity);
  event ProductUpdatedPrice(uint indexed productId, uint indexed oldPrice, uint indexed newPrice);
  event ProductUpdatedContent(uint indexed productId, bytes32 indexed oldContentHash, bytes32 indexed newContentHash);

  //
  //
  // Constructor
  //
  //

  /// @notice contract constructor
  /// @param breakerContract_ The address of the EmergencyStop contract
  /// @param usersContract_ The address of the Users contract
  /// @param storesContract_ The address of the Users contract
  /// @param bankContract_ The address of the Users contract
  constructor(address breakerContract_, address usersContract_, address storesContract_, address bankContract_) public {
    require(breakerContract_ != address(0), "breaker contract address should not be 0x0");
    require(usersContract_ != address(0), "users contract address should not be 0x0");
    require(storesContract_ != address(0), "stores contract address should not be 0x0");
    require(bankContract_ != address(0), "bank contract address should not be 0x0");

    breaker = IEmergencyStop(breakerContract_);
    users = IUsers(usersContract_);
    stores = IStores(storesContract_);
    bank = IBank(bankContract_);
  }

  //
  //
  // Modifiers
  //
  //

  modifier canCreateProduct(uint storeId_, address addr_) {
    require(breaker.breakerIsDisabled(), "contract breaker is active");
    require(users.isStoreowner(addr_), "caller is not a store owner");
    require(stores.storeExists(storeId_), "store does not exist");
    require(stores.getStoreOwner(storeId_) == addr_, "store is not owned by caller");
    _;
  }

  modifier canUpdateProduct(uint productId_, address addr_) {
    require(breaker.breakerIsDisabled(), "contract breaker is active");
    require(users.isStoreowner(addr_), "caller is not a store owner");
    require(productExists(productId_), "product does not exist");
    require(productIsOwnedBy(productId_, addr_), "product is not owned by caller");
    _;
  }

  modifier isValidProduct(bytes32 contentHash_, uint price_, uint quantity_) {
    require(breaker.breakerIsDisabled(), "contract breaker is active");
    require(contentHash_ != bytes32(0), "contentHash cannot be 0x0");
    require(price_ >= MIN_PRODUCT_PRICE, "product price is less than minimum");
    require(quantity_ >= MIN_PRODUCT_QUANTITY, "quantity is less than minimum");
    require(quantity_ <= MAX_PRODUCT_QUANTITY, "quantity is more than maximum");
    _;
  }

  modifier canPurchaseProductQuantity(uint productId_, address buyer_, uint quantity_, uint value_) {
    require(breaker.breakerIsDisabled(), "contract breaker is active");
    require(users.isShopper(buyer_), "caller is not a shopper");
    require(productExists(productId_), "product does not exist");
    Product memory product = productIdToProduct[productId_];
    require(quantity_ <= product.quantity, "not enough product quantity available");
    require(value_ >= SafeMath.mul(product.price, quantity_), "eth amount not enough to purchase quantity * price");
    _;
  }

  //
  //
  // Functions: Setters
  //
  //

  /// @notice add a new product
  /// @dev will throw if emergency stop is active
  /// @param storeId_ The id of the store
  /// @param contentHash_ The IPFS content hash as bytes32
  /// @param price_ The price of this product
  /// @param quantity_ The quantity left
  function addProduct(uint storeId_, bytes32 contentHash_, uint price_, uint quantity_)
    external
    canCreateProduct(storeId_, msg.sender)
    isValidProduct(contentHash_, price_, quantity_)
  {
    productIdCounter = SafeMath.add(productIdCounter, 1);
    uint newProductId = productIdCounter;

    Product memory newProduct = Product({
      id: newProductId,
      storeId: storeId_,
      contentHash: contentHash_,
      price: price_,
      quantity: quantity_,
      // NOTE: we don't do anything besides using them for sorting so it's ok to use the block.timestamp
      createdAt: now,
      updatedAt: now,
      exists: true
    });

    // save product content
    productIdToProduct[newProductId] = newProduct;

    // save new product id as belonging to store
    // - cannot underflow
    uint productIdIndex = storeIdToProductIds[storeId_].push(newProductId) - 1;

    // save the index of new product in list of owned-by-store
    // we use this to be able to delete products without using a loop
    productIdToStoreIndex[newProductId] = productIdIndex;

    emit ProductAdded(newProductId, storeId_);
  }

  /// @dev quantity is currently not manually updateable, it can only be updated by purchaseProduct

  /// @notice update the contentHash of a product
  /// @dev will throw if emergency stop is active
  /// @param productId_ The id of the product
  /// @param newContentHash_ The new IPFS content hash as bytes32
  function updateProductContent(uint productId_, bytes32 newContentHash_)
    external
    canUpdateProduct(productId_, msg.sender)
  {
    require(newContentHash_ != bytes32(0), "new content hash cannot be 0x0");

    bytes32 oldContentHash = productIdToProduct[productId_].contentHash;

    productIdToProduct[productId_].contentHash = newContentHash_;
    productIdToProduct[productId_].updatedAt = now;

    emit ProductUpdatedContent(productId_, oldContentHash, newContentHash_);
  }

  /// @notice update the price of a product
  /// @dev will throw if emergency stop is active
  /// @param productId_ The id of the product
  /// @param newPrice_ The new price of this product
  function updateProductPrice(uint productId_, uint newPrice_)
    external
    canUpdateProduct(productId_, msg.sender)
  {
    require(newPrice_ >= MIN_PRODUCT_PRICE, "new product price should be at least 0.01 ETH");

    uint oldPrice = productIdToProduct[productId_].price;

    productIdToProduct[productId_].price = newPrice_;
    productIdToProduct[productId_].updatedAt = now;

    emit ProductUpdatedPrice(productId_, oldPrice, newPrice_);
  }

  /// @notice update the contentHash + price of a product
  /// @dev will throw if emergency stop is active
  /// @param productId_ The id of the product
  /// @param newContentHash_ The new IPFS content hash as bytes32
  /// @param newPrice_ The new price of this product
  function updateProductContentAndPrice(uint productId_, bytes32 newContentHash_, uint newPrice_)
    external
    canUpdateProduct(productId_, msg.sender)
  {
    require(newContentHash_ != bytes32(0), "new content hash cannot be 0x0");
    require(newPrice_ >= MIN_PRODUCT_PRICE, "new product price should be at least 0.01 ETH");

    bytes32 oldContentHash = productIdToProduct[productId_].contentHash;
    uint oldPrice = productIdToProduct[productId_].price;

    productIdToProduct[productId_].contentHash = newContentHash_;
    productIdToProduct[productId_].price = newPrice_;
    productIdToProduct[productId_].updatedAt = now;

    emit ProductUpdatedContent(productId_, oldContentHash, newContentHash_);
    emit ProductUpdatedPrice(productId_, oldPrice, newPrice_);
  }

  /// @notice remove a product
  /// @dev will throw if emergency stop is active
  /// @param productId_ The id of the product
  function removeProduct(uint productId_)
    external
    canUpdateProduct(productId_, msg.sender)
  {
    uint productIdIdx = productIdToStoreIndex[productId_];
    uint storeId = productIdToProduct[productId_].storeId;

    uint storeProductIdsLen = storeIdToProductIds[storeId].length;

    // there is more than 1 item in the list, and this is not the last item
    if (storeProductIdsLen > 1 && (productIdIdx < (SafeMath.sub(storeProductIdsLen, 1)))) {
      uint lastProductId = storeIdToProductIds[storeId][SafeMath.sub(storeProductIdsLen, 1)];
      storeIdToProductIds[storeId][productIdIdx] = lastProductId;
      productIdToStoreIndex[lastProductId] = productIdIdx;
    }

    // reset mapping
    productIdToStoreIndex[productId_] = 0;

    // remove last array item
    storeIdToProductIds[storeId].length = SafeMath.sub(storeIdToProductIds[storeId].length, 1);

    // reset storage of store to all zeroes, should get a gas refund)
    productIdToProduct[productId_] = Product({
      id: 0,
      storeId: 0,
      contentHash: bytes32(0),
      price: 0,
      quantity: 0,
      exists: false,
      createdAt: 0,
      updatedAt: 0
    });

    emit ProductRemoved(productId_, storeId);
  }

  /// @notice purchase a specific quantity of a specific product
  /// @dev will throw if emergency stop is active
  /// @dev excess eth amount is refunded
  /// @param productId_ The id of the product
  /// @param quantity_ The quantity to purchase
  function purchaseProduct(uint productId_, uint quantity_)
    external
    payable
    //
    // Checks
    //
    canPurchaseProductQuantity(productId_, msg.sender, quantity_, msg.value)
  {
    //
    // Retrieve/calculate needed data
    //

    // get storage link so we can update what's stored inside storage
    Product storage product = productIdToProduct[productId_];

    // calculate how much eth purchasing x of this product costs
    // use SafeMath to prevent BatchOverflow vulnerability
    uint totalPrice = SafeMath.mul(quantity_, product.price);

    // get the owner of the store to which this product belongs
    address storeowner = stores.getStoreOwner(product.storeId);

    //
    // Effects
    //

    // update storage
    product.quantity = SafeMath.sub(product.quantity, quantity_);


    //
    // Interactions
    //

    // - forward the ETH totalprice of quantity * pice to the Bank contract
    // - update the store owners withdrawable balance inside the Bank contract
    bank.addFunds.value(totalPrice)(storeowner);

    // refund the excess ETH to the caller
    // cannot underflow, we check msg.value is equal to/more than totalPrice in canPurchaseProductQuantity
    uint moreThanEnough = msg.value - totalPrice;
    if (moreThanEnough > 0) {
      msg.sender.transfer(moreThanEnough);
    }

    emit ProductPurchased(productId_, msg.sender, product.price, quantity_, product.quantity);
  }

  //
  //
  // Functions: Getters
  //
  //

  /// @notice retrieve a specific Product from its id
  /// @dev will work even if emergency stop is active
  /// @dev return as array since we cannot (yet) return a Struct from a solidity function
  /// @param _storeId The id of the product
  /// @return _productId The id of the product
  /// @return _storeId The id of the store this product belongs to
  /// @return _contentHash The ipfs hash (as bytes32) of the product
  /// @return _price The price of this product
  /// @return _quantity_ The quantity left
  /// @return _createdAt The timestamp at which this product was created
  /// @return _updatedAt The timestamp at which this product was created
  /// @return _exists True if product exists, false otherwise
  function getProduct(uint productId_)
    external
    view
    returns(uint _productId, uint _storeId, bytes32 _contentHash, uint _price, uint _quantity, uint _createdAt, uint _updatedAt, bool _exists)
  {
    Product memory product = productIdToProduct[productId_];
    _productId = product.id;
    _storeId = product.storeId;
    _contentHash = product.contentHash;
    _price = product.price;
    _quantity = product.quantity;
    _createdAt = product.createdAt;
    _updatedAt = product.updatedAt;
    _exists = product.exists;
  }

  /// @notice get the product count of a specific store
  /// @dev will work even if emergency stop is active
  /// @param storeId_ The id of the store
  /// @return The number of products in the store
  function getStoreProductCount(uint storeId_)
    external
    view
    returns(uint)
  {
    return storeIdToProductIds[storeId_].length;
  }

  /// @notice check if a product exists
  /// @dev will work even if emergency stop is active
  /// @param productId_ The id of the product
  /// @return True if product exists, false otherwise
  function productExists(uint productId_)
    public
    view
    returns(bool)
  {
    return productIdToProduct[productId_].exists;
  }

  /// @notice check if an address is the owner of the store of a particular product
  /// @dev will work even if emergency stop is active
  /// @param productId_ The id of the product
  /// @param addr_ The address to check
  /// @return True if address is storeowner of product's store, false otherwise
  function productIsOwnedBy(uint productId_, address addr_)
    public
    view
    returns(bool)
  {
    return stores.getStoreOwner(productIdToProduct[productId_].storeId) == addr_;
  }
}
