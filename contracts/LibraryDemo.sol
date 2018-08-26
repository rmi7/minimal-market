pragma solidity ^0.4.21;

// EthPM imports
import "oraclize-api/usingOraclize.sol"; // contract
import "bytes/BytesLib.sol";             // library


/// @author Alexander 'rmi7' Remie
/// @title LibraryDemo contract
contract LibraryDemo is usingOraclize {
  //
  //
  // Variables
  //
  //

  using BytesLib for bytes;

  uint public myNumber;     // tests oraclize function
  address public myAddress; // tests bytes function

  //
  //
  // Functions: Setters
  //
  //

  /// @notice convert input string to number and save it in myNumber storage variable
  /// @param _number The number as string
	function loadNumFromStr(string _number)
    external
  {
    myNumber = parseInt(_number);
	}

  /// @notice convert input bytes to address starting at offset 4 and save
  ///         it in myAddress storage variable
  /// @param _bytes The bytes array
  function extractAddressFromBytesAtOffset(bytes _bytes)
    external
  {
    myAddress = _bytes.toAddress(4);
	}
}
