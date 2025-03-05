/*
 * Copyright (C) 2009-2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([

		"sap/ui/model/json/JSONModel",
		"fin/cash/flow/analyzer/model/formatter",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/core/routing/History",
		"sap/ui/generic/app/navigation/service/SelectionVariant",
		"sap/ui/generic/app/navigation/service/NavigationHandler",
		"fin/cash/flow/analyzer/util/Conversions",
		"fin/cash/flow/analyzer/util/StringUtil",
		"sap/suite/ui/commons/util/DateUtils",
		"fin/cash/flow/analyzer/util/Formatter"
	],

	function() {
		"use strict";

		return {
			onCalculateValueDate: function(sflag, that) {

				var sTimePeriod = "";
				switch (that.getView().getViewName()) {
					case "fin.cash.flow.analyzer.view.LiquidityItemHierarchy":
						sTimePeriod = that.getView().byId("idCyclePatternForLQ").getValue();
						break;
					case "fin.cash.flow.analyzer.view.BankAccountHierarchy":
						sTimePeriod = that.getView().byId("idCyclePatternForBA").getValue();
						break;
					default:
						sTimePeriod = that.getView().byId("idCyclePattern").getValue();
						break;
				}

				var sEndofPeriod = that.oCurrSmartFilterBar.getFilterData(true).EndofPeriod;
				var sCalendar = that.getView().getModel("Scaling").getData().factoryCalendarId;

				if (sEndofPeriod === "X" || sCalendar !== "*") {

					var oFieldMapping = that.getView().getModel("FieldMapping").oData;
					var sValueDate = new Date(oFieldMapping[oFieldMapping.length - 1].from);
					sValueDate = new Date(sValueDate.setDate(sValueDate.getDate() + 1));

				} else {

					var sValueDate = new Date(that.oCurrSmartFilterBar.getFilterData().KeyDate);

					var sCycleArray = sTimePeriod.split('+');
					for (var i = 0; i < sCycleArray.length; i++) {
						if (sCycleArray[i][0] === 'Y') {

							var sYear = parseInt(sCycleArray[i].substring(1, sCycleArray[i].length));
							if (sflag === false) {
								sValueDate = new Date(sValueDate.setFullYear(sValueDate.getFullYear() - sYear));

							} else {
								sValueDate = new Date(sValueDate.setFullYear(sValueDate.getFullYear() + sYear));

							}

						} else if (sCycleArray[i][0] === 'Q') {

							var sMonth = parseInt(sCycleArray[i].substring(1, sCycleArray[i].length)) * 3;
							if (sflag === false) {
								sValueDate = new Date(sValueDate.setMonth(sValueDate.getMonth() - sMonth));

							} else {
								sValueDate = new Date(sValueDate.setMonth(sValueDate.getMonth() + sMonth));

							}

						} else if (sCycleArray[i][0] === 'M') {

							var sMonth = parseInt(sCycleArray[i].substring(1, sCycleArray[i].length));
							if (sflag === false) {
								sValueDate = new Date(sValueDate.setMonth(sValueDate.getMonth() - sMonth));

							} else {
								sValueDate = new Date(sValueDate.setMonth(sValueDate.getMonth() + sMonth));

							}

						} else if (sCycleArray[i][0] === 'W') {

							var sDay = parseInt(sCycleArray[i].substring(1, sCycleArray[i].length)) * 7;
							if (sflag === false) {
								sValueDate = new Date(sValueDate.setDate(sValueDate.getDate() - sDay));

							} else {
								sValueDate = new Date(sValueDate.setDate(sValueDate.getDate() + sDay));

							}

						} else if (sCycleArray[i][0] === 'D') {

							var sDay = parseInt(sCycleArray[i].substring(1, sCycleArray[i].length));
							if (sflag === false) {
								sValueDate = new Date(sValueDate.setDate(sValueDate.getDate() - sDay));

							} else {
								sValueDate = new Date(sValueDate.setDate(sValueDate.getDate() + sDay));

							}

						}
					}
				}

				this.onHanldeCycle(sValueDate, sTimePeriod, that);
			},

			onHanldeCycle: function(oValueDate, sTimePeriod, that) {

				switch (that.getView().getViewName()) {
					case "fin.cash.flow.analyzer.view.LiquidityItemHierarchy":
						var oSelectionVariants = new sap.ui.generic.app.navigation.service.SelectionVariant(that.oCurrSmartFilterBar.getDataSuiteFormat());
						var sValueDate = oValueDate;
						oSelectionVariants.removeSelectOption("KeyDate");
						oSelectionVariants.removeSelectOption("CyclePattern");
						oSelectionVariants.removeParameter("KeyDate");
						oSelectionVariants.removeParameter("CyclePattern");
						oSelectionVariants.addSelectOption("KeyDate", "I", "EQ", sValueDate.toJSON());
						oSelectionVariants.addSelectOption("CyclePattern", "I", "EQ", sTimePeriod);

						if (oSelectionVariants.getParameter("BankAccountGroup") === undefined) {
							oSelectionVariants.addParameter("FromMainView", "X");
						}

						//that.variantjson = that.oCurrSmartTable.fetchVariant();

						var oFilterJson = JSON.parse(that.aDrilldownfilter);
						for (var i = 0; i < oFilterJson.SelectOptions.length; i++) {
							if (oFilterJson.SelectOptions[i].PropertyName === "SortOrder") {
								oSelectionVariants.addSelectOption("SortOrder", "I", "EQ",oFilterJson.SelectOptions[i].Ranges[0].Low + "%");
							}
						}

						var oNavParameters = {
							oDrilldownfilter: oSelectionVariants.toJSONString()
						};
						var bReplace = true;
						var starget = "LiquidityItemHierarchy";
						that.getRouter().navTo(starget, {
							Params: JSON.stringify(oNavParameters).toBase64URI()
						}, bReplace);

						that.aDrilldownfilter = oNavParameters.oDrilldownfilter;
						// that.initAppState();
						break;
					case "fin.cash.flow.analyzer.view.BankAccountHierarchy":
						var oSelectionVariants = new sap.ui.generic.app.navigation.service.SelectionVariant(that.oCurrSmartFilterBar.getDataSuiteFormat());
						var sValueDate = oValueDate;
						oSelectionVariants.removeSelectOption("KeyDate");
						oSelectionVariants.removeSelectOption("CyclePattern");
						oSelectionVariants.removeParameter("KeyDate");
						oSelectionVariants.removeParameter("CyclePattern");
						oSelectionVariants.addSelectOption("KeyDate", "I", "EQ", sValueDate.toJSON());
						oSelectionVariants.addSelectOption("CyclePattern", "I", "EQ", sTimePeriod);

						//that.variantjson = that.oCurrSmartTable.fetchVariant();

						var oNavParameters = {
							oDrilldownfilter: oSelectionVariants.toJSONString()
						};
						var bReplace = true;
						var starget = "BankAccountHierarchy";
						that.getRouter().navTo(starget, {
							Params: JSON.stringify(oNavParameters).toBase64URI()
						}, bReplace);

						that.aDrilldownfilter = oNavParameters.oDrilldownfilter;
						// that.initAppState();

						break;
					default:
						var oSelectionVariants = new sap.ui.generic.app.navigation.service.SelectionVariant(that.oCurrSmartFilterBar.getDataSuiteFormat());
						var sValueDate = oValueDate;
						oSelectionVariants.removeSelectOption("KeyDate");
						oSelectionVariants.removeSelectOption("CyclePattern");
						oSelectionVariants.removeParameter("KeyDate");
						oSelectionVariants.removeParameter("CyclePattern");
						oSelectionVariants.addSelectOption("KeyDate", "I", "EQ", sValueDate.toJSON());
						oSelectionVariants.addSelectOption("CyclePattern", "I", "EQ", sTimePeriod);
						if (that.getView().getViewName() === "fin.cash.flow.analyzer.view.FlowContent") {
							that.variantjson = that.oCurrSmartTable.fetchVariant();
						}
						var oNavParameters = {
							oDrilldownfilter: oSelectionVariants.toJSONString()
						};
						var bReplace = true;
						var starget = "Worklist_D";
						that.getRouter().navTo(starget, {
							Params: JSON.stringify(oNavParameters).toBase64URI()
						}, bReplace);
						if (that.getView().getViewName() === "fin.cash.flow.analyzer.view.Worklist_D") {
							that.aDrilldownfilter = oNavParameters.oDrilldownfilter;
							// that.initAppState();
						}
						break;
				}

				//this.oCurrSmartTable.rebindTable(true);
			}

		};

	});