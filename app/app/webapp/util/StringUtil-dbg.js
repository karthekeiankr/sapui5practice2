/*
 * Copyright (C) 2009-2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("fin.cash.flow.analyzer.util.StringUtil");

(function() {
	var withValue = function(value) {
		return {
			value: value,
			enumerable: false,
			writable: true,
			configurable: true
		};
	};

	if (!String.prototype.hasOwnProperty('endsWith')) {
		Object.defineProperty(
			String.prototype, 'endsWith', withValue(function(suffix) {
				return this.indexOf(suffix, this.length - suffix.length) !== -1;
			}));
	}

	var fromCharCode = String.fromCharCode;

	var convertUnicodeToByte = function(c) {
		var s, cc;
		if (c.length < 2) {
			cc = c.charCodeAt(0);
			s = cc < 0x80 ? c : cc < 0x800 ? (fromCharCode(0xc0 | (cc >>> 6)) +
				fromCharCode(0x80 | (cc & 0x3f))) : (fromCharCode(0xd0 | ((cc >>> 12) & 0x0f)) +
				fromCharCode(0x80 | ((cc >>> 6) & 0x3f)) +
				fromCharCode(0x80 | (cc & 0x3f)));
		} else {
			cc = (c.charCodeAt(0) - 0xD800) * 0x400 +
				(c.charCodeAt(1) - 0xDC00);
			s = (fromCharCode(0xe0 | ((cc >>> 18) & 0x03)) +
				fromCharCode(0x80 | ((cc >>> 12) & 0x3f)) +
				fromCharCode(0x80 | ((cc >>> 6) & 0x3f)) +
				fromCharCode(0x80 | (cc & 0x3f)));
		}
		return s;
	};

	var reUnicodeToByte = new RegExp([
		'[\uD800-\uDBFF][\uDC00-\uDFFF]', // non-Basic-Multilingual-Plane characters
		'[^\x00-\x7F]' // non-ASCII
	].join('|'), 'g');

	var convertUnicodeStringToByte = function(u) {
		return u.replace(reUnicodeToByte, convertUnicodeToByte);
	};

	var convertByteToUnicode = function(c) {
		var s, cc;
		switch (c.length) {
			case 4:
				cc = ((0x03 & c.charCodeAt(0)) << 18) | ((0x3f & c.charCodeAt(1)) << 12) | ((0x3f & c.charCodeAt(2)) << 6) | (0x3f & c.charCodeAt(3));
				s = (fromCharCode((cc >>> 10) + 0xD800) +
					fromCharCode((cc & 0x3FF) + 0xDC00));
				break;
			case 3:
				cc = ((0x0f & c.charCodeAt(0)) << 12) | ((0x3f & c.charCodeAt(1)) << 6) | (0x3f & c.charCodeAt(2));
				s = fromCharCode(cc);
				break;
			default:
				cc = ((0x1f & c.charCodeAt(0)) << 6) | (0x3f & c.charCodeAt(1));
				s = fromCharCode(cc);
				break;
		}
		return s;
	};

	var reByteToUnicode = new RegExp([
		'[\xE0-\xE3][\x80-\xBF]{3}',
		'[\xD0-\xDF][\x80-\xBF]{2}',
		'[\xC0-\xDF][\x80-\xBF]'
	].join('|'), 'g');

	var convertByteToUnicodeString = function(b) {
		return b.replace(reByteToUnicode, convertByteToUnicode);
	};

	if (!String.prototype.hasOwnProperty('toBase64')) {
		Object.defineProperty(
			String.prototype, 'toBase64', withValue(function() {
				return btoa(convertUnicodeStringToByte(this));
			}));
	}

	if (!String.prototype.hasOwnProperty('toBase64URI')) {
		Object.defineProperty(
			String.prototype, 'toBase64URI', withValue(function() {
				return this.toBase64().replace(/[+\/=]/g, function(match) {
					return match === '+' ? '-' : match === '/' ? '_' : '.';
				});
			}));
	}

	if (!String.hasOwnProperty('fromBase64')) {
		Object.defineProperty(
			String, 'fromBase64', withValue(function(str) {
				return convertByteToUnicodeString(atob(str));
			}));
	}

	if (!String.hasOwnProperty('fromBase64URI')) {
		Object.defineProperty(
			String, 'fromBase64URI', withValue(function(str) {
				return String.fromBase64(str.replace(/[-_\.]/g, function(match) {
					return match === '-' ? '+' : match === '_' ? '/' : '=';
				}));
			}));
	}
})();