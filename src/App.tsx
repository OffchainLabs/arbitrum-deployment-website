import React from 'react';
import './App.scss';
import { ArbValue } from 'arb-provider-ethers'
import { ArbFactoryFactory } from 'arb-provider-ethers/dist/lib/abi/ArbFactoryFactory'
import { ArbFactory } from 'arb-provider-ethers/dist/lib/abi/ArbFactory'

function readFileAsync(file: File): Promise<Uint8Array> {
	return new Promise<Uint8Array>((resolve, reject) => {
		var reader = new FileReader();
	    reader.onload = () => {
	    	if (reader.result) {
	    		let buf = (reader.result as ArrayBuffer);
	    		resolve(new Uint8Array(buf))
	    	}
	    }
	    reader.onerror = () => {
	    	console.log(reader.error);
	    }
	    reader.readAsArrayBuffer(file);
	});
}

function readContractFile(): Promise<void> {
	let input = document.getElementById("inputFile") as HTMLInputElement;
	if (input.files && input.files[0]) {
		return readFileAsync(input.files[0]).then((data) => {
      let machineHash = ArbValue.contractMachineHash(data);
      console.log('machine hash', machineHash)
		});
    }
    throw Error("Couldn't read file");
}

const App = () => {
  return (
    <div className="App">
      <div>Arbitrum Rollup Chain Creator</div>
      <div>
        <div>Presets</div>
      </div>
      <div>
        <div>Chain Parameters</div>
        <div>
          <div>Machine Hash</div>
          <div>Stake requirement (ETH)</div>
          <div>Grace period (seconds) </div>
          <div>Arb Gas Speed</div>
          <div>Max steps</div>
          <div>Max time bounds width (blocks)</div>
        </div>
      </div>
    </div>
  );
}

export default App;
