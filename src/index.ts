import $ from "jquery";
import { ethers } from 'ethers';
import { ArbFactoryFactory, ArbFactory, ArbValue } from 'arb-provider-ethers'

import './style.scss';

export {}
declare global {
  interface Window {
    ethereum: any;
    web3: any;
  }
}


require("bootstrap/dist/css/bootstrap.min.css");

const ROLLUP_FACTORY = "0xd309F6Ba1B53CbDF9c0690eD1316A347eBb7adf9";

let factory: ArbFactory;

async function getWeb3(): Promise<ethers.providers.Web3Provider> {
    var standardProvider = null;
	if (window.ethereum) {
	    standardProvider = window.ethereum;
	    try {
	    	// Request account access if needed
	    	return window.ethereum.enable().then(() => {
	    		return new ethers.providers.Web3Provider(window.ethereum);	
	    	});
	  	} catch (error) {
	    	throw Error("User denied account access");
	  	}
	} else if (window.web3) {
	  	// Legacy dapp browsers...
	  	return new ethers.providers.Web3Provider(window.web3.currentProvider);
	} else {
	  	// Non-dapp browsers...
	  	throw Error(
	    	"Non-Ethereum browser detected. You should consider trying MetaMask!"
	  	);
	}
};

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
			$("#machineHash").html(machineHash);
			$("#inputFile").data("title", "Machine Hash: " + machineHash);
		});
    }
    throw Error("Couldn't read file");
}

function setConfigFields(
	gracePeriod: number,
	arbGasSpeed: number,
	maxSteps: number,
	maxTimeWidth: number,
	stakeRequirement: number
) {
	$("#gracePeriod").val(gracePeriod);
	$("#arbGasSpeed").val(arbGasSpeed);
	$("#maxSteps").val(maxSteps);
	$("#maxTimeWidth").val(maxTimeWidth);
	$("#stakeRequirement").val(stakeRequirement);
}

function getConfigFields() {
	return {
		gracePeriod: $("#gracePeriod").val(),
		arbGasSpeed: $("#arbGasSpeed").val(),
		maxSteps: $("#maxSteps").val(),
		maxTimeWidth: $("#maxTimeWidth").val(),
		stakeRequirement: $("#stakeRequirement").val()
	};
}

function setLocalConfig() {
	let t = document.getElementById("gracePeriod");
	console.log(t);
	if (t) {
		console.log(t.);
	}
	setConfigFields(
		450,
		20000000,
		1000000000,
		20,
		1,
	);
}

// async function createRollup() {

// 	let gracePeriod = ($("#gracePeriod") as HTMLInputElement) .val();
// 	let maxArbGasSpeed = $("#arbGasSpeed").val();
// 	let maxSteps = $("#maxSteps").val();
// 	let maxTimeWidth = $("#maxTimeWidth").val();
// 	let stakeRequirement = $("#stakeRequirement").val()
// 	if (!gracePeriod) {
// 		return;
// 	}

// 	factory.functions.createRollup(
// 		"0x",
// 		ethers.utils.bigNumberify(gracePeriod),
// 		ethers.utils.bigNumberify(maxArbGasSpeed),
// 		ethers.utils.bigNumberify(maxSteps),
// 		ethers.utils.bigNumberify(maxTimeWidth),
// 		ethers.utils.bigNumberify(stakeRequirement),
// 		"0x0000000000000000000000000000000000000000",
// 	);
// }

async function init() {
	let provider = await getWeb3();

	let wallet = provider.getSigner(0);

	let factoryProv = ArbFactoryFactory.connect(ROLLUP_FACTORY, provider);

	factory = factoryProv.connect(wallet);
	// factory.functions.createRollup()

	$("#inputFile").on('change', readContractFile);

	$("#localTestingPreset").on('click', setLocalConfig);

	// factory.createRollup();
}

window.addEventListener("DOMContentLoaded", init);


// ArbRollupFactory.connect(ROLLUP_FACTORY)