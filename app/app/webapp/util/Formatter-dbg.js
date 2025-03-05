/*
 * Copyright (C) 2009-2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("fin.cash.flow.analyzer.util.Formatter");
jQuery.sap.require("sap.ui.core.format.NumberFormat");
jQuery.sap.require("sap.ui.core.format.DateFormat");
fin.cash.flow.analyzer.util.Formatter = {
	getI18n: function() {
		var sUrl = sap.ui.resource("fin.cash.flow.analyzer.i18n", "i18n.properties");
		var oi18n = jQuery.sap.resources({
			url: sUrl
		});
		return oi18n;
	},

	convertViewType: function(sViewType, sDirection) {

		var sStr = sViewType;

		if (sViewType === "2FLOWS") {
			if (sDirection === "+") {
				sStr = "sap-icon://arrow-left";
				this.setColor("green");
			} else if (sDirection === "-") {
				sStr = "sap-icon://arrow-right";
				this.setColor("red");
			}

		} else if (sViewType === "3END_BAL") {
			sStr = "sap-icon://monitor-payments";
			this.setColor("rgb(0, 124, 192)");
		} else if (sViewType === "1BEG_BAL") {
			this.setColor("rgb(0, 124, 192)");
			sStr = "sap-icon://money-bills";
		}

		return sStr;
	},
	formatAmount: function(amount, currency, scaling, decimals) {
			var unit = Math.pow(10, scaling);
			amount = parseFloat(amount) / unit;
			var oCurrencyFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance({
				"decimals": decimals,
				"currencyCode": true
			});
			return oCurrencyFormat.format(amount);
		},
	
	formatValueText: function(Value, Text) {
		if (Value) {
			return Value + " (" + Text + ")";
		} else {
			return "";
		}
	},
	
	formatDate: function(oDate) {
		if (!oDate) {
			return '';
		}
		var formatter = sap.ui.core.format.DateFormat.getDateInstance({
			style: 'medium'
		});
		return formatter.format(oDate, false);
	},
	
	formatSourceApp: function(app) {
		var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
		if (app === "CMSND") {
			return oResourceBundle.getText("SOURCE_APP_CMSND1");
		}
		if (app === "CMDSR") {
			return oResourceBundle.getText("SOURCE_APP_CMDSR1");
		}
		if (app === "FICA") {
			return oResourceBundle.getText("SOURCE_APP_FICA");
		}
		if (app === "REFX") {
			return oResourceBundle.getText("SOURCE_APP_REFX");
		}
		if (app === "CML") {
			return oResourceBundle.getText("SOURCE_APP_CML");
		}
		if (app === "MEBAC") {
			return oResourceBundle.getText("SOURCE_APP_MEBAC");
		}
		if (app === "TRM") {
			return oResourceBundle.getText("SOURCE_APP_TRM");
		}
		if (app === "BS") {
			return oResourceBundle.getText("SOURCE_APP_BS");
		}
		if (app === "CFI") {
			return oResourceBundle.getText("SOURCE_APP_CFI");
		}
		if (app === "IBS") {
			return oResourceBundle.getText("SOURCE_APP_IBS");
		}
		if (app === "FI") {
			return oResourceBundle.getText("SOURCE_APP_FI");
		}
		if (app === "PARK") {
			return oResourceBundle.getText("SOURCE_APP_PARKED");
		}
		if (app === "FDES") {
			return oResourceBundle.getText("SOURCE_APP_FDES");
		}
		if (app === "AP") {
			return oResourceBundle.getText("SOURCE_APP_AP");
		}
		if (app === "AR") {
			return oResourceBundle.getText("SOURCE_APP_AR");
		}
		if (app === "FIP2P") {
			return oResourceBundle.getText("SOURCE_APP_FIP2P");
		}
		if (app === "SD") {
			return oResourceBundle.getText("SOURCE_APP_SD");
		}
		if (app === "MM") {
			return oResourceBundle.getText("SOURCE_APP_MM");
		}
		if (app === "AGG") {
			return oResourceBundle.getText("SOURCE_APP_AGG");
		}
		if (app === "IBU") {
			return oResourceBundle.getText("SOURCE_APP_IBU");
		}
		if (app === "PAYRQ") {
			return oResourceBundle.getText("SOURCE_APP_PAYRQ");
		}
		if (app === "PYORD") {
			return oResourceBundle.getText("SOURCE_APP_PYORD");
		}
		if (app === "RMTE") {
			return oResourceBundle.getText("SOURCE_APP_RMTE");
		}
		if (app === "INTRA") {
			return oResourceBundle.getText("SOURCE_APP_INTRA");
		}
		if (app === "CSHRQ") {
			return oResourceBundle.getText("SOURCE_APP_CSHRQ");
		}
		if (app === "BALVR") {
			return oResourceBundle.getText("SOURCE_APP_BALVR");
		}
	}
};