/*
 * Copyright (C) 2009-2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/format/NumberFormat"
], function () {
	"use strict";

	return {

		convertDateTimeToABAPDateTime: function () {
			var t = this;
			var y = t.getFullYear();
			var m = t.getMonth() + 1;
			var d = t.getDate();
			var h = t.getHours();
			var mm = t.getMinutes();
			var s = t.getSeconds();
			var ms = t.getMilliseconds();

			var s2 = function (v) {
				return v > 9 ? ('' + v) : ('0' + v);
			};
			var s3 = function (v) {
				var r = '';
				if (v < 10) {
					r = '00' + v;
				} else if (v < 100) {
					r = '0' + v;
				} else {
					r = r + v;
				}
				return r;
			};
			
			return y + '-' + s2(m) + '-' + s2(d) + 'T' + s2(h) + ':' + s2(mm) + ':' + s2(s) + '.' + s3(ms) + 'Z';
		},

		getI18N: function () {
			// var sLocale = sap.ui.getCore().getConfiguration().getLanguage();
			var sUrl = sap.ui.resource("fin.cash.flow.analyzer.i18n", "i18n.properties");
			var oi18n = jQuery.sap.resources({
				url: sUrl
			});
			return oi18n;
		},

		getLocaleResourceModel: function () {
			return this.conversions.getI18N();
		},
		drillownVisible: function (sCurrency) {
			if (!sCurrency || sCurrency === "") {
				return false;
			}
			if (sCurrency === "*") {
				return false;
			}
			return true;
		},

		isNull: function (val) {
			if (val === undefined || val === "" || val === null) {
				return true;
			}
			return false;

		},

		formatUTCDateString: function (returnDate) {
			//var utcDate = this.switchLocaltoUTC(returnDate);
			var resultStr = "";
			//add year
			resultStr = resultStr + returnDate.getUTCFullYear();
			//add month
			var m = returnDate.getUTCMonth();
			resultStr = resultStr + (m + 1 < 10 ? "0" + (m + 1) : (m + 1));
			//add date
			var d = returnDate.getUTCDate();
			resultStr = resultStr + (d < 10 ? "0" + d : d);
			var h = returnDate.getUTCHours();
			resultStr = resultStr + (h < 10 ? "0" + h : h);
			var mm = returnDate.getUTCMinutes();
			resultStr = resultStr + (mm < 10 ? "0" + mm : mm);
			var s = returnDate.getUTCSeconds();
			resultStr = resultStr + (s < 10 ? "0" + s : s);
			// var ss = utcDate.getUTCMilliseconds();
			// resultStr = resultStr + (ss < 10? "0" + ss: ss);

			return resultStr;
		},

		switchUTCtoLocal: function (returnDate) { // for backend to display
			var d = returnDate.getUTCDate();
			var m = returnDate.getUTCMonth();
			var y = returnDate.getUTCFullYear();
			var newDate = new Date(y, m, d);
			return newDate;
		},

		switchLocaltoUTC: function (returnDate) { // for send request
			var y = returnDate.getFullYear();
			var m = returnDate.getMonth();
			var d = returnDate.getDate();
			var h = returnDate.getHours();
			var mm = returnDate.getMinutes();
			var s = returnDate.getSeconds();
			var newDate = new Date(Date.UTC(y, m, d, h, mm, s));
			return newDate;
		},

		getValueDateDefault: function () {
			var oToday = new Date();
			return oToday.toJSON();
		},

		getHistoryDateTimeDefault: function () {
			var oToday = new Date();
			oToday.setHours(23);
			oToday.setMinutes(59);
			oToday.setSeconds(59);

			return oToday;
		},

		dateFormat: function (dDate) {

			if (dDate) {
				var locate = sap.ui.getCore().getConfiguration().getLocale();
				var formatSettings = sap.ui.getCore().getConfiguration().getFormatSettings();

				var pattern = formatSettings.getDatePattern("short");
				var formatter = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: pattern
				}, locate);
				if (!(dDate instanceof Date)) {
					//		throw this.conversions.getI18N().getText("EXCTPDATE");
					return "";
				}
				return formatter.format(dDate);
			}
			return "";
		},

			dateFormatRange: function (dDate1,dDate2) {

			if (dDate1 && dDate2) {
				var locate = sap.ui.getCore().getConfiguration().getLocale();
				var formatSettings = sap.ui.getCore().getConfiguration().getFormatSettings();

				var pattern = formatSettings.getDatePattern("short");
				var formatter = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: pattern
				}, locate);
				if (!(dDate1 instanceof Date) || !(dDate2 instanceof Date) ) {
					//		throw this.conversions.getI18N().getText("EXCTPDATE");
					return "";
				}
				return ( formatter.format(dDate1) + "—" + formatter.format(dDate2));
			}
			return "";
        },
        
		convertDateToABAPDate: function (oDate) {
			if (oDate instanceof Date) {
				return (oDate.getFullYear().toString()) +
					(oDate.getMonth().toString().length === 1 ? "0" + (oDate.getMonth() + 1).toString() : (oDate.getMonth() + 1).toString()) +
					(oDate.getDate().toString().length === 1 ? "0" + oDate.getDate().toString() : oDate.getDate().toString());
			} else {
				return oDate;
			}
		},

		convertABAPDateToDate: function (sDate) {
			if (sDate) {
				return new Date(sDate.substr(0, 4), parseInt(sDate.substr(4, 2), 10) - 1, sDate.substr(6, 2));
			} else {
				return null;
			}
		},

		formatAmountWithBankAccountCurrency: function (amount, currency, scaling, viewType) {
			var scalingStyle = "standard";
			if (scaling === "0") {
				scalingStyle = "standard";
			} else if (scaling === "1") {
				scalingStyle = "short";
			} else if (scaling === "2") {
				scalingStyle = "long";
			}

			if (amount === 0 || amount === null || currency === "") {
				if (!currency) {
					return "";
				} else {
					if (viewType === "2FLOWS") {
						return "-";
					}
					var oFormatOptions = {};
					oFormatOptions.currencyCode = true;
					oFormatOptions.emptyString = 0;
					oFormatOptions.style = scalingStyle;
					oFormatOptions.showMeasure = false;
					oFormatOptions.groupingEnabled = true;
					oFormatOptions.currencyContext = "standard"; //'accounting';//'standard';//accounting';
					// oFormatOptions.decimals = decimals;

					var formatter = sap.ui.core.format.NumberFormat.getCurrencyInstance(oFormatOptions);
					return ("0" + formatter.format(1, currency).substr(1, 5) + " " + currency);
				}
			} else {
				if (amount && currency) {
					oFormatOptions = {};
					oFormatOptions.currencyCode = true;
					oFormatOptions.emptyString = 0;
					oFormatOptions.style = scalingStyle;
					oFormatOptions.showMeasure = false;
					oFormatOptions.groupingEnabled = true;
					oFormatOptions.currencyContext = "standard"; //'accounting';//'standard';//accounting';
					//oFormatOptions.decimals = decimals;

					formatter = sap.ui.core.format.NumberFormat.getCurrencyInstance(oFormatOptions);
					return (formatter.format(amount, currency) + " " + currency);

				}

			}
		},

		formatAmountWithBankAccountCurrencyS: function (amount, currency, scaling, viewType) {

			var scalingStyle = "standard";
			if (scaling === "0") {
				scalingStyle = "standard";
			} else if (scaling === "1") {
				scalingStyle = "short";
			} else if (scaling === "2") {
				scalingStyle = "long";
			}

			if (amount === 0 || amount === null || currency === "") {
				if (!currency) {
					return "";
				} else {
					if (viewType === "2FLOWS") {
						return "-";
					}
					var oFormatOptions = {};
					oFormatOptions.currencyCode = true;
					oFormatOptions.emptyString = 0;
					oFormatOptions.style = scalingStyle;
					oFormatOptions.showMeasure = false;
					oFormatOptions.groupingEnabled = true;
					oFormatOptions.currencyContext = "standard"; //'accounting';//'standard';//accounting';
					//oFormatOptions.decimals = decimals;

					var formatter = sap.ui.core.format.NumberFormat.getCurrencyInstance(oFormatOptions);
					return ("0" + formatter.format(1, currency).substr(1, 5) + " " + currency);
				}
			} else {
				if (amount && currency) {
					oFormatOptions = {};
					oFormatOptions.currencyCode = true;
					oFormatOptions.emptyString = 0;
					oFormatOptions.style = scalingStyle;
					oFormatOptions.showMeasure = false;
					oFormatOptions.groupingEnabled = true;
					oFormatOptions.currencyContext = "standard";
					//oFormatOptions.decimals = decimals;

					formatter = sap.ui.core.format.NumberFormat.getCurrencyInstance(oFormatOptions);
					return (formatter.format(amount, currency) + " " + currency);

				}

			}
		},

		getHierarchyIcon: function (sIsData, sHierType) {

			if (sIsData === "X") {
				if (sHierType === "GLH") {
					return "sap-icon://account";
				}
				return "sap-icon://loan";
			} else {
				return "";
			}
		},
		convertViewType: function (sViewType, sDirection) {

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

		convertViewTypeTooltip: function (sViewType, sDirection) {

			var sStr = sViewType;
			var oi18n = this.conversions.getI18N();

			if (sViewType === "2FLOWS") {
				if (sDirection === "+") {
					sStr = oi18n.getText("INFLOW");
				} else {
					sStr = oi18n.getText("OUTFLOW");
				}
			} else if (sViewType === "3END_BAL") {
				sStr = oi18n.getText("ENDINGBAL");
			} else if (sViewType === "1BEG_BAL") {
				sStr = oi18n.getText("BEGINNINGBAL");
			}

			return sStr;

		},
		formatValueWithNotAssign: function (sValue) {
			var oi18n = this.conversions.getI18N();
			if (sValue === "") {
				sValue = oi18n.getText("NotAssign");
			}
			return sValue;
		},

		getWeekNum: function (sDate) {

			var sYear = sDate.getFullYear();
			var sMonth = sDate.getMonth() + 1;
			var sDay = sDate.getDate();

			var date1 = new Date(sYear, parseInt(sMonth, 10) - 1, sDay),
				date2 = new Date(sYear, 0, 1),
				d = Math.round((date1.valueOf() - date2.valueOf()) / 86400000);

			return Math.ceil(
				(d + ((date2.getDay() + 1) - 1)) / 7
			);
		},

		getMonth: function (sMonth) {
			switch (sMonth) {
			case 1:
				return "January";
			case 2:
				return "February";
			case 3:
				return "March";
			case 4:
				return "April";
			case 5:
				return "May";
			case 6:
				return "June";
			case 7:
				return "July";
			case 8:
				return "August";
			case 9:
				return "September";
			case 10:
				return "October";
			case 11:
				return "November";
			case 12:
				return "December";
			}
			return null;
		},

		getQuarter: function (sMonth) {
			switch (sMonth) {
			case 1:
				return "Quarter1";
			case 2:
				return "Quarter1";
			case 3:
				return "Quarter1";
			case 4:
				return "Quarter2";
			case 5:
				return "Quarter2";
			case 6:
				return "Quarter2";
			case 7:
				return "Quarter3";
			case 8:
				return "Quarter3";
			case 9:
				return "Quarter3";
			case 10:
				return "Quarter4";
			case 11:
				return "Quarter4";
			case 12:
				return "Quarter4";
			}
			return null;
		},

		convertUTCDateToBrowerDate: function (dateUTC) {
			var y = dateUTC.getUTCFullYear();
			var m = dateUTC.getUTCMonth();
			var d = dateUTC.getUTCDate();
			dateUTC = new Date(y, m, d);
			return dateUTC;
		},

		convertHierarchyColumnHeader: function (sColumnName) {
			var sCycleDescription = {};
			sCycleDescription.sTooltip = "";
			sCycleDescription.label = "";
			sCycleDescription.sTooltipDsply = "";
			sCycleDescription.labelDsply = "";

			if (sColumnName) {
				var sClmnNameAry = sColumnName.split(";");
				if (sClmnNameAry.length === 4) {
					var dateFromStr = sClmnNameAry[0];
					var dateActualFromStr = sClmnNameAry[2];
					var dateActualToStr = sClmnNameAry[3];
					dateFromStr = dateFromStr.substr(1, 4) + "-" + dateFromStr.substr(5, 2) + "-" + dateFromStr.substr(7, 2);
					dateActualFromStr = dateActualFromStr.substr(1, 4) + "-" + dateActualFromStr.substr(5, 2) + "-" + dateActualFromStr.substr(7, 2);
					dateActualToStr = dateActualToStr.substr(1, 4) + "-" + dateActualToStr.substr(5, 2) + "-" + dateActualToStr.substr(7, 2);

					var dateFrom = new Date(dateFromStr);
					dateFrom = this.convertUTCDateToBrowerDate(dateFrom);
					var dateActualFrom = new Date(dateActualFromStr);
					dateActualFrom = this.convertUTCDateToBrowerDate(dateActualFrom);
					var dateActualTo = new Date(dateActualToStr);
					dateActualTo = this.convertUTCDateToBrowerDate(dateActualTo);

					switch (sClmnNameAry[0].substr(0, 1)) {
					case "D":
						sCycleDescription.label = this.dateFormat(dateFrom);
						sCycleDescription.sTooltip = this.dateFormat(dateActualFrom) + "~" + this.dateFormat(dateActualTo);
						break;
					case "W":
						sCycleDescription.label = this.getI18N().getText("Week") + this.getWeekNum(dateFrom).toString() + ", " + dateFrom.getFullYear().toString();
						sCycleDescription.sTooltip = this.dateFormat(dateActualFrom) + "~" + this.dateFormat(dateActualTo);
						break;
					case "Y":
						sCycleDescription.label = dateFrom.getFullYear().toString();
						sCycleDescription.sTooltip = this.dateFormat(dateActualFrom) + "~" + this.dateFormat(dateActualTo);
						break;
					case "Q":
						sCycleDescription.label = this.getQuarter(dateFrom.getMonth() + 1).toString() + ", " + dateFrom.getFullYear().toString();
						sCycleDescription.sTooltip = this.dateFormat(dateActualFrom) + "~" + this.dateFormat(dateActualTo);
						break;
					case "M":
						sCycleDescription.label = this.getMonth(dateFrom.getMonth() + 1).toString() + ", " + dateFrom.getFullYear().toString();
						sCycleDescription.sTooltip = this.dateFormat(dateActualFrom) + "~" + this.dateFormat(dateActualTo);
						break;
					default:
					}
				}
				sCycleDescription.sTooltipDsply = sCycleDescription.sTooltip + this.getI18N().getText("DisplayCurrency");
				sCycleDescription.labelDsply = sCycleDescription.label;
			}
			return sCycleDescription;
		},

		getForecastCertaintyLevelList: function () {
			return [
				"SI_CIT",
				"TRM_D",
				"REC_N",
				"PAY_N",
				"TRM_O",
				"CMIDOC",
				"FICA",
				"SDSO",
				"MEMO",
				"MMPO",
				"MMPR",
				"MMSA",
				"SDSA",
				"PAYRQ",
				"PYORD",
				"FIP2P",
				"LEASE",
				"PARKED"
			];
		},

		getValidForecastCretaintyLevelList: function (selectionList) {
			var resultList = [];
			var certaintyLevelList = this.getForecastCertaintyLevelList();

			for (var i = 0; i < selectionList.length; i++) {

				if (certaintyLevelList.includes(selectionList[i])) {
					resultList.push(new sap.ui.model.Filter("CertaintyLevel", 'EQ', selectionList[i]));
				}

			}

			return resultList;

		},

		hasValidForecastCertaintyLevelSelected: function (selectionList) {

			var certaintyLevelList = this.getForecastCertaintyLevelList();

			for (var i = 0; i < selectionList.length; i++) {

				if (certaintyLevelList.includes(selectionList[i])) {
					return true;
				}

			}

			return false;

		},

		hasActualCertaintyLevelSeleced: function (selectionList) {

			return selectionList.includes("ACTUAL");
		},

		hasIntraCertaintyLevelSelected: function (selelctionList) {
			return selelctionList.includes("INTRAM");
		}

	};
});
