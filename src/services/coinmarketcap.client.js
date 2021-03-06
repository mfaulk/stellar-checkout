import constants from '../constants';
import {formatDecimal7} from '../utils/formatter';
import {httpRequest} from '../utils/http';
import {replace} from '../utils/string';

export function CoinMarketCapClient(totalElem, amountElem, currencyConversionInfoElem) {
	this.totalElem = totalElem;
	this.amountElem = amountElem;
	this.currencyConversionInfoElem = currencyConversionInfoElem;
	this.url = constants.STELLAR_CHECKOUT_API_TICKER_URL,
	this.currency = constants.DTO.invoice.currency;
	this.total = constants.DTO.invoice.total;
	this.data = [];
	this.spinner = amountElem.parentNode.querySelector(constants.SELECTOR.spinner);
	if (!isNaN(this.total) && parseFloat(this.total) > 0) {
		this.fetch();
	}
}

CoinMarketCapClient.prototype.fetch = function() {
	var self = this;
	self.showProgress();
	return httpRequest('GET', self.url, { currency: constants.DTO.invoice.currency })
	.then(function(response) {
		if (response) {
			var data = JSON.parse(response);
			if (data.length > 0) {
				var lumenPrice = data[0]['price_' + constants.DTO.invoice.currency.toLowerCase()];
				if (lumenPrice) {
					self.currencyConversionInfoElem.innerHTML = '1XLM = ' + replace(formatDecimal7(lumenPrice), ',', '') + '' + self.currency;
					var priceInLumens = self.calcPriceInLumens(constants.DTO.invoice.total, lumenPrice);
					var formattedPrice = replace(formatDecimal7(priceInLumens), ',', '');
					self.amountElem.setAttribute('value', formattedPrice);
					self.amountElem.setAttribute('disabled', 'disabled');
					self.amountElem.dispatchEvent(new Event('input'));
					constants.DTO.payment.total = priceInLumens;
				}
				self.data = data;
			}
			self.hideProgress();	
		}
	});
};

CoinMarketCapClient.prototype.calcPriceInLumens = function(invoiceTotal, lumenPrice) {
	return invoiceTotal / lumenPrice;
};

CoinMarketCapClient.prototype.hideProgress = function() {
	this.spinner.classList.add(constants.CLASS.hidden);
};

CoinMarketCapClient.prototype.showProgress = function() {
	this.spinner.classList.remove(constants.CLASS.hidden);
};