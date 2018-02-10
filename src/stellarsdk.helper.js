import constants from './constants';
import {Err} from './utils/error';

function createDto(options) {
	var dto = constants.DTO;
	dto.env = options.env;
	dto.invoice.currency = options.currency;
	dto.invoice.total = options.total;
	dto.payment.asset = StellarSdk.Asset.native();
	dto.payment.fee = .00001;
	dto.payment.memo = options.memo;
	dto.payment.to = options.destinationKey;
	return dto;
};

function loadSdk(callback) {
	if (window && window.StellarSdk) {
		console.log(Err('StellarSdk already loaded', constants.MESSAGE_TYPE.INFO));
		callback.call();
		return false;
	}
	var script = document.createElement('script');
	script.src = constants.STELLAR_SDK_URL;
	script.async = true;

	script.onload = function() {
		callback.call();
	};

	var head = document.getElementsByTagName('head')[0];
	if (head) {
		head.appendChild(script);
	}
	return true;
};

function receivePayment(dto, callback) {
	var networkUri = setNetwork(dto);
	var server = new StellarSdk.Server(networkUri);
	var accountId = dto.destinationKey;
	var payments = server
		.payments()
		.forAccount(accountId)
		.cursor('now');

	var closeStream = payments.stream({
	  onmessage: function(payment) {
	    if (payment.to !== accountId) {
	      return;
	    }
	    var asset = (payment.asset_type === 'native') ? 'lumens' : payment.asset_code + ':' + payment.asset_issuer;
	    var result = verifyPayment(dto, payment);
	    if (result) {
	    	callback.call(this, null, payment);	
	    	closeStream();
	    }
	  },
	  onerror: function(error) {
	    console.error('Error in payment stream');
	  }
	});
}

function sendPayment(dto) {
	var networkUri = setNetwork(dto);
	var server = new StellarSdk.Server(networkUri);
	var sourceKeys = StellarSdk.Keypair.fromSecret(dto.privateKey);
	var destinationId = dto.payment.to;
	var transaction;

	return server.loadAccount(destinationId)
	.catch(StellarSdk.NotFoundError, function (error) {
		throw new Error('The destination account does not exist!');
	})
	.then(function() {
		return server.loadAccount(sourceKeys.publicKey());
	})
	.then(function(sourceAccount) {
		transaction = new StellarSdk
		.TransactionBuilder(sourceAccount)
		.addOperation(StellarSdk.Operation.payment({
			destination: destinationId,
			asset: dto.payment.asset,
			amount: dto.payment.amount
		}))
		.addMemo(StellarSdk.Memo.text(dto.memo))
		.build();

		transaction.sign(sourceKeys);

		return server.submitTransaction(transaction);
	})
	.then(function(result) {
		return result;
	});
};

function setNetwork(dto) {
	var networkUri;
	if (typeof dto.env === 'string' && dto.env.toLowerCase() === 'production') {
		networkUri = 'https://horizon.stellar.org';
		window.StellarSdk.Network.usePublicNetwork();
	} else {
		networkUri = 'https://horizon-testnet.stellar.org';
		window.StellarSdk.Network.useTestNetwork();
	}
	return networkUri;
}

function verifyPayment(dto, payment) {
	var amountIsEqual = dto.payment.amount === payment.amount;
	var publicKeyIsEqual = dto.payment.from === payment.from;
	var result = amountIsEqual && publicKeyIsEqual;
	return result;
}

export default {
	createDto: createDto,
	loadSdk: loadSdk,
	receivePayment: receivePayment,
	sendPayment: sendPayment
}