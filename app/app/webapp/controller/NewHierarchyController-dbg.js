/*
 * Copyright (C) 2009-2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"fin/cash/flow/analyzer/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/generic/app/navigation/service/SelectionVariant",
	"sap/ui/generic/app/navigation/service/NavigationHandler",
	"fin/cash/flow/analyzer/util/Conversions",
	"fin/cash/flow/analyzer/util/StringUtil",
	"fin/cash/flow/analyzer/controller/ExternalNavigationController",
	"fin/cash/flow/analyzer/controller/CycleController",
	"fin/cash/flow/analyzer/helper/AppSettingsHelper",
	"fin/cash/flow/analyzer/util/ErrorHandler",
	"sap/ui/core/util/File",
	"sap/ui/table/Column"
], function (
	BaseController,
	JSONModel,
	History,
	SelectionVariant,
	NavigationHandler,
	Conversions,
	StringUtil,
	ExtrNavigation,
	CycleController,
	AppSettingsHelper,
	ErrorHandler,
	File,
	Column
) {
	"use strict";
	return BaseController.extend("fin.cash.flow.analyzer.controller.NewHierarchyController", {

		conversions: Conversions,
		util: null,
		oPersonalizer: null,
		cController: CycleController,
		aDrilldownfilter: [],
		oMyView: null,
		oDataPath: null,
		oTreeTable: null,
		oJsonModel: null, //new sap.ui.model.json.JSONModel(),
		oDataToJsonTreeResultBA: {},
		oDataToJsonTreeResultLQ: {},
		oDataToJsonTreeResultCP: {},
		oSelectedPath: null,
		bIsInitialised: false,

		//begin of initialization=======================================================================================================
		onInit: function () {

			this.oNav = ExtrNavigation;
			this.util = Conversions;
			this.cycleController = CycleController;
			this.oNavigationHandler = new NavigationHandler(this);
			this.oMyView = this.getView().byId("page");
			this.sortData = {};

			this.oJsonModel = new sap.ui.model.json.JSONModel();
			this.oWnerComponent = this.getOwnerComponent();
			this.oResourceBundle = this.oWnerComponent.getModel("i18n").getResourceBundle();
			this.oDataModel = this.oWnerComponent.getModel();
			this.oDataModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
			this.setModel(this.oDataModel);
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			this.oErrorHandler = ErrorHandler;
			this.oErrorHandler.initODateErrorHandler(this.oWnerComponent);
			this.oColumn = Column;

			/*var that = this;

			var oShareTile = this.getView().byId("shareTile");

			oShareTile.setAppData({

				title: this.oResourceBundle.getText("appDescription"),
				// BOOKMARK START

				customUrl: function () {
					that.storeCurrentAppState();
					return document.URL;
				}

			});

			oShareTile.setBeforePressHandler(function () {

				var oCutsomUrl = that.generateCustomUrl();

				oShareTile.setAppData({

					title: that.oResourceBundle.getText("appDescription"),
					// BOOKMARK START

					customUrl: oCutsomUrl

				});
			});*/

			var oPageModel = new sap.ui.model.json.JSONModel({
				headerExpanded: true
			});
			this.getView().setModel(oPageModel, "page");

			if (sap.ui.Device.system.desktop) { // Mandatory: apply compact mode if it's desktop app
				this.getView().addStyleClass("sapUiSizeCompact");
			}

			if (this.getView().getViewName() === "fin.cash.flow.analyzer.view.LiquidityItemHierarchy") {
				this.sHierType = "LQH";
				this.oDataPath = "/FCLM_CFBA_LQH_VIEWSet";
				this.oCurrSmartFilterBar = this.byId("smartFilterBarItemForLQ");
				this.getRouter().getRoute("LiquidityItemHierarchy").attachPatternMatched(this.onRefresh, this);
			}
			if (this.getView().getViewName() === "fin.cash.flow.analyzer.view.BankAccountHierarchy") {
				this.sHierType = "BKH";
				this.oDataPath = "/FCLM_CFBA_BKH_VIEWSet";
				this.oCurrSmartFilterBar = this.byId("smartFilterBarItemForBA");
				this.getRouter().getRoute("BankAccountHierarchy").attachPatternMatched(this.onRefresh, this);
			}
			if (this.getView().getViewName() === "fin.cash.flow.analyzer.view.CashConcentrationSim") {
				this.sHierType = "CPS";
				this.oDataPath = "/FCLM_CFBA_CP_SIMSet";
				this.oCurrSmartFilterBar = this.byId("smartFilterBarItemForCPSim");
				this.getRouter().getRoute("CashConcentrationSim").attachPatternMatched(this.onRefresh, this);
			}
		},
		
		onAfterRendering: function() {
			var that = this;
			var sTitle;
            that.oWnerComponent.getService("ShellUIService").then(
            	function (oShellUIService) {
            		if (oShellUIService) {
            			switch (that.sHierType) {
							case "BKH":
								sTitle = that.oResourceBundle.getText("BAHierarchyViewTitle");
								break;
							case "LQH":
								sTitle = that.oResourceBundle.getText("hierarchyViewTitle");
								break;
							case "CPS":
								sTitle = that.oResourceBundle.getText("CPSimViewTitle");
								break;
            			}
            			oShellUIService.setTitle(sTitle);
            		}
            	},
            	function (sError) {
            		// error handling
            	}
            );
        },
		
		storeCurrentAppState: function () {
			var oAppStatePromise = this.oNavigationHandler.storeInnerAppState(this.getCurrentAppState());
			var that = this;
			oAppStatePromise.fail(function (oError) {
				that.arOwnerFilters(oError);
			});
		},

		getCurrentAppState: function () {
			// Special handling for selection fields, for which defaults are defined:
			// If a field is visible in the SmartFilterBar and the user has cleared the input value, the field is not included in the selection variant, which 
			// is returned by getDataSuiteFormat() of the SmartFilterBar. But since it was cleared by purpose, we have to store the selection with the value "",
			// in order to set it again to an empty value, when restoring the selection after a back navigation. Otherwise, the default value would be set.
			// var oCyclePattern = this.getView().byId("idCyclePattern").getValue();

			var oSelectionVariant = new SelectionVariant(this.oCurrSmartFilterBar.getDataSuiteFormat());
			if (this.sHierType !== "CPS") {
				// remove existing cyclepattern variant
				oSelectionVariant.removeParameter("CyclePattern");
	
				if (this.sHierType === "BKH") {
					oSelectionVariant.addSelectOption("CyclePattern", "I", "EQ", this.getView().byId("idCyclePatternForBA").getValue());
				} else {
					oSelectionVariant.addSelectOption("CyclePattern", "I", "EQ", this.getView().byId("idCyclePatternForLQ").getValue());
				}
			}
			return {
				selectionVariant: oSelectionVariant.toJSONString()
			};
		},

		getCustomAppStateData: function () {
			var customerData = {
				CyclePattern: this.oCurrSmartFilterBar.getControlByKey("CyclePattern").getValue()
			};
			return customerData;
		},

		generateCustomUrl: function () {

			this.storeCurrentAppState();
			return document.URL;

		},

		onRefresh: function (oEvent) {

			var oArguments = oEvent.getParameter("arguments");
			var oNavParameters = null;
			if (oArguments) {
				oNavParameters = JSON.parse(String.fromBase64URI(oArguments.Params));
			}
			oNavParameters = $.extend({
				oDrilldownfilter: null
			}, oNavParameters);
			this.aDrilldownfilter = oNavParameters.oDrilldownfilter;

			var oHistory = sap.ui.core.routing.History.getInstance();
			if (oHistory.getDirection() !== "Backwards" // && this.bIsInitial === true
			) {
				if (this.oCurrSmartFilterBar.isInitialised() === true && this.bIsInitialised === false && !this.oShareActionSheet === true) {
					this.initAppState();
				}
			}

		},

		onInitSmartFilterBar: function () {
			if (this.oCurrSmartFilterBar.isInitialised() === true && this.bIsInitialised === false) {
				this.initAppState();
			}
		},

		initAppState: function () {

			var oParseNavigationPromise = this.oNavigationHandler.parseNavigation();
			var that = this;
			var oSelectionVariants = null;
			var sHierType = this.sHierType;

			oParseNavigationPromise.done(function (oAppData, oURLParameters, sNavType) {
				this.bIsInitialised = true;

				switch (sNavType) {
				case sap.ui.generic.app.navigation.service.NavType.iAppState:
					if (sHierType !== "CPS") {
						oSelectionVariants = new sap.ui.generic.app.navigation.service.SelectionVariant(oAppData.selectionVariant);
						var valueDate = oSelectionVariants.getValue("KeyDate");
						var cyclePatton = oSelectionVariants.getValue("CyclePattern");
						var historicalTimeStamp = oSelectionVariants.getValue("HistoricalTimeStamp");
						var dateIndicator = oSelectionVariants.getValue("DateIndicator");
						var oFilterJson = JSON.parse(that.aDrilldownfilter);
						var aFilterNames = [];
						aFilterNames.length = 0;
						that.FromMainView = false;
						that.SortOrder = "";
						for (var i = 0; i < oFilterJson.Parameters.length; i++) {
							if (oFilterJson.Parameters[i].PropertyName === "FromMainView") {
								that.FromMainView = true;
								continue;
							}
							aFilterNames.push(oFilterJson.Parameters[i].PropertyName);
						}
						for (i = 0; i < oFilterJson.SelectOptions.length; i++) {
							if (oFilterJson.SelectOptions[i].PropertyName === "SortOrder") {
								that.SortOrder = oFilterJson.SelectOptions[i].Ranges[0].Low;
								continue;
							}
							aFilterNames.push(oFilterJson.SelectOptions[i].PropertyName);
						}
	
						var aFilterItems = that.oCurrSmartFilterBar.getAllFilterItems();
	
						for (i = 0; i < aFilterItems.length; i++) {
	
							var sFilterItemName = aFilterItems[i].getName();
							for (var j = 0; j < aFilterNames.length; j++) {
								if (sFilterItemName === aFilterNames[j]) {
									aFilterItems[i].setVisibleInFilterBar(true);
								}
							}
	
						}
	
						if (that.util.isNull(valueDate)) {
							oSelectionVariants.addSelectOption("KeyDate", "I", "EQ", that.util.getValueDateDefault());
						}
						if (that.util.isNull(cyclePatton)) {
							oSelectionVariants.addSelectOption("CyclePattern", "I", "EQ", "D7");
						}
						if (that.util.isNull(historicalTimeStamp)) {
							oSelectionVariants.addSelectOption("HistoricalTimeStamp", "I", "EQ", that.util.getHistoryDateTimeDefault());
						}
						that.oCurrSmartFilterBar.getControlByKey("HistoricalTimeStamp").setDateValue(new Date(Date.parse(oSelectionVariants.getValue(
							"HistoricalTimeStamp")[0].Low)));
	
						that.oCurrSmartFilterBar.getControlByKey("CyclePattern").setValue(oSelectionVariants.getValue("CyclePattern")[0].Low);
						
						if (that.util.isNull(dateIndicator)) {
							oSelectionVariants.addSelectOption("DateIndicator", "I", "EQ", "1");
						}
						
						oAppData.selectionVariant = oSelectionVariants.toJSONString();
					}
					
					that.oCurrSmartFilterBar.setDataSuiteFormat(oAppData.selectionVariant);
					that.getPersonalSettings();
					break;

				default:

					var oFilterJson = JSON.parse(that.aDrilldownfilter);
					var aFilterNames = [];
					aFilterNames.length = 0;
					that.FromMainView = false;
					for (var i = 0; i < oFilterJson.Parameters.length; i++) {
						if (oFilterJson.Parameters[i].PropertyName === "FromMainView") {
							that.FromMainView = true;
							continue;
						}
						aFilterNames.push(oFilterJson.Parameters[i].PropertyName);
					}
					for (i = 0; i < oFilterJson.SelectOptions.length; i++) {
						if (oFilterJson.SelectOptions[i].PropertyName === "SortOrder") {
							that.SortOrder = oFilterJson.SelectOptions[i].Ranges[0].Low;
							continue;
						}
						aFilterNames.push(oFilterJson.SelectOptions[i].PropertyName);
					}

					aFilterItems = that.oCurrSmartFilterBar.getAllFilterItems();

					for (i = 0; i < aFilterItems.length; i++) {

						sFilterItemName = aFilterItems[i].getName();
						for (j = 0; j < aFilterNames.length; j++) {
							if (sFilterItemName === aFilterNames[j]) {
								aFilterItems[i].setVisibleInFilterBar(true);
							}
						}

					}
					that.oCurrSmartFilterBar.clearVariantSelection();
					that.oCurrSmartFilterBar.clear();
					that.oCurrSmartFilterBar.setDataSuiteFormat(that.aDrilldownfilter, true);
					var oSelectVariants = new sap.ui.generic.app.navigation.service.SelectionVariant(that.aDrilldownfilter);
					if (that.sHierType !== "CPS") {
						var prmtrList = JSON.parse(that.aDrilldownfilter).Parameters;
						for (i = 0; i < prmtrList.length; i++) {
							if (prmtrList[i].PropertyName === "CyclePattern") {
								if (that.sHierType === "BKH") {
									that.getView().byId("idCyclePatternForBA").setValue(prmtrList[i].PropertyValue);
								}
								if (that.sHierType === "LQH") {
									that.getView().byId("idCyclePatternForLQ").setValue(prmtrList[i].PropertyValue);
								}
							}
	
							if (prmtrList[i].PropertyName === "HistoricalTimeStamp") {
								if (that.sHierType === "BKH") {
									if (prmtrList[i].PropertyValue) {
										that.getView().byId("idHistoricalTimeStampForBA").setDateValue(new Date(Date.parse(prmtrList[i].PropertyValue)));
									} else {
										that.getView().byId("idHistoricalTimeStampForBA").setDateValue(that.util.getHistoryDateTimeDefault());
									}
								}
								if (that.sHierType === "LQH") {
									if (prmtrList[i].PropertyValue) {
										that.getView().byId("idHistoricalTimeStampForLQ").setDateValue(new Date(Date.parse(prmtrList[i].PropertyValue)));
									} else {	
										that.getView().byId("idHistoricalTimeStampForLQ").setDateValue(that.util.getHistoryDateTimeDefault());
									}
								}
							}
						}
						// set default value for exchange rate type.
						if (!oSelectVariants.getValue("ExRateType")) {
							oSelectVariants.addSelectOption("ExRateType", "I", "EQ", "M");
							that.oCurrSmartFilterBar.setDataSuiteFormat(oSelectVariants.toJSONString(), true);
						}
					} else {
						if (!oSelectVariants.getValue("ExchangeRateType")) {
							oSelectVariants.addSelectOption("ExchangeRateType", "I", "EQ", "M");
							that.oCurrSmartFilterBar.setDataSuiteFormat(oSelectVariants.toJSONString(), true);
						}
					}
					//this.sendRequest();
					that.getPersonalSettings();
					break;
				}
			});
		},

		//end of initialization=======================================================================================================

		setRequestFilters: function(aFilters){
			var oFilter = null;
			var sViewCyclePattern = null;
			var sViewHistoricalTimeStamp = null;
			if (this.getView().getViewName() === "fin.cash.flow.analyzer.view.BankAccountHierarchy") {
				sViewCyclePattern = this.getView().byId("idCyclePatternForBA").getValue();
				sViewHistoricalTimeStamp = this.getView().byId("idHistoricalTimeStampForBA").getDateValue();
			}
			if (this.getView().getViewName() === "fin.cash.flow.analyzer.view.LiquidityItemHierarchy") {
				sViewCyclePattern = this.getView().byId("idCyclePatternForLQ").getValue();
				sViewHistoricalTimeStamp = this.getView().byId("idHistoricalTimeStampForLQ").getDateValue();
			}
			if (sViewCyclePattern) {
				oFilter = new sap.ui.model.Filter("HistoricalTimeStamp", "EQ", this.util.formatUTCDateString(sViewHistoricalTimeStamp));
			} else {
				oFilter = new sap.ui.model.Filter("HistoricalTimeStamp", "EQ", this.util.formatUTCDateString(new Date()));
			}
			aFilters.push(oFilter);

			var oSelectionVariant = new sap.ui.generic.app.navigation.service.SelectionVariant(this.oCurrSmartFilterBar.getDataSuiteFormat());

			var releaseFlagSelection = oSelectionVariant.getParameter("ReleaseFlag");
			if (releaseFlagSelection !== undefined) {
				if (parseInt(releaseFlagSelection) === 0) { //no, only release flow is needed
					var oFilterRelease = new sap.ui.model.Filter("ReleaseStatus", 'EQ', "");
					aFilters.push(oFilterRelease);
				}
			}

			//add reconcliation status filter value
			var flg_recon = "";
			var flv_recon_0 = new sap.ui.model.Filter("ReconcliationStatus", "EQ", "0");
			if (aFilters[0].aFilters) {
				var iLength = aFilters[0].aFilters.length;
				for (var i = 0; i < iLength; i++) {
					var oFltrVal = aFilters[0].aFilters[i].aFilters;
					if (oFltrVal) {
						if (oFltrVal[0].sPath === "ReconcliationStatus") {
							oFltrVal.push(flv_recon_0);
							flg_recon = "X";
						}
					}
				}
			}
			if (flg_recon === "") {
				aFilters.push(flv_recon_0);
			}

			if (sViewHistoricalTimeStamp) {
				oFilter = new sap.ui.model.Filter("CyclePattern", "EQ", sViewCyclePattern);
			} else {
				oFilter = new sap.ui.model.Filter("CyclePattern", "EQ", "D7");
			}
			aFilters.push(oFilter);

			var aFiltersData = aFilters[0];
			var currencyVal = false;
			var exRt = false;
			//check the amount of filters in the array
			if (aFiltersData._bMultiFilter === false) {
				if (aFiltersData.sPath === "DisplayCurrency") {
					currencyVal = true;
				}
			} else {
				var filterList = aFiltersData.aFilters;
				for (var i = 0; i < filterList.length; i++) {
					if (filterList[i].sPath === "DisplayCurrency") {
						currencyVal = true;
					}
					if (filterList[i].sPath === "ExRateType") {
						exRt = true;
					}
				}
			}

			if (currencyVal === true && exRt === false) {
				oFilter = new sap.ui.model.Filter("ExRateType", "EQ", "M");
				aFilters.push(oFilter);
			}

			if (this.sHierType === "LQH" && currencyVal === false) {
				this.oMyView.setBusy(false);
				return;
			}

			var oFilterJson = JSON.parse(this.aDrilldownfilter);
			for (i = 0; i < oFilterJson.SelectOptions.length; i++) {
				if (oFilterJson.SelectOptions[i].PropertyName === "SortOrder") {
					oFilter = new sap.ui.model.Filter("SortOrder", "EQ", oFilterJson.SelectOptions[i].Ranges[0].Low + "%");
					aFilters.push(oFilter);
				}
			}

			oFilter = new sap.ui.model.Filter("Calendar", sap.ui.model.FilterOperator.EQ, this.getView().getModel("Scaling").getData()
				.factoryCalendarId);
			aFilters.push(oFilter);

			oFilter = new sap.ui.model.Filter("PreviousFlag", sap.ui.model.FilterOperator.EQ, this.getView().getModel("Scaling").getData()
				.previousFlag);
			aFilters.push(oFilter);

			if (this.sHierType === "BKH") {
				oFilter = new sap.ui.model.Filter("IsBankCurrency", sap.ui.model.FilterOperator.EQ, "X");
			} else {
				oFilter = new sap.ui.model.Filter("IsBankCurrency", sap.ui.model.FilterOperator.EQ, this.getView().getModel("Scaling").getData()
				.isBankCurrency);
			}
			aFilters.push(oFilter);
			
			if (this.getView().getViewName() === "fin.cash.flow.analyzer.view.LiquidityItemHierarchy") {
				if (this.FromMainView) {
					oFilter = new sap.ui.model.Filter("ViewType", sap.ui.model.FilterOperator.EQ, 2);
				} else {
					oFilter = new sap.ui.model.Filter("ViewType", sap.ui.model.FilterOperator.EQ, 1);
				}
				aFilters.push(oFilter);
			}
			
		},
		
		// begin of requset prepare ============================================================================================
		sendRequest: function () {
			var sPath = this.oDataPath;
			var oModel = this.oDataModel;
			var aFilters = this.oCurrSmartFilterBar.getFilters();
			
			if (oModel) {
				this.oMyView.setBusy(true);

				if (this.getView().getViewName() !== "fin.cash.flow.analyzer.view.CashConcentrationSim") {
					this.setRequestFilters(aFilters);
				}

				oModel.read(sPath, {
					filters: aFilters,
					//this.handleMyTableDataRefreshReady(oData);
					//success: $.proxy(this.handleMyTableDataRefreshReady, this),
					success: $.proxy(this.handleMyTableDataRefreshReady, this),
					error: $.proxy(this.handleMyTableDataFailed, this)
				});

			}
		},

		sendHeaderRequest: function () {

			var oModel = this.oDataModel;
			if (oModel) {
				var oFilter = null;
				var aFilters = [];
				var sPath = "";

				if (this.sHierType === "BKH") {
					sPath = "/FCLM_CFBA_BKH_VHSet";

					var aFiltersData = this.oCurrSmartFilterBar.getFilters()[0];
					var BankAccountGroupID = "";
					if (aFiltersData._bMultiFilter === false) {
						if (aFiltersData.sPath === "BankAccountGroup") {
							BankAccountGroupID = aFiltersData.oValue1;
						}
					} else {
						var filterList = aFiltersData.aFilters;
						for (var i = 0; i < filterList.length; i++) {
							if (filterList[i].sPath === "BankAccountGroup") {
								BankAccountGroupID = filterList[i].oValue1;
							}
						}
					}

					oFilter = new sap.ui.model.Filter("HierarchyName", sap.ui.model.FilterOperator.EQ, BankAccountGroupID);
					aFilters.push(oFilter);
				}

				if (this.sHierType === "LQH") {
					sPath = "/FCLM_CFBA_LQH_VHSet";

					aFiltersData = this.oCurrSmartFilterBar.getFilters()[0];
					var LiquidityItemHierarchy = "";
					if (aFiltersData._bMultiFilter === false) {
						if (aFiltersData.sPath === "LiquidityHierarchyName") {
							LiquidityItemHierarchy = aFiltersData.oValue1;
						}
					} else {
						filterList = aFiltersData.aFilters;
						for (i = 0; i < filterList.length; i++) {
							if (filterList[i].sPath === "LiquidityHierarchyName") {
								LiquidityItemHierarchy = filterList[i].oValue1;
							}
						}
					}

					oFilter = new sap.ui.model.Filter("HierarchyName", sap.ui.model.FilterOperator.EQ, LiquidityItemHierarchy);
					aFilters.push(oFilter);
				}
				
				if (this.sHierType === "CPS") {
					sPath = "/FCLM_CFBA_CP_VHSet";

					aFiltersData = this.oCurrSmartFilterBar.getFilters()[0];
					var CashPoolName = "";
					if (aFiltersData._bMultiFilter === false) {
						if (aFiltersData.sPath === "HierarchyName") {
							CashPoolName = aFiltersData.oValue1;
						}
					} else {
						filterList = aFiltersData.aFilters;
						for (i = 0; i < filterList.length; i++) {
							if (filterList[i].sPath === "HierarchyName") {
								CashPoolName = filterList[i].oValue1;
							}
						}
					}

					oFilter = new sap.ui.model.Filter("CashPoolName", sap.ui.model.FilterOperator.EQ, CashPoolName);
					aFilters.push(oFilter);
				}

				oModel.read(sPath, {
					filters: aFilters,
					success: $.proxy(this.handleHeaderReady, this),
					error: $.proxy(this.handleMyTableDataFailed, this)
				});
			}
		},

		handleHeaderReady: function (oData) {

			if (this.sHierType === "BKH") {
				if (oData.results.length !== 0) {
					this.extendTreeTable(this.oResourceBundle.getText("BAHID") + " : " + oData["results"][0].HierarchyText);
				}
			}

			if (this.sHierType === "CPS") {
				if (oData.results.length !== 0) {
					this.extendTreeTable(this.oResourceBundle.getText("CPID") + ": " + oData["results"][0].CashPoolDesc);
				}
			}

			if (this.sHierType === "LQH" && this.FromMainView === true) {
				if (oData.results.length !== 0) {
					this.extendTreeTable(this.oResourceBundle.getText("LHH") + " : " + oData["results"][0].HierarchyText);
				}
			}

			if (this.sHierType === "LQH" && this.FromMainView === false) {
				if (oData.results.length !== 0) {
					this.liquidityHierarchy = oData["results"][0].HierarchyText;
				}
				var oModel = this.oDataModel;
				if (oModel) {
					var oFilter = null;
					var aFilters = [];
					var sPath = "";

					sPath = "/FCLM_CFBA_BKH_VHSet";

					var aFiltersData = this.oCurrSmartFilterBar.getFilters()[0];
					var BankAccountGroupID = "";
					if (aFiltersData._bMultiFilter === false) {
						if (aFiltersData.sPath === "BankAccountGroup") {
							BankAccountGroupID = aFiltersData.oValue1;
						}
					} else {
						var filterList = aFiltersData.aFilters;
						for (var i = 0; i < filterList.length; i++) {
							if (filterList[i].sPath === "BankAccountGroup") {
								BankAccountGroupID = filterList[i].oValue1;
							}
						}
					}

					oFilter = new sap.ui.model.Filter("HierarchyName", sap.ui.model.FilterOperator.EQ, BankAccountGroupID);
					aFilters.push(oFilter);
					oModel.read(sPath, {
						filters: aFilters,
						success: $.proxy(this.handleHeaderHNReady, this),
						error: $.proxy(this.handleMyTableDataFailed, this)
					});
				}
			}
		},

		handleHeaderHNReady: function (oData) {
			if (oData.results.length !== 0) {
				this.extendTreeTable(this.oResourceBundle.getText("BAHID") + " : " + oData["results"][0].HierarchyText + " / " + this.oResourceBundle
					.getText(
						"LHH") + " : " + this.liquidityHierarchy);
			}
			else {
				if (this.liquidityHierarchy !== undefined) {
					this.extendTreeTable(this.oResourceBundle.getText("LHH") + " : " + this.liquidityHierarchy);
				}
			}
		},

		getPersonalSettings: function () {
			var oPersonalization = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("Personalization");
			if (oPersonalization) {
				var oPersId = {
					container: "fin.cash.flow.analyzer" +
						((sap.ushell && sap.ushell.Container && sap.ushell.Container.getUser().getId()) || {}),
					item: "favorites"
				};
				this.oPersonalizer = oPersonalization.getPersonalizer(oPersId);
				this.oAppSettingsHelper = new AppSettingsHelper(
					this.getModel(),
					this.getView(),
					this,
					this.oPersonalizer
				);
			}
			this.getUserSetting();
		},

		getUserSetting: function () {
			var that = this;
			that.oAppSettingsHelper.asyncGetSettings(function (oSettings) {
				var scaling = (oSettings.Scaling) ? (oSettings.Scaling) : 0;
				var expend = (oSettings.SettingExpendLevel) ? (oSettings.SettingExpendLevel) : 3;
				var displayCurrency = (oSettings.SettingDisplayCurrency) ? (oSettings.SettingDisplayCurrency) : "";
				/*var isBankCurrency = (oSettings.DB_IsBankCurrency !== undefined && oSettings.DB_IsBankCurrency !== null) ? (oSettings.DB_IsBankCurrency) :
					"1";
				if (isBankCurrency === 1) {
					isBankCurrency = "X";
					this.rbIsBankCurrency = "1";
				} else {
					isBankCurrency = "";
					this.rbIsBankCurrency = "0";
				}*/
				var isBankCurrency;
				if (oSettings.DB_IsBankCurrency !== undefined && oSettings.DB_IsBankCurrency !== null) {
					switch (oSettings.DB_IsBankCurrency) {
						case 0:
							isBankCurrency = "";
							this.rbIsBankCurrency = "0";
							break;
						case 1:
							isBankCurrency = "X";
							this.rbIsBankCurrency = "1";
							break;
						case 2:
							isBankCurrency = "L";
							this.rbIsBankCurrency = "2";
							break;
					}
				} else {
					isBankCurrency = "";
					this.rbIsBankCurrency = "0";
				}
				
				var factoryCalendarId = (oSettings.FactoryCalendarId && oSettings.WorkingRadioBtn && oSettings.WorkingRadioBtn === 1) ? (
					oSettings.FactoryCalendarId) : "*";
				var previousFlag = (oSettings.PreviousFlag && oSettings.WorkingRadioBtn && oSettings.WorkingRadioBtn === 1) ? (
					oSettings.PreviousFlag) : "1";
				var oScalingModel = new JSONModel({
					scaling: scaling,
					expend: expend,
					displayCurrency: displayCurrency,
					isBankCurrency: isBankCurrency,
					factoryCalendarId: factoryCalendarId,
					previousFlag: previousFlag
				});
				this.getView().setModel(oScalingModel, "Scaling");
				this.sendRequest();
				//this.handleMyTableDataRefreshReady(oData);

			}, function () {

				var oScalingModel = new JSONModel({
					scaling: 0,
					expend: 3,
					factoryCalendarId: "*",
					previousFlag: "1"
				});
				this.getView().setModel(oScalingModel, "Scaling");
				this.sendRequest();
				//this.handleMyTableDataRefreshReady(oData);

			}, this);
		},

		handleMyTableDataFailed: function (error) {
			this.oMyView.setBusy(false);
			this.showMessageBoxForODataError(error, this.oResourceBundle.getText("READ_TABLE_DATA_FAILED"));
		},
		// end of requset prepare ============================================================================================

		// begin of column construction and data construction =================================================================================================
		handleMyTableDataRefreshReady: function (oData) {

			var that = this;
			// prepare data 	
			this.oMyView.setBusy(false);
			try {

				if (this.sHierType === "BKH") {

					if (oData.results.length !== 0) {
						var columnHeaderArry = this.getColumnTextAry(oData);
					}
					if (oData.results.length !== 0) {
						this.bnkDsplyCrcyConvertoDataToJson(oData);
					} else {
						this.oDataToJsonTreeResultBA = {};
					}
					// prepare column
					// change label to smartlink
					var oLabel = new sap.ui.comp.navpopover.SmartLink({
						//emphasized: true,
						text: "{name}",
						//id: sIdPattern,
						semanticObject: "BankAccount",
						additionalSemanticObjects: "BankStatement",
						semanticObjectLabel: "{i18n>NAVIGATION}",
						mapFieldToSemanticObject: false,
						beforePopoverOpens: function (oEvent) {
							that.oNav.onBeforePopoverOpensBACC(oEvent, that);
						},
						navigationTargetsObtained: function (oEvent) {
							that.oNav.onTargetObtainedBACC(oEvent, that);
						},
						innerNavigate: function (oEvent) {
							that.oNav.onPopoverLinkPressedBACC(oEvent, that);
						}
					});

					this.aTableCols = [];
					this.aTableCols.push(new this.oColumn({
						width: "250px",
						label: this.oResourceBundle.getText("BNKBNKACCNM"),
						template: oLabel
					}));

					oLabel = new sap.m.Label({
						text: "{description}",
						hAlign: "Left"
					});

					this.aTableCols.push(new this.oColumn({
						width: "150px",
						label: this.oResourceBundle.getText("Description"),
						template: oLabel,
						hAlign: "Left"
					}));

					oLabel = new sap.m.Label({
						text: "{currency}",
						hAlign: "Left"
					});

					if (oData.results.length !== 0) {
						this.createBATableColumns(columnHeaderArry);
					}

					// navi button  f
					var aButton = new sap.m.Button({
						press: function (oEvent) {
							that.onInterNavigationPressed(oEvent, that);
						},
						icon: "sap-icon://org-chart"
					});
					var oColumnb = new this.oColumn({
						hAlign: "Center",
						width: "70px",
						template: aButton
					});

					var oMultiLabel0 = new sap.m.Label({
						text: this.oResourceBundle.getText("BLNavigationShort"),
						hAlign: "Left",
						width: "50px"
					});

					oMultiLabel0.setTooltip(this.oResourceBundle.getText("BLNavigation"));

					oColumnb.removeAllMultiLabels();
					oColumnb.insertMultiLabel(oMultiLabel0, 0);
					this.aTableCols.push(oColumnb);

				}

				if (this.sHierType === "LQH") {
					
					if (oData.results.length !== 0) {
						columnHeaderArry = this.getColumnTextAry(oData);
					}
					// to do for liq
					if (oData.results.length !== 0) {
						this.bnkDsplyCrcyConvertoDataToJson(oData);
					} else {
						this.oDataToJsonTreeResultLQ = {};
					}
					// prepare column
					oLabel = new sap.m.Label({
						//design: "Bold",
						text: "{name}"
					});

					this.aTableCols = [];
					this.aTableCols.push(new this.oColumn({
						width: "300px",
						label: this.oResourceBundle.getText("LQITEM"),
						template: oLabel
					}));

					if (oData.results.length !== 0) {
						this.createBATableColumns(columnHeaderArry);
					}
				}
				
				if (this.sHierType === "CPS") {
					// to do for liq
					if (oData.results.length !== 0) {
						this.bnkDsplyCrcyConvertoDataToJson(oData);
					} else {
						this.oDataToJsonTreeResultCP = {};
					}
					
					oLabel = new sap.ui.comp.navpopover.SmartLink({
						//emphasized: true,
						text: "{name}",
						//id: sIdPattern,
						semanticObject: "BankAccount",
						additionalSemanticObjects: "BankStatement",
						semanticObjectLabel: "{i18n>NAVIGATION}",
						mapFieldToSemanticObject: false,
						beforePopoverOpens: function (oEvent) {
							that.oNav.onBeforePopoverOpensBACC(oEvent, that);
						},
						navigationTargetsObtained: function (oEvent) {
							that.oNav.onTargetObtainedBACC(oEvent, that);
						},
						innerNavigate: function (oEvent) {
							that.oNav.onPopoverLinkPressedBACC(oEvent, that);
						}
					});

					this.aTableCols = [];
					this.aTableCols.push(new sap.ui.table.Column({
						width: "300px",
						label: this.oResourceBundle.getText("BNKBNKACCNM"),
						template: oLabel
					}));
					
					oLabel = new sap.m.Label({
						text: "{description}",
						hAlign: "Left"
					});
					this.aTableCols.push(new sap.ui.table.Column({
						width: "150px",
						label: this.oResourceBundle.getText("Description"),
						template: oLabel,
						hAlign: "Left"
					}));
					oLabel = new sap.m.Label({
						text: "{cashPool}",
						hAlign: "Left"
					});
					this.aTableCols.push(new sap.ui.table.Column({
						width: "150px",
						label: this.oResourceBundle.getText("CPID"),
						template: oLabel,
						hAlign: "Left"
					}));
					oLabel = new sap.m.Label({
						text: "{path:'bankaccountCurrency'}",
						tooltip: "{path:'bankaccountCurrency'}"
//						hAlign: "Left"
					});
					this.aTableCols.push(new sap.ui.table.Column({
						width: "200px",
						label: this.oResourceBundle.getText("BankAccountCurrency"),
						template: oLabel,
						hAlign: "Left"
//                        hAlign: "Right"
					}));
					oLabel = new sap.m.Label({
						text: "{path:'beforeBalance'}",
						tooltip: "{path:'beforeBalance'}",
					});
					this.aTableCols.push(new sap.ui.table.Column({
						width: "200px",
						label: this.oResourceBundle.getText("BeforeBalance"),
						template: oLabel,
						hAlign: "Right"
					}));
					oLabel = new sap.m.Label({
						text: "{path:'beforeBalanceDsp'}",
						tooltip: "{path:'beforeBalanceDsp'}",
					});
					this.aTableCols.push(new sap.ui.table.Column({
						width: "200px",
						label: this.oResourceBundle.getText("BeforeBalanceDsp"),
						template: oLabel,
						hAlign: "Right"
					}));
					oLabel = new sap.m.Label({
						text: "{path:'afterBalance'}",
						tooltip: "{path:'afterBalance'}",
					});
					this.aTableCols.push(new sap.ui.table.Column({
						width: "200px",
						label: this.oResourceBundle.getText("AfterBalance"),
						template: oLabel,
						hAlign: "Right"
					}));
					oLabel = new sap.m.Label({
						text: "{path:'afterBalanceDsp'}",
						tooltip: "{path:'afterBalanceDsp'}",
					});
					this.aTableCols.push(new sap.ui.table.Column({
						width: "200px",
						label: this.oResourceBundle.getText("AfterBalanceDsp"),
						template: oLabel,
						hAlign: "Right"
					}));
					oLabel = new sap.m.Label({
						text: "{path:'transferAmount'}",
						tooltip: "{path:'transferAmount'}",
					});
					this.aTableCols.push(new sap.ui.table.Column({
						width: "200px",
						label: this.oResourceBundle.getText("TransferAmount"),
						template: oLabel,
						hAlign: "Right"
					}));
					oLabel = new sap.m.Label({
						text: "{path:'maxTargetAmount'}",
						tooltip: "{path:'maxTargetAmount'}",
					});
					this.aTableCols.push(new sap.ui.table.Column({
						width: "200px",
						label: this.oResourceBundle.getText("MaxTargetAmount"),
						template: oLabel,
						hAlign: "Right"
					}));
					oLabel = new sap.m.Label({
						text: "{path:'minTransferAmount'}",
						tooltip: "{path:'minTransferAmount'}",
					});
					this.aTableCols.push(new sap.ui.table.Column({
						width: "200px",
						label: this.oResourceBundle.getText("MinTransferAmount"),
						template: oLabel,
						hAlign: "Right"
					}));
				}

				var currFixedColumnCount = 0;
				if (this.sHierType === "BKH") {
					currFixedColumnCount = 3;
				} else if (this.sHierType === "LQH" || this.sHierType === "CPS") {
					currFixedColumnCount = 1;
				}

				this.oTreeTable = new sap.ui.table.TreeTable({ //id: "gentreetable",
					/*	title:"{i18n>tableHeader}", */
					width: "auto",
					editable: false,
					columns: this.aTableCols,
					selectionMode: sap.ui.table.SelectionMode.Single,
					//allowColumnReordering: true,
					fixedColumnCount: currFixedColumnCount,
					visibleRowCountMode: "Auto",
					expandFirstLevel: false
				});

				this.oTreeTable.setNoData(this.oResourceBundle.getText("NO_RESULT"));

				//Create a model and bind the table rows to this model
				this.oTreeTable.addStyleClass("sapUiSizeCondensed");
				if (this.sHierType === "BKH") {
					this.oJsonModel.setData(this.oDataToJsonTreeResultBA);
				}
				if (this.sHierType === "LQH") {
					this.oJsonModel.setData(this.oDataToJsonTreeResultLQ);
				}
				if (this.sHierType === "CPS") {
					this.oJsonModel.setData(this.oDataToJsonTreeResultCP);
				}
				this.oTreeTable.setModel(this.oJsonModel);
				this.oTreeTable.bindRows("/root");
				this.oTreeTable.expandToLevel(0);
				/*			if(oData.results.length === 0){
								this.extendTreeTable();
							}*/
				this.sendHeaderRequest();

			} catch (err) {
				this.handleMyTableDataFailed(err);
			}
		},

		extendTreeTable: function (treeHeader) {
			var oExportToExcelBtn = new sap.m.Button({
				icon: "sap-icon://excel-attachment",
				// type: "Accept",
				// tooltip: "Export to Excel",
				tooltip: "{i18n>TABLE_EXPORT_TEXT}",
				press: jQuery.proxy(function () {
					this.ExportExcel();
				}, this)
			});

			//Button to header demonstrate collapse and expand feature
			var oBtn1 = new sap.m.Button({
				icon: "sap-icon://expand-group",
				press: jQuery.proxy(function () {
					this.oTreeTable.expandToLevel(10);
				}, this)
			});

			var oBtn2 = new sap.m.Button({
				icon: "sap-icon://collapse-group",
				press: jQuery.proxy(function () {
					this.oTreeTable.collapseAll();
				}, this)
			});

			var nxtCycleBtn = new sap.m.Button({
				icon: "sap-icon://navigation-right-arrow",
				tooltip: "{i18n>NEXTCYCLE}",
				press: jQuery.proxy(function () {
					var that = this;
					this.cycleController.onCalculateValueDate(true, that);
				}, this)
			});

			var preCycleBtn = new sap.m.Button({
				icon: "sap-icon://navigation-left-arrow",
				tooltip: "{i18n>PREVIOUSCYCLE}",
				press: jQuery.proxy(function () {
					var that = this;
					this.cycleController.onCalculateValueDate(false, that);
				}, this)
			});

			// disable btnPreviousCycle when end of period is true or calendar is enable
			var sEndofPeriod = this.oCurrSmartFilterBar.getFilterData(true).EndofPeriod;
			var sCalendar = this.getView().getModel("Scaling").getData().factoryCalendarId;
			if (sEndofPeriod || sCalendar !== "*") {
				preCycleBtn.setEnabled(false);
			} else {
				preCycleBtn.setEnabled(true);
			}

			var oTBSpacer = new sap.m.ToolbarSpacer();
			if (this.sHierType === 'CPS') {
				var oExtension = new sap.m.OverflowToolbar({
					design: sap.m.ToolbarDesign.Transparent,
					content: [ /*oLabelDimension,*/ oTBSpacer, oBtn1, oBtn2, oExportToExcelBtn]
				});
			} else {
				oExtension = new sap.m.OverflowToolbar({
					design: sap.m.ToolbarDesign.Transparent,
					content: [ /*oLabelDimension,*/ oTBSpacer, preCycleBtn, nxtCycleBtn, oBtn1, oBtn2, oExportToExcelBtn]
				});
			}
			oExtension.addStyleClass("tablesubtitle");

            this.oTreeTable.destroyExtension();
			this.oTreeTable.addExtension(oExtension);

			this.oTreeTable.setTitle(treeHeader);

			// add to page
			var oPage = this.getView().byId("page");
			//oPage.removeContent(1);
			//oPage.insertContent(this.oTreeTable, 1);
			oPage.destroyContent(1);
			oPage.setContent(this.oTreeTable, 1);
			if (this.getView().getModel("Scaling").getData().expend) {
				this.oTreeTable.expandToLevel(this.getView().getModel("Scaling").getData().expend);
			}
		},

		createBATableColumns: function (cHdeAry) {

			var that = this;
			var lenDateClmn = this.getVisiableColumn();
			for (var i = 0; i < lenDateClmn; i++) {
				var sColumnLabel = this.util.convertHierarchyColumnHeader(cHdeAry["TextData" + JSON.stringify(i + 1)]);

				if (this.sHierType === "BKH") {
					// BACK ACCOUNT BALANCE
					//var sIdPattern = "idData" + JSON.stringify(i + 2) + "-" + this.guid();
					//var sStrtext = "{parts:[{path:'Data" + JSON.stringify(i+1) + "'}, {path:'currency'}],formatter: '.conversions.formatAmountWithBankAccountCurrencyQJJ'}";
					var sStrtext = "{parts:[{path:'Data" + JSON.stringify(i + 1) + "'}]}";
					var sStrTooltip = sStrtext;

					var oLinkb = new sap.ui.comp.navpopover.SmartLink({
						//emphasized: true,
						text: sStrtext,
						tooltip: sStrTooltip,
						//id: sIdPattern,
						semanticObject: "BankAccount",
						semanticObjectLabel: "{i18n>NAVIGATION}",
						mapFieldToSemanticObject: false,
						beforePopoverOpens: function (oEvent) {
							that.oNav.onBeforePopoverOpens(oEvent, that);
						},
						navigationTargetsObtained: function (oEvent) {
							that.oNav.onTargetObtained(oEvent, that);
						},
						innerNavigate: function (oEvent) {
							that.oNav.onPopoverLinkPressed(oEvent, that);
						}
					});

					var oColumnb = new this.oColumn({
						hAlign: "Right",
						width: "180px",
						//autoResizable: "true",
						template: oLinkb
					});

					var oMultiLabel0 = new sap.m.Label({
						text: sColumnLabel.label,
						textAlign: "Center",
						width: "180px"
					});

					oMultiLabel0.setTooltip(sColumnLabel.sTooltip);

					oColumnb.removeAllMultiLabels();
					oColumnb.insertMultiLabel(oMultiLabel0, 0);
					this.aTableCols.push(oColumnb);
				}
				// DISPLAY CURRENCY BALANCE
				if (this.getDisplayCurrency() === true) {
					//sIdPattern = "idDsplyData" + JSON.stringify(i + 2) + "-" + this.guid();
					//sStrtext = "{parts:[{path:'ConvertData" + JSON.stringify(i+1) + "'}, {path:'displayCurrency'}],formatter: '.conversions.formatAmountWithBankAccountCurrencyS'}";
					sStrtext = "{parts:[{path:'ConvertData" + JSON.stringify(i + 1) + "'}]}";
					sStrTooltip = sStrtext;

					if (this.sHierType === "LQH") {
						oLinkb = new sap.ui.comp.navpopover.SmartLink({
							//emphasized: true,
							text: sStrtext,
							tooltip: sStrTooltip,
							//id: sIdPattern,
							semanticObject: "BankAccount",
							semanticObjectLabel: "{i18n>NAVIGATION}",
							mapFieldToSemanticObject: false,
							beforePopoverOpens: function (oEvent) {
								that.oNav.onBeforePopoverOpens(oEvent, that);
							},
							navigationTargetsObtained: function (oEvent) {
								that.oNav.onTargetObtained(oEvent, that);
							},
							innerNavigate: function (oEvent) {
								that.oNav.onPopoverLinkPressed(oEvent, that);
							}
						});
					} else {
						oLinkb = new sap.m.Label({
							emphasized: false,
							text: sStrtext,
							tooltip: sStrTooltip //,
								//id: sIdPattern
						});
					}

					oColumnb = new this.oColumn({
						hAlign: "Right",
						width: "180px",
						//autoResizable: "true",
						template: oLinkb
					});

					oMultiLabel0 = new sap.m.Label({
						text: sColumnLabel.labelDsply,
						textAlign: "Center",
						width: "180px"
					});

					oMultiLabel0.setTooltip(sColumnLabel.sTooltipDsply);

					oColumnb.removeAllMultiLabels();
					oColumnb.insertMultiLabel(oMultiLabel0, 0);
					this.aTableCols.push(oColumnb);
				}
			}
		},

		getDisplayCurrency: function () {
			var checkResult = false;
			var currentFilters = this.oCurrSmartFilterBar.getFilters()[0];

			//check the amount of filters in the array
			if (currentFilters._bMultiFilter === false) {
				//for single situation, direct reading attribute sPath
				if (currentFilters.sPath === "DisplayCurrency") {
					checkResult = true;
				} else {
					checkResult = false;
				}
			} else {
				//for muti filter situation, ergodic the list and check data
				var filterList = currentFilters.aFilters;
				for (var i = 0; i < filterList.length; i++) {
					if (filterList[i].sPath === "DisplayCurrency") {
						return true;
					}
				}

			}
			return checkResult;

		},

		getVisiableColumn: function () {
			var lenDateClmn = 0;
			var sViewCyclePattern = null;
			if (this.getView().getViewName() === "fin.cash.flow.analyzer.view.BankAccountHierarchy") {
				sViewCyclePattern = this.getView().byId("idCyclePatternForBA").getValue();
			}
			if (this.getView().getViewName() === "fin.cash.flow.analyzer.view.LiquidityItemHierarchy") {
				sViewCyclePattern = this.getView().byId("idCyclePatternForLQ").getValue();
			}

			if (sViewCyclePattern) {
				var aCyclePattern = sViewCyclePattern.split("+");
				for (var j = 0; j < aCyclePattern.length; j++) {
					lenDateClmn = lenDateClmn + (parseInt(aCyclePattern[j].substr(1, 2), 10));
				}
				lenDateClmn = lenDateClmn;
			}
			return lenDateClmn;
		},

		getColumnTextAry: function (oData) {
			var frstLine = oData.results[0];
			var cTARY = [];
			cTARY["TextData1"] = frstLine.TextData1;
			cTARY["TextData2"] = frstLine.TextData2;
			cTARY["TextData3"] = frstLine.TextData3;
			cTARY["TextData4"] = frstLine.TextData4;
			cTARY["TextData5"] = frstLine.TextData5;
			cTARY["TextData6"] = frstLine.TextData6;
			cTARY["TextData7"] = frstLine.TextData7;
			cTARY["TextData8"] = frstLine.TextData8;
			cTARY["TextData9"] = frstLine.TextData9;
			cTARY["TextData10"] = frstLine.TextData10;
			cTARY["TextData11"] = frstLine.TextData11;
			cTARY["TextData12"] = frstLine.TextData12;
			cTARY["TextData13"] = frstLine.TextData13;
			cTARY["TextData14"] = frstLine.TextData14;
			cTARY["TextData15"] = frstLine.TextData15;
			cTARY["TextData16"] = frstLine.TextData16;
			cTARY["TextData17"] = frstLine.TextData17;
			cTARY["TextData18"] = frstLine.TextData18;
			cTARY["TextData19"] = frstLine.TextData19;
			cTARY["TextData20"] = frstLine.TextData20;
			cTARY["TextData21"] = frstLine.TextData21;
			cTARY["TextData22"] = frstLine.TextData22;
			cTARY["TextData23"] = frstLine.TextData23;
			cTARY["TextData24"] = frstLine.TextData24;
			cTARY["TextData25"] = frstLine.TextData25;
			cTARY["TextData26"] = frstLine.TextData26;
			cTARY["TextData27"] = frstLine.TextData27;
			cTARY["TextData28"] = frstLine.TextData28;
			cTARY["TextData29"] = frstLine.TextData29;
			cTARY["TextData30"] = frstLine.TextData30;
			cTARY["TextData31"] = frstLine.TextData31;
			cTARY["TextData32"] = frstLine.TextData32;

			// add mapping for cloumn and label

			var oFieldMapping = [];

			var field = "TextData";
			var num = 1;

			var fieldName = field + num.toString();

			while (frstLine[fieldName] !== "") {

				var aFieldMapping = {
					field: "",
					from: "",
					to: ""
				};

				var sClmnNameAry = frstLine[fieldName].split(";");
				if (sClmnNameAry.length === 4) {
					var dateActualFromStr = sClmnNameAry[2];
					var dateActualToStr = sClmnNameAry[3];
					dateActualFromStr = dateActualFromStr.substr(1, 4) + "-" + dateActualFromStr.substr(5, 2) + "-" + dateActualFromStr.substr(7, 2);
					dateActualToStr = dateActualToStr.substr(1, 4) + "-" + dateActualToStr.substr(5, 2) + "-" + dateActualToStr.substr(7, 2);
					var dateFrom = new Date(dateActualFromStr);
					dateFrom = this.util.convertUTCDateToBrowerDate(dateFrom);
					var dateTo = new Date(dateActualToStr);
					dateTo = this.util.convertUTCDateToBrowerDate(dateTo);

					//add mapping for navigation
					aFieldMapping.field = fieldName;

					if (this.getView().getViewName() === "fin.cash.flow.analyzer.view.BankAccountHierarchy") {
						aFieldMapping.field = aFieldMapping.field.replace("TextData", "Data");
					} else if (this.getView().getViewName() === "fin.cash.flow.analyzer.view.LiquidityItemHierarchy") {
						aFieldMapping.field = aFieldMapping.field.replace("TextData", "ConvertData");
					}

					aFieldMapping.from = dateFrom;
					aFieldMapping.to = dateTo;
					oFieldMapping.push(aFieldMapping);
				}

				num = num + 1;
				fieldName = field + num.toString();

			}

			// add model of mapping for navigation
			var oFieldMappingModel = new JSONModel(oFieldMapping);
			this.getView().setModel(oFieldMappingModel, "FieldMapping");

			return cTARY;
		},

		sortoDataResult: function (aResults) {

			var aSortedResults = [];
			aSortedResults = aResults;

			var fnSortArr = function (obj1, obj2) {
				var aValue1 = obj1.SortOrder.split(".");
				var aValue2 = obj2.SortOrder.split(".");

				var str = null;
				for (var i = 0; i < aValue1.length; i++) {
					if (i === 0) {
						str = parseInt(aValue1[i], 10).toString();
					} else {
						str = str + parseInt(aValue1[i], 10).toString();
					}
				}
				if (obj1.IsData === "X" && obj1.IsTransactionCur === "X") {
					str = str + "0";
				}
				var iNum01 = parseInt(str, 10);
				for (var j = 0; j < aValue2.length; j++) {
					if (j === 0) {
						str = parseInt(aValue2[j], 10).toString();
					} else {
						str = str + parseInt(aValue2[j], 10).toString();
					}
				}
				if (obj2.IsData === "X" && obj2.IsTransactionCur === "X") {
					str = str + "0";
				}
				var iNum02 = parseInt(str, 10);
				return iNum01 - iNum02;
			};

			aSortedResults.sort(fnSortArr);

			return aSortedResults;

		},

		bnkDsplyCrcyConvertoDataToJson: function (oDataOrg) {

			var pScaling = this.getView().getModel("Scaling").getData().scaling;
			var columnLnt = this.getVisiableColumn();
			var currentNodeName = "";
			var oData_tree = {};
			oDataOrg["results"] = this.sortoDataResult(oDataOrg["results"]);
			this.sortData = oDataOrg["results"];
			this.oDataOrg = oDataOrg;
			var closingNode = null;
			var lastestOrder = 0;
			var trnCrcyNumber = {};

			for (var i = 0; i < oDataOrg["results"].length; i++) {

				// To get node name
				if (this.sHierType === "LQH") {
					currentNodeName = oDataOrg["results"][i].LiquidityItemText;
					if (currentNodeName === "") {
						currentNodeName = oDataOrg["results"][i].LiquidityItem;
					}
				} else if (this.sHierType === "BKH") {
					currentNodeName = oDataOrg["results"][i].SText;
				} else if (this.sHierType === "CPS") {
					currentNodeName = oDataOrg["results"][i].BankAccount;
				} else if (this.sHierType === '') {
				}
				if (currentNodeName === "" || currentNodeName === "#NO_ASGN") {
					currentNodeName = this.oResourceBundle.getText("NotAssign");
				}

				// To get node position 
				if (oDataOrg["results"][i].IsData === "X" && oDataOrg["results"][i].IsTransactionCur === "X") {
					var sourceSortOrder = oDataOrg["results"][i].SortOrder;
					if (trnCrcyNumber[sourceSortOrder] === null || trnCrcyNumber[sourceSortOrder] === undefined) {
						trnCrcyNumber[sourceSortOrder] = 0;
					} else {
						trnCrcyNumber[sourceSortOrder] = trnCrcyNumber[sourceSortOrder] + 1;
					}

					oDataOrg["results"][i].SortOrder = oDataOrg["results"][i].SortOrder + "." + trnCrcyNumber[sourceSortOrder].toString();
				}

				var aNodePosStrAry = oDataOrg["results"][i].SortOrder.split(".");

				var aNodePosNumAry = [];
				for (var j = 0; j < aNodePosStrAry.length; j++) {
					aNodePosNumAry.push(parseInt(aNodePosStrAry[j], 10));
				}

				if (aNodePosNumAry[0] > lastestOrder) {
					lastestOrder = aNodePosNumAry[0];
				}

				var sLevel = aNodePosNumAry.length.toString();
				var oNode = null;
				// To handle level node 
				if (this.sHierType === "BKH") {
					oNode = {
						name: oDataOrg["results"][i].HierarchyNodeId,
						icon: this.util.getHierarchyIcon(oDataOrg["results"][i].IsData, this.sHierType),
						currency: oDataOrg["results"][i].BankAccountCurrency,
						displayCurrency: oDataOrg["results"][i].DisplayCurrency,
						sortid: oDataOrg["results"][i].SortOrder,
						description: currentNodeName,
						checked: true,
						level: sLevel,
						BankAccount: oDataOrg["results"][i].BankAccount,
						BankAccountName: oDataOrg["results"][i].BankAccountName,
						//CompanyCode: oDataOrg["results"][i].CompanyCode,
						//CompanyCodeName: oDataOrg["results"][i].CompanyCodeName,
						btn_visible: true,
						newDataNode: false,
						isData: oDataOrg["results"][i].IsData,
						isTransactionCur: oDataOrg["results"][i].IsTransactionCur,
						AccId: oDataOrg["results"][i].AccId
					};
					if (oDataOrg["results"][i].IsData !== "X") {
						oNode.currency = "";
					}
					if (oDataOrg["results"][i].IsData === "X" && oDataOrg["results"][i].IsTransactionCur === "X") {
						oNode.name = oNode.currency;
						oNode.newDataNode = true;
					}
					if (oDataOrg["results"][i].IsData === "X" && oDataOrg["results"][i].IsTransactionCur !== "X") {
						oNode.currency = "";
					}
				}

				if (this.sHierType === "LQH") {
					oNode = {
						name: currentNodeName,
						icon: this.util.getHierarchyIcon(oDataOrg["results"][i].IsData, this.sHierType),
						//currency: oDataOrg["results"][i].BankAccountCurrency,
						displayCurrency: oDataOrg["results"][i].DisplayCurrency,
						sortid: oDataOrg["results"][i].SortOrder,
						description: currentNodeName,
						checked: true,
						level: sLevel,
						//BankAccount: oDataOrg["results"][i].BankAccount,
						LiquidityItem: oDataOrg["results"][i].LiquidityItem,
						IsData: oDataOrg["results"][i].IsData,
						btn_visible: true
					};
				}
				
				if (this.sHierType === "CPS") {
					oNode = {
						name: currentNodeName,
						icon: this.util.getHierarchyIcon(oDataOrg["results"][i].IsData, this.sHierType),
						sortid: oDataOrg["results"][i].SortOrder,
						description: oDataOrg["results"][i].BankAccountDesc,
						cashPool: oDataOrg["results"][i].CashPoolDesc,
						bankaccountCurrency: oDataOrg["results"][i].Currency,
						displayCurrency: oDataOrg["results"][i].DisplayCurrency,
						checked: true,
						level: sLevel,
						beforeBalance: this.conversions.formatAmountWithBankAccountCurrency(oDataOrg["results"][i].BeforeBalance, 
																							oDataOrg["results"][i].Currency,
																							pScaling),
						beforeBalanceDsp: this.conversions.formatAmountWithBankAccountCurrency(oDataOrg["results"][i].BeforeBalanceDsp, 
																							oDataOrg["results"][i].DisplayCurrency,
																							pScaling),
						transferAmount: this.conversions.formatAmountWithBankAccountCurrency(oDataOrg["results"][i].TransferAmount, 
																							oDataOrg["results"][i].Currency,
																							pScaling),
						transferAmountDsp: this.conversions.formatAmountWithBankAccountCurrency(oDataOrg["results"][i].TransferAmountDsp, 
																							oDataOrg["results"][i].DisplayCurrency,
																							pScaling),
						maxTargetAmount: this.conversions.formatAmountWithBankAccountCurrency(oDataOrg["results"][i].MaxTargetAmount, 
																							oDataOrg["results"][i].Currency,
																							pScaling),
						minTransferAmount: this.conversions.formatAmountWithBankAccountCurrency(oDataOrg["results"][i].MinTransferAmount, 
																							oDataOrg["results"][i].Currency,
																							pScaling),
						afterBalance: this.conversions.formatAmountWithBankAccountCurrency(oDataOrg["results"][i].AfterBalance, 
																							oDataOrg["results"][i].Currency,
																							pScaling),
						afterBalanceDsp: this.conversions.formatAmountWithBankAccountCurrency(oDataOrg["results"][i].AfterBalanceDsp, 
																							oDataOrg["results"][i].DisplayCurrency,
																							pScaling),
						IsData: oDataOrg["results"][i].IsData,
						btn_visible: false,
						AccId: oDataOrg["results"][i].BankAccountId
					};
				}

				for (j = 0; j < columnLnt; j++) {
					var sPattern = 'Data' + JSON.stringify(j + 1);
					var sPatternDsply = 'ConvertData' + JSON.stringify(j + 1);
					oNode[sPattern] = this.conversions.formatAmountWithBankAccountCurrency(oDataOrg["results"][i][sPattern], oNode.currency,
						pScaling);
					oNode[sPatternDsply] = this.conversions.formatAmountWithBankAccountCurrencyS(oDataOrg["results"][i][sPatternDsply], oDataOrg[
						"results"][i]["DisplayCurrency"], pScaling);
				}

				// To Map Hierarchy
				if (this.sHierType === 'LQH' && this.FromMainView === false) {
					if (aNodePosNumAry.length === 1 && aNodePosNumAry[0] === 0) {
						if (oDataOrg["results"][i].ViewTypeExt === "1BEG_BAL") {
							oNode.name = this.oResourceBundle.getText("BEGINNINGBAL");
							oData_tree[aNodePosNumAry[0]] = oNode;
						}
						if ((oDataOrg["results"][i].ViewTypeExt === "3END_BAL")) {
							oNode.name = this.oResourceBundle.getText("ENDINGBAL");
							closingNode = oNode;
						}
						continue;
					}
				}

				if ((this.sHierType === 'LQH' || this.sHierType === 'BKH' || this.sHierType === 'CPS')) {
					switch (aNodePosNumAry.length) {
					case 1:
						if (this.sHierType === 'LQH' && this.FromMainView === true && aNodePosNumAry[0] === 0) {
							continue;
						}
						oData_tree[aNodePosNumAry[0]] = oNode;
						break;
					case 2:
						oData_tree[aNodePosNumAry[0]][aNodePosNumAry[1]] = oNode;
						break;
					case 3:
						oData_tree[aNodePosNumAry[0]][aNodePosNumAry[1]][aNodePosNumAry[2]] = oNode;
						break;
					case 4:
						oData_tree[aNodePosNumAry[0]][aNodePosNumAry[1]][aNodePosNumAry[2]][aNodePosNumAry[3]] = oNode;
						break;
					case 5:
						oData_tree[aNodePosNumAry[0]][aNodePosNumAry[1]][aNodePosNumAry[2]][aNodePosNumAry[3]][aNodePosNumAry[4]] = oNode;
						break;
					case 6:
						oData_tree[aNodePosNumAry[0]][aNodePosNumAry[1]][aNodePosNumAry[2]][aNodePosNumAry[3]][aNodePosNumAry[4]][aNodePosNumAry[5]] =
							oNode;
						break;
					case 7:
						oData_tree[aNodePosNumAry[0]][aNodePosNumAry[1]][aNodePosNumAry[2]][aNodePosNumAry[3]][aNodePosNumAry[4]][aNodePosNumAry[5]]
							[aNodePosNumAry[6]] = oNode;
						break;
					case 8:
						oData_tree[aNodePosNumAry[0]][aNodePosNumAry[1]][aNodePosNumAry[2]][aNodePosNumAry[3]][aNodePosNumAry[4]][aNodePosNumAry[5]]
							[aNodePosNumAry[6]][aNodePosNumAry[7]] = oNode;
						break;
					case 9:
						oData_tree[aNodePosNumAry[0]][aNodePosNumAry[1]][aNodePosNumAry[2]][aNodePosNumAry[3]][aNodePosNumAry[4]][aNodePosNumAry[5]]
							[aNodePosNumAry[6]][aNodePosNumAry[7]][aNodePosNumAry[8]] = oNode;
						break;
					case 10:
						oData_tree[aNodePosNumAry[0]][aNodePosNumAry[1]][aNodePosNumAry[2]][aNodePosNumAry[3]][aNodePosNumAry[4]][aNodePosNumAry[5]]
							[aNodePosNumAry[6]][aNodePosNumAry[7]][aNodePosNumAry[8]][aNodePosNumAry[9]] =
							oNode;
						break;
					default:
					}
				}
			}
			if (closingNode) {
				oData_tree[lastestOrder + 1] = closingNode;
			}

			if (this.sHierType === "BKH") {
				this.oDataToJsonTreeResultBA["root"] = oData_tree;
			}
			if (this.sHierType === "LQH") {
				this.oDataToJsonTreeResultLQ["root"] = oData_tree;
			}
			if (this.sHierType === "CPS") {
				this.oDataToJsonTreeResultCP["root"] = oData_tree;
			}
		},

		valueOf: function (object, path) {
			var ptr = object;
			for (var i = 0, l = path.length; i < l; i++) {
				ptr = ptr[path[i]];
			}
			return ptr;
		},
		// end of column construction and data construction =================================================================================================

		// begin of search function ================================================================================================================================
		onSearchButtonPressed: function () {

			this.oMyView.setBusy(true);
					
			if (this.sHierType === 'CPS') {
				var currentDate = this.oCurrSmartFilterBar.getFilterData(true).ValueDate;
				if (currentDate) {
					//this.sendRequest();
					this.getPersonalSettings();
				}
			} else {
				currentDate = this.oCurrSmartFilterBar.getFilterData(true).KeyDate;
				var sCyclePattern = null;
	
				if (this.sHierType === 'BKH') {
					sCyclePattern = this.getView().byId("idCyclePatternForBA").getValue();
				}
				if (this.sHierType === 'LQH') {
					sCyclePattern = this.getView().byId("idCyclePatternForLQ").getValue();
	
					//if liquidity item hierarchy view with bank balance, remove sort order
					if (this.aDrilldownfilter) {
						var oSelectVariantsDrillDown = new sap.ui.generic.app.navigation.service.SelectionVariant(this.aDrilldownfilter);
						var oSelectVariantsFilter = new sap.ui.generic.app.navigation.service.SelectionVariant(this.oCurrSmartFilterBar.getDataSuiteFormat());
						if (oSelectVariantsDrillDown.getParameter("BankAccountGroup")) {
							if (oSelectVariantsDrillDown.getParameter("BankAccountGroup") !== oSelectVariantsFilter.getParameter("BankAccountGroup")) {
								oSelectVariantsFilter.removeSelectOption("SortOrder");
								oSelectVariantsFilter.addSelectOption("SortOrder", "I", "EQ", "000%", null);
								this.oCurrSmartFilterBar.setDataSuiteFormat(oSelectVariantsFilter.toJSONString(), true);
							}
						}
					}
	
				}
				if (sCyclePattern && currentDate) {
					//this.sendRequest();
					this.getPersonalSettings();
				}
	
				// if value on display currency, show exchange range type on filter
				var displayCurrency = this.oCurrSmartFilterBar.getFilterData(true).DisplayCurrency;
				if (displayCurrency && !this.byId("exRateTypeFilter").getVisibleInAdvancedArea()) {
					this.byId("exRateTypeFilter").setVisibleInAdvancedArea(true);
				}
			}
		},
		// begin of search function ================================================================================================================================
		onNavBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
				history.go(-1);
			} else {
				this.getRouter().navTo("worklist", {}, true);
			}
		},

		onExit: function () {},

		// end of jam share and navigation back , status save===============================================================================================

		// begin of validation==================================================================
		validateCyclePattern: function (oEvent) {

			var cyclePatternInput = null;
			if (this.sHierType === 'BKH') {
				cyclePatternInput = this.getView().byId("idCyclePatternForBA");
			}
			if (this.sHierType === 'LQH') {
				cyclePatternInput = this.getView().byId("idCyclePatternForLQ");
			}
			var sCyclePattern = cyclePatternInput.getValue().toUpperCase();
			cyclePatternInput.setValue(sCyclePattern);

			var iLen = 0;
			var regx = new RegExp("^([D,W,M,Q,Y]([1-9]|([1-2][0-9])|(3[0-1])))$");
			cyclePatternInput.setValueState("None");

			if (sCyclePattern) {
				var aCyclePattern = sCyclePattern.split("+");
				for (var i = 0; i < aCyclePattern.length; i++) {
					if (regx.test(aCyclePattern[i]) === false) {
						cyclePatternInput.setValueState("Error");
						return;
					}
					iLen = iLen + (parseInt(aCyclePattern[i].substr(1, 2), 10));
				}
			}
			if (iLen > 31) {
				cyclePatternInput.setValueState("Error");
			}
		},
		// end of validation ====================================================================

		// navigation to liquidity item view	

		onInterNavigationPressed: function (oEvent) {
			if (!this._DrillDownPopover) {
				this._DrillDownPopover = sap.ui.xmlfragment(this.getView().getId(), "fin.cash.flow.analyzer.view.fragment.NaviPopOverForBL", this);
				this.getView().addDependent(this._DrillDownPopover);
			}

			this._DrillDownPopover.open();

			if (oEvent.getSource().getBindingContext()) {
				this.oSelectedPath = oEvent.getSource().getBindingContext().getPath();

				if (!this.existDisplayCurrency()) {
					this.getView().byId("fin.cash.fa.bl-displaycurrency").setEnabled(true);
				} else {
					this.getView().byId("fin.cash.fa.bl-displaycurrency").setEnabled(false);
					this.getView().byId("fin.cash.fa.bl-displaycurrency").setValue(this.existDisplayCurrency());
				}
			}
		},

		existDisplayCurrency: function () {

			var aFiltersData = this.oCurrSmartFilterBar.getFilters()[0];

			if (aFiltersData._bMultiFilter === false) {
				if (aFiltersData.sPath === "DisplayCurrency") {
					return aFiltersData.oValue1;
				}
			} else {
				var filterList = aFiltersData.aFilters;
				for (var i = 0; i < filterList.length; i++) {
					if (filterList[i].sPath === "DisplayCurrency") {
						return filterList[i].oValue1;
					}
				}
			}

			if (!this.getView().getModel("Scaling").getData().displayCurrency) {
				return false;
			} else {
				return this.getView().getModel("Scaling").getData().displayCurrency;
			}

		},

		_cancelSubmit: function (event) {
			if (this._DrillDownPopover) {
				this._DrillDownPopover.close();
			}
		},

		handleIntrNavigation: function (oEvt) {

			var oSelectVariants = new SelectionVariant(this.oCurrSmartFilterBar.getDataSuiteFormat());
			var oNavParameters = {};

			var sLQHiername = this.getView().byId("fin.cash.fa.bl-id").getValue();
			var sLQHDSPCRCY = this.getView().byId("fin.cash.fa.bl-displaycurrency").getValue();

			if (!sLQHiername) {
				sap.m.MessageBox.show(this.oResourceBundle.getText("NVGERROR"), {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: this.oResourceBundle.getText("NVGERRORTITLE"),
					actions: [sap.m.MessageBox.Action.OK]
				});
				return;
			} else {

				var oSortID = this.oTreeTable.getModel().getProperty(this.oSelectedPath).sortid;
				var newDataNode = this.oTreeTable.getModel().getProperty(this.oSelectedPath).newDataNode;
				if (oSortID) {
					if (newDataNode === true) {
						var lastDot = oSortID.lastIndexOf(".");
						oSortID = oSortID.substring(0, lastDot);
					}
					oSelectVariants.addSelectOption("SortOrder", "I", "EQ", oSortID, null);
				}
				oSelectVariants.addSelectOption("LiquidityHierarchyName", "I", "EQ", sLQHiername, null);
				// In Hierarchy view, only flow item show, so Viewtype is set to be 2 by hardcode 
				oSelectVariants.addParameter("ViewType", "2");
				oSelectVariants.addParameter("CyclePattern", this.getView().byId("idCyclePatternForBA").getValue());
				oSelectVariants.addParameter("HistoricalTimeStamp", this.getView().byId("idHistoricalTimeStampForBA").getDateValue().toJSON());
				if (!sLQHDSPCRCY) {
					sap.m.MessageBox.show(this.oResourceBundle.getText("NVGERROR"), {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: this.oResourceBundle.getText("NVGERRORTITLE"),
						actions: [sap.m.MessageBox.Action.OK]
					});
					return;
				} else {
					oSelectVariants.addParameter("DisplayCurrency", sLQHDSPCRCY);
				}

				oNavParameters = {
					oDrilldownfilter: oSelectVariants.toJSONString()
				};
				this.getRouter().navTo("LiquidityItemHierarchy", {
					Params: JSON.stringify(oNavParameters).toBase64URI()
				});
			}
			return;

		},

		handleLQValueHelp: function (oEvt) {
			if (!this._LQSDialog) {
				this._LQSDialog = sap.ui.xmlfragment(this.getView().getId(), "fin.cash.flow.analyzer.view.fragment.LQDialog", this);
				this._LQSDialog.setModel(this.oDataModel);
				var oTextModel = this.getView().getModel("i18n");
				this._LQSDialog.setModel(oTextModel, "i18n");
			}
			this._LQSDialog.setMultiSelect(false);
			this._LQSDialog.setRememberSelections(true);
			// clear the old search filter
			this._LQSDialog.getBinding("items").filter([]);
			// toggle compact style
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._LQSDialog);
			this._LQSDialog.open();
		},

		handleDsplyCrcyValueHelp: function (oEvt) {
			if (!this._HDsplyCrcyDialog) {
				this._HDsplyCrcyDialog = sap.ui.xmlfragment(this.getView().getId(), "fin.cash.flow.analyzer.view.fragment.HDsplyCrcyDialog", this);
				this._HDsplyCrcyDialog.setModel(this.oDataModel);
				var oTextModel = this.getView().getModel("i18n");
				this._HDsplyCrcyDialog.setModel(oTextModel, "i18n");
			}
			this._HDsplyCrcyDialog.setMultiSelect(false);
			this._HDsplyCrcyDialog.setRememberSelections(true);
			// clear the old search filter
			this._HDsplyCrcyDialog.getBinding("items").filter([]);
			// toggle compact style
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._HDsplyCrcyDialog);
			this._HDsplyCrcyDialog.open();
		},
		onHandleSearchForLQH: function (oEvt) {

			var aFilters = [];
			var sValue = oEvt.getParameter("value");
			var oFilter = new sap.ui.model.Filter("HierarchyName", sap.ui.model.FilterOperator.Contains, sValue);
			aFilters.push(oFilter);
			var oBinding = oEvt.getSource().getBinding("items");
			oBinding.filter(aFilters);

		},

		onHandleSearchForBAH: function (oEvt) {

			var aFilters = [];
			var sValue = oEvt.getParameter("value");
			var oFilter = new sap.ui.model.Filter("HierarchyName", sap.ui.model.FilterOperator.Contains, sValue);
			aFilters.push(oFilter);
			var oBinding = oEvt.getSource().getBinding("items");
			oBinding.filter(aFilters);

		},

		onHandleCloseForLQH: function (oEvt) {

			var aContexts = oEvt.getParameter("selectedContexts");
			var sLQHiername = null;
			if (aContexts.length) {
				sLQHiername = aContexts.map(function (oContext) {
					return oContext.getObject().HierarchyName;
				}).join(", ");
			}
			oEvt.getSource().getBinding("items").filter([]);

			if (sLQHiername !== null) {
				this.getView().byId("fin.cash.fa.bl-id").setValue(sLQHiername);
			}
		},

		onHandleCloseForHDC: function (oEvt) {

			var aContexts = oEvt.getParameter("selectedContexts");
			var sLQHDSPCRCY = null;

			if (aContexts.length) {
				sLQHDSPCRCY = aContexts.map(function (oContext) {
					return oContext.getObject().WAERS;
				}).join(", ");
			}
			oEvt.getSource().getBinding("items").filter([]);

			if (sLQHDSPCRCY !== null) {
				this.getView().byId("fin.cash.fa.bl-displaycurrency").setValue(sLQHDSPCRCY);
			}

		},

		onHandleSearchForHDC: function (oEvt) {

			var aFilters = [];
			var sValue = oEvt.getParameter("value");
			var oFilter = new sap.ui.model.Filter("WAERS", sap.ui.model.FilterOperator.Contains, sValue);
			aFilters.push(oFilter);
			var oBinding = oEvt.getSource().getBinding("items");
			oBinding.filter(aFilters);

		},

		ExportExcel: function () {
			var sPath = this.oDataPath;
			var oModel = this.oDataModel;
			if (oModel) {
				this.oMyView.setBusy(true);
				var aFilters = this.oCurrSmartFilterBar.getFilters();
				
				var oFilter = new sap.ui.model.Filter("Export", "EQ", "xlsx" + "::" + 'X');
				aFilters.push(oFilter);
				
				if (this.sHierType !== "CPS") {
					this.setRequestFilters(aFilters);
				}

				oModel.read(sPath, {
					filters: aFilters, //this.oCurrSmartFilterBar.getFilters(),		
					success: $.proxy(this.handleExportExcelReady, this),
					error: $.proxy(this.handleMyTableDataFailed, this)
				});
			}
		},

		handleExportExcelReady: function (oData) {
			this.oMyView.setBusy(false);
			var pdfText = oData["results"][0].Content;
			var excelFormat = new Uint8Array(this.decodeFromBase64(pdfText).split("").map(function (c) {
				return c.charCodeAt(0);
			}));
			var blob = new Blob([excelFormat], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
			});
			sap.ui.core.util.File.save(blob, "download", "xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "utf-8");

		},

		decodeFromBase64: function (input) {
			input = input.replace(/\s/g, '');
			return atob(input);
		},
		
		onHandleAfterVariantLoad: function (oEvent) {
			var oData = this.oCurrSmartFilterBar.getFilterData();
			var oCustomFieldData = oData["_CUSTOM"];
			this.oCurrSmartFilterBar.getControlByKey("CyclePattern").setValue(oCustomFieldData.CyclePattern);						
			if (oCustomFieldData.HistoricalTimeStamp) {
				this.oCurrSmartFilterBar.getControlByKey("HistoricalTimeStamp").setDateValue(new Date(Date.parse(oCustomFieldData.HistoricalTimeStamp)));					
			} else {	
				this.oCurrSmartFilterBar.getControlByKey("HistoricalTimeStamp").setDateValue(this.util.getHistoryDateTimeDefault());					
			}
		},
		
		onHandleBeforeVariantSave: function (oEvent) {
			var oCyclePattern = null;
			var oHistoricalTimeStamp = null;
			switch (this.sHierType) {
				case 'BKH':
					oCyclePattern = this.getView().byId("idCyclePatternForBA").getValue();				
					oHistoricalTimeStamp = this.getView().byId("idHistoricalTimeStampForBA").getDateValue();				
					break;
				case 'LQH':
					oCyclePattern = this.getView().byId("idCyclePatternForLQ").getValue();				
					oHistoricalTimeStamp = this.getView().byId("idHistoricalTimeStampForLQ").getDateValue();				
					break;
			}
			if (oCyclePattern !== "") {
				this.oCurrSmartFilterBar.setFilterData({
					_CUSTOM: {
						CyclePattern: oCyclePattern,
						HistoricalTimeStamp: oHistoricalTimeStamp
					}
				});
			}
		},
		
		onShareButtonPressed: function (oEvent) {
			if (!this.oShareActionSheet) {
				this.oShareActionSheet = sap.ui.xmlfragment(this.getView().getId(), "fin.cash.flow.analyzer.view.fragment.shareActionSheet", this);
				this.getView().addDependent(this.oShareActionSheet);
			}
			var oShareModel = new JSONModel();
			this.setModel(oShareModel, "share");
			this.oShareActionSheet.setModel(oShareModel, "share");
			oShareModel.setProperty("/bookmarkTitle", this.oResourceBundle.getText("appDescription"));
			oShareModel.setProperty("/bookmarkButtonText", this.oResourceBundle.getText("SEMANTIC_CONTROL_SAVE_AS_TILE"));
			var fnGetUser = jQuery.sap.getObject("sap.ushell.Container.getUser");
			oShareModel.setProperty("/jamVisible", !!fnGetUser && fnGetUser().isJamActive());
			oShareModel.setProperty("/bookmarkCustomUrl", this.generateCustomUrl());
			this.oShareActionSheet.openBy(oEvent.getSource());
		},
		
		onAssignedFiltersChanged: function (oEvent) {
			switch( this.sHierType ) {
				case "BKH":
					this.byId("BkhFilterText").setText(this.byId("smartFilterBarItemForBA").retrieveFiltersWithValuesAsText());
					break;
				case "LQH":
					this.byId("LqhFilterText").setText(this.byId("smartFilterBarItemForLQ").retrieveFiltersWithValuesAsText());
					break;
				case "CPS":
					this.byId("CpsFilterText").setText(this.byId("smartFilterBarItemForCPSim").retrieveFiltersWithValuesAsText());
					break;
			}
		},
		
		onToggleHeaderPressed: function (oEvent) {
			var oPageModel = this.getView().getModel("page");
			oPageModel.setProperty("/headerExpanded", (oPageModel.getProperty("/headerExpanded") === true) ? false : true);
		},

		formatToggleButtonText: function (bValue) {
			return bValue ? this.getResourceBundle().getText("HIDE_FILTERS") : this.getResourceBundle().getText("SHOW_FILTERS");
		}

	});
});
