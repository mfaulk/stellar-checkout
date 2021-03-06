import {init} from './app';
import constants from './constants';
import {validateConfig} from './utils/config.checker';

export default {
	name: constants.APP.name,
	ui: {
		render: function(selector, opts) {
			this.selector = selector;
			this.options = {};
			this.options.selector = selector;
			this.options.currency = opts.currency;
			this.options.destinationKey = opts.destinationKey;
			this.options.env = opts.env || 'development';
			this.options.lang = opts.lang || 'en';
			this.options.memo = opts.memo;
			this.options.redirectUrl = opts.redirectUrl;
			this.options.onSubmit = opts.onSubmit;
			this.options.stylesheet = opts.stylesheet;
			this.options.timeout = opts.timeout || constants.TIMEOUT;
			this.options.total = opts.total;

			var self = this;

			document.addEventListener('DOMContentLoaded', function() {
				validateConfig(self.options)
				.then(function() {
					init(self.options);
				});
			});
		}
	}
};