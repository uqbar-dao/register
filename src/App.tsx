import React, { useState, useEffect } from "react";
import ConnectWallet from "./components/ConnectWallet";
import ClaimUqName from "./components/ClaimUqName";
// import ethers from 'ethers';

function App() {
  return (
    <div>
      <ConnectWallet />
      <ClaimUqName />
    </div>
  )
}

export default App;
