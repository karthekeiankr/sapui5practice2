/*
 * Copyright (C) 2009-2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"fin/cash/flow/analyzer/controller/BaseController",
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
		"fin/cash/flow/analyzer/helper/AppSettingsHelper",
		"sap/m/Button",
		"sap/m/MessageBox",
		"fin/cash/flow/analyzer/util/Formatter",
		"fin/cash/flow/analyzer/controller/CycleController",
		"fin/cash/flow/analyzer/controller/ExternalNavigationController",
		"fin/cash/flow/analyzer/util/ErrorHandler"
	],

	function (BaseController,
		JSONModel,
		formatter,
		Filter,
		FilterOperator,
		History,
		SelectionVariant,
		NavigationHandler,
		Conversions,
		StringUtil,
		DateUtils,
		AppSettingsHelper,
		Button,
		MessageBox,
		CFormatter,
		CycleController,
		ExtrNavigation,
		ErrorHandler) {
		"use strict";

		return BaseController.extend("fin.cash.flow.analyzer.controller.MainController", {

			conversions: Conversions,
			util: null,
			cController: CycleController,
			oCurrSmartFilterBar: null,
			oPersonalization: null,
			bIsInitizedCall: false,
			bIsInitial: false,
			oCurrTable: null,
			oCurrSmartTable: null,
			formatter: formatter,
			oNavigationHandler: null,
			odrilldowncol: null,
			aDrilldownfilter: [],
			oCycleData: null,
			sTableTitle: null,
			cashgroupCol: null,
			oSelectVariants: null,
			//viewType: 1, 
			rbIsBankCurrency: "",
			_DrillDownPopOver: null,
			_LQSDialog: null,
			_BASDialog: null,
			_CPSDialog: null,
			_CASDialog: null,
			sLQHierarchyName: null,
			sBAHierarchyName: null,
			oTileType: null,
			// oBasicCashFlag: false,

			//JS Contoller Hooks
			extHookAssignExtTableColumnsForMainView: null,

			onInit: function () {

				this.oNav = ExtrNavigation;
				this.oNavigationHandler = new NavigationHandler(this);
				this.util = Conversions;
				this.cycleController = CycleController;
				this.oCurrentDate = new Date();
				//this.oCurrentDate = this.util.convertUTCDateToBrowerDate(this.oCurrentDate);

				// get and set oData Model and i18n Model
				this.oWnerComponent = this.getOwnerComponent();
				this.oi18nModel = this.oWnerComponent.getModel("i18n");
				this.oResourceBundle = this.oi18nModel.getResourceBundle();
				this.oDataModel = this.oWnerComponent.getModel();
				this.oDataModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
				this.setModel(this.oDataModel);

				this.oView = this.getView();
				this.oView.setModel(this.oDataModel);
				this.oCurrTable = this.byId('idFlowItemTable');
				this.oCurrSmartFilterBar = this.byId('idsmartFilterBarItem');
				this.oCurrSmartTable = this.byId('idFlowItemSmartTable');
				this.oAnalyticalTable = this.byId('idFlowItemTable');
				this.oAnalyticalTable.bindRows({ 
					path: "FCLM_CASH_FLOW_ANALYZER_SRV/FCLM_CFBA_CURRENCY_VIEWSet",
											parameters : {
							select: "DisplayCurrency,Data1",
	                    	autoExpandMode : "Sequential", 
	                    	sumOnTop : true,
//	                    	numberOfExpandedLevels : 0, 
//	                    	useBatchRequests : false,
							provideGrandTotals : true,
							provideTotalResultSize : true,
							reloadSingleUnitMeasures : false
						}
});
				if (sap.ui.Device.system.desktop) {
					this.oCurrSmartFilterBar.addStyleClass("sapUiSizeCompact");
					this.oAnalyticalTable.addStyleClass("sapUiSizeCondensed");
				}
				this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
				this.aGroupedCol_cashgroup = [];
				this.CashgroupTermGrouped = false;

				this.oTileType = "";
				this.bIsSaveAsTile = false;

				this.oErrorHandler = ErrorHandler;
				this.oErrorHandler.initODateErrorHandler(this.oWnerComponent);
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
						customUrl: oCutsomUrl
					});
				});*/

				//Begin user settings
				var oButton = new sap.m.Button({
					sId: "buttonSetting",
					mSettings: {

						text: this.oResourceBundle.getText("SETTINGS"),
						textDirection: this.oResourceBundle.getText("SETTINGS")

					}
				});

				var sText = this.oResourceBundle.getText("SETTINGS");

				oButton.attachPress($.proxy(this.onAppSettingsPressed, this));
				oButton._sTooltip = sText;
				oButton.setTooltip(oButton._sTooltip);
				oButton._sTextInActionSheet = sText;
				oButton._sTextInBar = sText;
				oButton.setText(sText);
				oButton._sTypeInActionSheet = sap.m.ButtonType.Default;

				var aButtons = [];
				aButtons.push(oButton);
				sap.ushell.services.AppConfiguration.addApplicationSettingsButtons(aButtons);

				// App Settings
				this.oPersonalization = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("Personalization");
				// Personalization service
				if (this.oPersonalization) {
					var oPersId = {
						container: "fin.cash.flow.analyzer" +
							((sap.ushell && sap.ushell.Container && sap.ushell.Container.getUser().getId()) || {}),
						item: "favorites"
					};
					this.oPersonalizer = this.oPersonalization.getPersonalizer(oPersId);
				}

				this.oAppSettingsHelper = new AppSettingsHelper(
					this.getModel(),
					this.getView(),
					this,
					this.oPersonalizer
				);

				//this.oCurrSmartTable.rebindTable(false); 
				//this.getUserSetting();
				//End user settings

				var oPageModel = new sap.ui.model.json.JSONModel({
					headerExpanded: true
				});
				this.getView().setModel(oPageModel, "page");
				
				//************extension part********************************
				var oExtTableColumns = null;
				var oDataRow = null;

				if (this.extHookAssignExtTableColumnsForMainView) {
					this.extHookAssignExtTableColumnsForMainView(oExtTableColumns, oDataRow);
				}

				if (this.extHookonDataReceived) { // check whether any extension has implemented the hook...
					this.extHookonDataReceived(this.model); // ...and call it
				}

				if (this.extHookOnInit) {
					this.extHookOnInit();
				}

			},

			onAfterRendering: function() {
				var that = this;
				var sTitle;
	            that.oWnerComponent.getService("ShellUIService").then(
	            	function (oShellUIService) {
	            		if (oShellUIService) {
							sTitle = that.oResourceBundle.getText("MainViewNavigationTitle");
	            			oShellUIService.setTitle(sTitle);
	            		}
	            	},
	            	function (sError) {
	            		// error handling
	            	}
	            );
	        },

			generateCustomUrl: function () {

				this.storeCurrentAppState();
				return document.URL;

			},

			getUserSetting: function () {
				var that = this;
				that.oAppSettingsHelper.asyncGetSettings(function (oSettings) {

					var scaling = (oSettings.Scaling) ? (oSettings.Scaling) : 0;

					/*if (oSettings.DB_IsBankCurrency === 0) {
						this.rbIsBankCurrency = oSettings.DB_IsBankCurrency.toString();
					} else {
						this.rbIsBankCurrency = "1";
					}

					var isBankCurrency = (oSettings.DB_IsBankCurrency !== undefined && oSettings.DB_IsBankCurrency !== null) ? (oSettings.DB_IsBankCurrency) :
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
						oSettings.PreviousFlag) : "0";

					var expend = (oSettings.SettingExpendLevel) ? (oSettings.SettingExpendLevel) : 3;

					var displayCurrency = (oSettings.SettingDisplayCurrency) ? (oSettings.SettingDisplayCurrency) : "";

					var viewType = (oSettings.DefaultView) ? (oSettings.DefaultView) : 0;

					var oScalingModel = new JSONModel({
						scaling: scaling,
						expend: expend,
						displayCurrency: displayCurrency,
						isBankCurrency: isBankCurrency,
						factoryCalendarId: factoryCalendarId,
						previousFlag: previousFlag,
						viewType: viewType

					});
					this.getView().setModel(oScalingModel, "Scaling");
					this.oCurrSmartTable.rebindTable(true);

				}, function () {
					var oScalingModel = new JSONModel({
						scaling: 0,
						expend: 3,
						viewType: 0
					});
					this.getView().setModel(oScalingModel, "Scaling");
					this.oCurrSmartTable.rebindTable(true);
				}, this);
			},
			onAppSettingsPressed: function () {
				var oSettingsDialog = this.oAppSettingsHelper.getSettingsDialog();
				if (oSettingsDialog) {
					oSettingsDialog.open();
					var oTextModel = this.getView().getModel("i18n");
					oSettingsDialog.setModel(oTextModel, "i18n");
				}
			},

			onInitSmartFilterBar: function () {

				this.initAppState(true, null);

			},

			onExpandForMainView: function (oEvent) {
				var sGroupNumber = this.oCurrTable._aGroupedColumns.length;
				this.oCurrTable.setNumberOfExpandedLevels(sGroupNumber);
				this.oCurrSmartTable.rebindTable(true);
			},

			onCollapseForBankAccountView: function () {
				this.oCurrTable.setNumberOfExpandedLevels(0);
				this.oCurrTable.collapseAll();
			},

			initAppState: function (bIsInitial, defaultView) {

				var oParseNavigationPromise = this.oNavigationHandler.parseNavigation();
				var that = this;
				var oSelectionVariants = null;
				oParseNavigationPromise.done(function (oAppData, oURLParameters, sNavType) {
					oSelectionVariants = new sap.ui.generic.app.navigation.service.SelectionVariant(oAppData.selectionVariant);
					var valueDate = oSelectionVariants.getValue("KeyDate");
					var cyclePatton = oSelectionVariants.getValue("CyclePattern");
					var historicalTimeStamp = oSelectionVariants.getValue("HistoricalTimeStamp");
					var releaseFlag = oSelectionVariants.getValue("ReleaseFlag");
					var dateIndicator = oSelectionVariants.getValue("DateIndicator");
					// that.oCurrSmartTable.setCurrentVariantId(that.oCurrSmartFilterBar.getVariantManagement().getDefaultVariantKey());
					switch (sNavType) {
					case sap.ui.generic.app.navigation.service.NavType.initial:
						{
							that.handleCrossNav(oAppData, oURLParameters);
							break;
						}
						// Navigation inner Back
					case sap.ui.generic.app.navigation.service.NavType.iAppState:
						{

							if (that.util.isNull(valueDate)) {
								oSelectionVariants.addSelectOption("KeyDate", "I", "EQ", that.util.getValueDateDefault());
							}
							if (that.util.isNull(cyclePatton)) {
								oSelectionVariants.addSelectOption("CyclePattern", "I", "EQ", "D7");
							}
							that.oCurrSmartFilterBar.getControlByKey("CyclePattern").setValue(oSelectionVariants.getValue("CyclePattern")[0].Low);

							if (that.util.isNull(historicalTimeStamp)) {
								oSelectionVariants.addSelectOption("HistoricalTimeStamp", "I", "EQ", that.util.getHistoryDateTimeDefault().toJSON());
							}

							var historicalTimeStampLow = historicalTimeStamp[0].Low;
							if (that.getView() && that.getView().byId('idHistoricalTimeStamp') && historicalTimeStampLow !== '') {
								that.getView().byId('idHistoricalTimeStamp').setDateValue(new Date(Date.parse(historicalTimeStampLow)));
							}

							if (that.util.isNull(releaseFlag)) {
								oSelectionVariants.addSelectOption("ReleaseFlag", "I", "EQ", "0");
							}
							
							if (that.util.isNull(dateIndicator)) {
								oSelectionVariants.addSelectOption("DateIndicator", "I", "EQ", "1");
							}
							
							oAppData.selectionVariant = oSelectionVariants.toJSONString();
							that.getView().byId('idsmartFilterBarItem').setDataSuiteFormat(oAppData.selectionVariant);
							that.getView().byId('idFlowItemSmartTable').rebindTable(true);
							// that.handleInnnerNav();
							break;
						}
					case sap.ui.generic.app.navigation.service.NavType.xAppState:
						{
							that.handleCrossNav(oAppData, oURLParameters);
							break;
						}
					case sap.ui.generic.app.navigation.service.NavType.URLParams:
						{
							that.handleCrossNav(oAppData, oURLParameters);
							break;
						}

					}
				});

				oParseNavigationPromise.fail(function (oError) {

					oError.setUIText({
						oi18n: that.oResourceBundle,
						sTextKey: "INBOUND_NAV_ERROR"
					});
					oError.showMessageBox();
				});

				if (this.getView().getViewName() === "fin.cash.flow.analyzer.view.Worklist_D" && !this.bIsSaveAsTile) {
					var oSelectionVars = new sap.ui.generic.app.navigation.service.SelectionVariant(this.aDrilldownfilter);
					// var oSelectionVars = JSON.parse(this.aDrilldownfilter);
					var oDrillDownPropName = oSelectionVars.getPropertyNames();

					for (var j = 0; j < oDrillDownPropName.length; j++) {
						if (oDrillDownPropName[j].endsWith('Text')) {
							var sNewPropName = oDrillDownPropName[j].replace(new RegExp('Text$'), '');
							if (oSelectionVars.getParameter(oDrillDownPropName[j])) {
								var aParamValue = oSelectionVars.getParameter(oDrillDownPropName[j]).split("::");
								oSelectionVars.addParameter(sNewPropName, aParamValue[0]);
								oSelectionVars.removeParameter(oDrillDownPropName[j]);
								this.oCurrSmartFilterBar.addFieldToAdvancedArea(sNewPropName);
							}
						} else {
							this.oCurrSmartFilterBar.addFieldToAdvancedArea(oDrillDownPropName[j]);
						}
					}

					this.oCurrSmartFilterBar.clearVariantSelection();
					this.oCurrSmartFilterBar.clear();
					this.oCurrSmartFilterBar.setDataSuiteFormat(oSelectionVars.toJSONString(), true);
					this.oCurrSmartTable.rebindTable(true);
				}
			},

			defaultVariantManagement: function (sTileType) {
			},

			handleInitialNav: function (oAppData, oURLParameters, sTileType) {
			},

			onCycleHandle: function (cyclePatternInput) {
				var oSelectionVars = new sap.ui.generic.app.navigation.service.SelectionVariant(this.aDrilldownfilter);
				// var oSelectionVars = JSON.parse(this.aDrilldownfilter);
				var oDrillDownPropName = oSelectionVars.getPropertyNames();

				for (var j = 0; j < oDrillDownPropName.length; j++) {
					if (oDrillDownPropName[j].endsWith('Text')) {
						var sNewPropName = oDrillDownPropName[j].replace(new RegExp('Text$'), '');
						if (oSelectionVars.getParameter(oDrillDownPropName[j])) {
							var aParamValue = oSelectionVars.getParameter(oDrillDownPropName[j]).split("::");
							oSelectionVars.addParameter(sNewPropName, aParamValue[0]);
							oSelectionVars.removeParameter(oDrillDownPropName[j]);
							this.oCurrSmartFilterBar.addFieldToAdvancedArea(sNewPropName);
						}
					} else {
						this.oCurrSmartFilterBar.addFieldToAdvancedArea(oDrillDownPropName[j]);
					}
					if (oDrillDownPropName[j] === "CyclePattern") {
						var sCyclePattern = oSelectionVars.getValue("CyclePattern");
						cyclePatternInput.setValue(sCyclePattern[0].Low);
					}
				}

				this.oCurrSmartFilterBar.clearVariantSelection();
				this.oCurrSmartFilterBar.clear();
				this.oCurrSmartFilterBar.setDataSuiteFormat(oSelectionVars.toJSONString(), true);
				this.oCurrentDate = this.oCurrSmartFilterBar.getFilterData().KeyDate;
			},

			onInitizedFilterBar: function () {
				this.getUserSetting();
			},

			onHandleAfterVariantLoad: function (oEvent) {

				if (this.getView().getViewName() !== "fin.cash.flow.analyzer.view.Worklist_D") {
					var sDate = new Date();
					//sDate = this.util.convertUTCDateToBrowerDate(sDate);
					var sTimePeriod = "D7";
					var sHistoricalTimeStamp = this.util.getHistoryDateTimeDefault();
					var formatSDate = this.util.dateFormat(sDate);
					this.oCurrSmartFilterBar.getControlByKey("KeyDate").setValue(formatSDate);
					switch (this.oCurrSmartFilterBar.getCurrentVariantId()) {
					case "id_1479185620511_138_filterBar":
					case "id_1479185731149_216_filterBar":
					case "":
						this.oCurrSmartFilterBar.getControlByKey("CyclePattern").setValue(sTimePeriod);
						this.oCurrSmartFilterBar.getControlByKey("HistoricalTimeStamp").setDateValue(sHistoricalTimeStamp);
						var aReconStatusKeys = [];
						aReconStatusKeys.push("3"); //Reconciled Forecasted Cash Flows
						aReconStatusKeys.push("4"); //Unreconciled Forecasted Cash Flows
						this.oCurrSmartFilterBar.getControlByKey("ReconcliationStatus").setSelectedKeys(aReconStatusKeys);
						this.oCurrSmartFilterBar.getControlByKey("DateIndicator").setSelectedKey("1"); //Value date
						break;
					//Cash Position
					case "id_1580887408938_286_page":
						this.oCurrSmartFilterBar.getControlByKey("CyclePattern").setValue(sTimePeriod);
						this.oCurrSmartFilterBar.getControlByKey("HistoricalTimeStamp").setDateValue(sHistoricalTimeStamp);
						break;
					//Liquidity Forecast
					case "id_1580887957688_180_page":
						this.oCurrSmartFilterBar.getControlByKey("CyclePattern").setValue(sTimePeriod);
						this.oCurrSmartFilterBar.getControlByKey("HistoricalTimeStamp").setDateValue(sHistoricalTimeStamp);
						break;
					//Actual Cash Flow
					//case "id_1479785449033_63_filterBar":
					case "id_1580886850100_229_page":
						var oToday = new Date();
						var aDate = new Date();
						oToday.setDate(1);
						sTimePeriod = "D31";
						oToday = this.util.dateFormat(oToday);
						aDate = this.util.dateFormat(aDate);
						this.oCurrSmartFilterBar.getControlByKey("ActualDate").setValue(aDate);
						this.oCurrSmartFilterBar.getControlByKey("KeyDate").setValue(oToday);
						this.oCurrSmartFilterBar.getControlByKey("CyclePattern").setValue(sTimePeriod);
						this.oCurrSmartFilterBar.getControlByKey("HistoricalTimeStamp").setDateValue(sHistoricalTimeStamp);
						break;
					default:
						var oData = this.oCurrSmartFilterBar.getFilterData();
						var oCustomFieldData = oData["_CUSTOM"];
						this.oCurrSmartFilterBar.getControlByKey("CyclePattern").setValue(oCustomFieldData.CyclePattern);
						if (oCustomFieldData.HistoricalTimeStamp) {	
							this.oCurrSmartFilterBar.getControlByKey("HistoricalTimeStamp").setDateValue(new Date(Date.parse(oCustomFieldData.HistoricalTimeStamp)));
						} else {	
							this.oCurrSmartFilterBar.getControlByKey("HistoricalTimeStamp").setDateValue(sHistoricalTimeStamp);
						}
						break;
					}
				} else {
					var sCurrentDate = this.util.dateFormat(this.oCurrentDate);
					this.oCurrSmartFilterBar.getControlByKey("KeyDate").setValue(sCurrentDate);
				}

			},
			onHandleBeforeVariantSave: function (oEvent) {

				var oCyclePattern = this.getView().byId("idCyclePattern").getValue();
				var oHistoricalTimeStamp = this.getView().byId("idHistoricalTimeStamp").getDateValue();

				if (oCyclePattern !== "") {
					this.oCurrSmartFilterBar.setFilterData({
						_CUSTOM: {
							CyclePattern: oCyclePattern,
							HistoricalTimeStamp: oHistoricalTimeStamp
						}
					});
				}

			},

			handleAfterVariantSaveTable: function (oEvent) {

				var sCurrentVariant = this.oCurrSmartTable.fetchVariant();
				sCurrentVariant = sCurrentVariant.group.groupItems;
				// var that = this;
				for (var i = sCurrentVariant.length - 1; i >= 0; i--) {
					if ((sCurrentVariant[i].columnKey === "LiquidityItem" ||
							sCurrentVariant[i].columnKey === "PlanningLevel" ||
							sCurrentVariant[i].columnKey === "CashPlanningGroup") && (parseInt((this.getView().getModel("Scaling").getData().viewType) ?
							this.getView().getModel("Scaling").getData().viewType : 0, 10) + 1) === 1) {

						sap.m.MessageBox.alert(this.oResourceBundle.getText("GROUP_ERROR"));
						break;

					}
				}

			},

			onHandleFilterChange: function (oEvent) {
				this.validateCyclePattern(oEvent);
			},

			handleAfterVariantInitialiseTable: function (oEvent) {
			},

			onSearch: function (oEvent) {

			},

			onNavBack: function () {
				var sPreviousHash = History.getInstance().getPreviousHash(),
					oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
					history.go(-1);
				} else {
					oCrossAppNavigator.toExternal({
						target: {
							shellHash: "#Shell-home"
						}
					});
				}
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
			
			onHandleSearchForCP: function (oEvt) {

				var aFilters = [];
				var sValue = oEvt.getParameter("value");
				var oFilter = new sap.ui.model.Filter("CashPoolName", sap.ui.model.FilterOperator.Contains, sValue);
				aFilters.push(oFilter);
				var oBinding = oEvt.getSource().getBinding("items");
				oBinding.filter(aFilters);

			},

			onHandleCloseForLQH: function (oEvt) {

				var aContexts = oEvt.getParameter("selectedContexts");
				if (aContexts.length) {
					this.oWnerComponent.sLQHiername = aContexts.map(function (oContext) {
						return oContext.getObject().HierarchyName;
					}).join(", ");
				}
				oEvt.getSource().getBinding("items").filter([]);

				if (this.oWnerComponent.sLQHiername !== null) {
					this.getView().byId("fin.cash.fa.liquidity-item-hierarchy-id").setValue(this.oWnerComponent.sLQHiername);
				}
			},

			onHandleCloseForBAH: function (oEvt) {

				var aContexts = oEvt.getParameter("selectedContexts");
				if (aContexts.length) {
					this.oWnerComponent.sBAHiername = aContexts.map(function (oContext) {
						return oContext.getObject().HierarchyName;
					}).join(", ");
				}
				oEvt.getSource().getBinding("items").filter([]);

				if (this.oWnerComponent.sBAHiername !== null) {
					this.getView().byId("fin.cash.fa.bank-account-hierarchy-id").setValue(this.oWnerComponent.sBAHiername);
				}
			},
			
			onHandleCloseForCP: function (oEvt) {

				var aContexts = oEvt.getParameter("selectedContexts");
				if (aContexts.length) {
					this.oWnerComponent.sCPName = aContexts.map(function (oContext) {
						return oContext.getObject().CashPoolName;
					}).join(", ");
				}
				oEvt.getSource().getBinding("items").filter([]);

				if (this.oWnerComponent.sCPName !== null) {
					this.getView().byId("fin.cash.fa.cash-pool-id").setValue(this.oWnerComponent.sCPName);
				}
			},
			
			onInterNavigationPressed: function (oEvt) {

				if (!this._DrillDownPopover) {
					this._DrillDownPopover = sap.ui.xmlfragment(this.getView().getId(), "fin.cash.flow.analyzer.view.fragment.NaviDetailPopOver", this);
					this.getView().addDependent(this._DrillDownPopover);
				}

				this._DrillDownPopover.open();

				if (!this.existDisplayCurrency()) {
					if (this.getView().byId("fin.cash.fa.lhh-nvg").getSelected() === true) {
						this.getView().byId("fin.cash.fa.lih-displaycurrency").setEnabled(true);
					} else {
						this.getView().byId("fin.cash.fa.lih-displaycurrency").setEnabled(false);
					}
				} else {
					this.getView().byId("fin.cash.fa.lih-displaycurrency").setEnabled(false);
					this.getView().byId("fin.cash.fa.lih-displaycurrency").setValue(this.existDisplayCurrency());
				}

			},

			handleLQValueHelp: function (oEvt) {
				if (!this._LQSDialog) {
					this._LQSDialog = sap.ui.xmlfragment(this.getView().getId(), "fin.cash.flow.analyzer.view.fragment.LQDialog", this);
					this.getView().addDependent(this._LQSDialog);
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

			handleBAValueHelp: function (oEvt) {
				if (!this._BASDialog) {
					this._BASDialog = sap.ui.xmlfragment(this.getView().getId(), "fin.cash.flow.analyzer.view.fragment.BADialog", this);
					this.getView().addDependent(this._BASDialog);
					this._BASDialog.setModel(this.oDataModel);
					var oTextModel = this.getView().getModel("i18n");
					this._BASDialog.setModel(oTextModel, "i18n");
				}
				this._BASDialog.setMultiSelect(false);
				this._BASDialog.setRememberSelections(true);
				// clear the old search filter
				this._BASDialog.getBinding("items").filter([]);
				// toggle compact style
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._BASDialog);
				this._BASDialog.open();
			},
			
			handleCPValueHelp: function (oEvt) {
				if (!this._CPSDialog) {
					this._CPSDialog = sap.ui.xmlfragment(this.getView().getId(), "fin.cash.flow.analyzer.view.fragment.CPDialog", this);
					this.getView().addDependent(this._CPSDialog);
					this._CPSDialog.setModel(this.oDataModel);
					var oTextModel = this.getView().getModel("i18n");
					this._CPSDialog.setModel(oTextModel, "i18n");
				}
				this._CPSDialog.setMultiSelect(false);
				this._CPSDialog.setRememberSelections(true);
				// clear the old search filter
				this._CPSDialog.getBinding("items").filter([]);
				// toggle compact style
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._CPSDialog);
				this._CPSDialog.open();
			},

			handleCalendarValueHelp: function (oEvt) {
				if (!this._CASDialog) {
					this._CASDialog = sap.ui.xmlfragment(this.getView().getId(), "fin.cash.flow.analyzer.view.fragment.CADialog", this);
					this.getView().addDependent(this._CASDialog);
					this._CASDialog.setModel(this.oDataModel);
					var oTextModel = this.getView().getModel("i18n");
					this._CASDialog.setModel(oTextModel, "i18n");
				}
				this._CASDialog.setMultiSelect(false);
				this._CASDialog.setRememberSelections(true);
				// clear the old search filter
				this._CASDialog.getBinding("items").filter([]);
				// toggle compact style
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._CASDialog);
				this._CASDialog.open();
			},

			handleDsplyCrcyValueHelp: function (oEvt) {
				if (!this._HDsplyCrcyDialog) {
					this._HDsplyCrcyDialog = sap.ui.xmlfragment(this.getView().getId(), "fin.cash.flow.analyzer.view.fragment.HDsplyCrcyDialog", this);
					this.getView().addDependent(this._HDsplyCrcyDialog);
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
			
			handleCPDsplyCrcyValueHelp: function (oEvt) {
				if (!this._CPDsplyCrcyDialog) {
					this._CPDsplyCrcyDialog = sap.ui.xmlfragment(this.getView().getId(), "fin.cash.flow.analyzer.view.fragment.CPDsplyCrcyDialog", this);
					this.getView().addDependent(this._CPDsplyCrcyDialog);
					this._CPDsplyCrcyDialog.setModel(this.oDataModel);
					var oTextModel = this.getView().getModel("i18n");
					this._CPDsplyCrcyDialog.setModel(oTextModel, "i18n");
				}
				this._CPDsplyCrcyDialog.setMultiSelect(false);
				this._CPDsplyCrcyDialog.setRememberSelections(true);
				// clear the old search filter
				this._CPDsplyCrcyDialog.getBinding("items").filter([]);
				// toggle compact style
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._CPDsplyCrcyDialog);
				this._CPDsplyCrcyDialog.open();
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

				if (this.getView().getModel("Scaling")) {
					if (!this.getView().getModel("Scaling").getData().displayCurrency) {
						return false;
					} else {
						return this.getView().getModel("Scaling").getData().displayCurrency;
					}
				} else {
					return false;
				}

			},

			handleIntrNavigation: function (oEvt) {

				var oSelectVariants = null;
				var oNavParameters = {};
				if (this.getView().byId("fin.cash.fa.lhh-nvg").getSelected() === true) {
					oSelectVariants = new SelectionVariant(this.oCurrSmartFilterBar.getDataSuiteFormat());
					// if liquidity item hierarchy
					if (this.oWnerComponent.sLQHiername === null) {
						sap.m.MessageBox.show(this.oResourceBundle.getText("NVGERROR"), {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: this.oResourceBundle.getText("NVGERRORTITLE"),
							actions: [sap.m.MessageBox.Action.OK]
						});
						return;

					} else {
						oSelectVariants.addSelectOption("LiquidityHierarchyName", "I", "EQ", this.oWnerComponent.sLQHiername, null);
						// In Hierarchy view, only flow item show, so Viewtype is set to be 2 by hardcode 
						oSelectVariants.addParameter("ViewType", "2");
						oSelectVariants.addParameter("CyclePattern", this.getView().byId("idCyclePattern").getValue());
						if (this.getView().byId("idHistoricalTimeStamp") && this.getView().byId("idHistoricalTimeStamp").getDateValue() && this.getView()
							.byId("idHistoricalTimeStamp").getDateValue() !== "") {
							oSelectVariants.addParameter("HistoricalTimeStamp", this.getView().byId("idHistoricalTimeStamp").getDateValue().toJSON());
						} else {
							//oSelectVariants.addParameter("HistoricalTimeStamp", this.getDefaultSnapshotTime().toJSON());
						}
						if (!this.existDisplayCurrency()) {
							if (!this.getView().byId("fin.cash.fa.lih-displaycurrency").getValue()) {
								sap.m.MessageBox.show(this.oResourceBundle.getText("NVGERROR"), {
									icon: sap.m.MessageBox.Icon.ERROR,
									title: this.oResourceBundle.getText("NVGERRORTITLE"),
									actions: [sap.m.MessageBox.Action.OK]
								});
								return;
							} else {
								oSelectVariants.addParameter("DisplayCurrency", this.getView().byId("fin.cash.fa.lih-displaycurrency").getValue());
							}

						} else {
							oSelectVariants.addParameter("DisplayCurrency", this.getView().byId("fin.cash.fa.lih-displaycurrency").getValue());

						}
						oSelectVariants.addParameter("FromMainView", "X");

						oNavParameters = {
							oDrilldownfilter: oSelectVariants.toJSONString()
								// drilldownpath: aDrilldownpath,
								// filterbarexpand: this.oCurrSmartFilterBar.getFilterBarExpanded()
						};
						this.getRouter().navTo("LiquidityItemHierarchy", {
							Params: JSON.stringify(oNavParameters).toBase64URI()
						});
					}
					return;
				}

				// if bank account hierarchy
				else if (this.getView().byId("fin.cash.fa.bah-nvg").getSelected() === true) {
					oSelectVariants = new SelectionVariant(this.oCurrSmartFilterBar.getDataSuiteFormat());
					
					this.oWnerComponent.sBAHiername = this.getView().byId("fin.cash.fa.bank-account-hierarchy-id").getValue();

					if (this.oWnerComponent.sBAHiername === null || this.oWnerComponent.sBAHiername === "" || this.oWnerComponent.sBAHiername ===
						undefined) {

						sap.m.MessageBox.show(this.oResourceBundle.getText("NVGERROR"), {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: this.oResourceBundle.getText("NVGERRORTITLE"),
							actions: [sap.m.MessageBox.Action.OK]
						});
						return;

					} else {

						oSelectVariants.addSelectOption("BankAccountGroup", "I", "EQ", this.oWnerComponent.sBAHiername, null);
						oSelectVariants.addParameter("ViewType", "2");
						oSelectVariants.addParameter("CyclePattern", this.getView().byId("idCyclePattern").getValue());
						if (this.getView() && this.getView().byId("idHistoricalTimeStamp") && this.getView().byId("idHistoricalTimeStamp").getDateValue() &&
							this.getView().byId("idHistoricalTimeStamp").getDateValue() !== '') {
							oSelectVariants.addParameter("HistoricalTimeStamp", this.getView().byId("idHistoricalTimeStamp").getDateValue().toJSON());
						} else {
							//oSelectVariants.addParameter("HistoricalTimeStamp", this.getDefaultSnapshotTime().toJSON());
						}
						if (this.rbIsBankCurrency === "1") {
							oSelectVariants.removeParameter("BankAccountCurrency");
						}

						oNavParameters = {
							oDrilldownfilter: oSelectVariants.toJSONString()
						};
						this.getRouter().navTo("BankAccountHierarchy", {
							Params: JSON.stringify(oNavParameters).toBase64URI()
						});

					}
					return;
				} else if (this.getView().byId("fin.cash.fa.cp-nvg").getSelected() === true) {
					oSelectVariants = new SelectionVariant();
					var oSelectVariantsOv = new SelectionVariant(this.oCurrSmartFilterBar.getDataSuiteFormat());
					
					this.oWnerComponent.sCPName = this.getView().byId("fin.cash.fa.cash-pool-id").getValue();

					if (this.oWnerComponent.sCPName === null || this.oWnerComponent.sCPName === "" || this.oWnerComponent.sCPName ===
						undefined) {

						sap.m.MessageBox.show(this.oResourceBundle.getText("NVGERROR"), {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: this.oResourceBundle.getText("NVGERRORTITLE"),
							actions: [sap.m.MessageBox.Action.OK]
						});
						return;

					} else {
						oSelectVariants.addParameter("HierarchyName", this.oWnerComponent.sCPName);
						
						var valueDate = oSelectVariantsOv.getValue("KeyDate");
						oSelectVariants.addParameter("ValueDate", valueDate[0].Low);
						
						if (this.getView() && this.getView().byId("idExRateType")) {
							oSelectVariants.addParameter("ExchangeRateType", this.getView().byId("idExRateType").getValue());
						}
						
						if (!this.existDisplayCurrency()) {
							if (!this.getView().byId("fin.cash.fa.cp-displaycurrency").getValue()) {
								sap.m.MessageBox.show(this.oResourceBundle.getText("NVGERROR"), {
									icon: sap.m.MessageBox.Icon.ERROR,
									title: this.oResourceBundle.getText("NVGERRORTITLE"),
									actions: [sap.m.MessageBox.Action.OK]
								});
								return;
							} else {
								oSelectVariants.addParameter("DisplayCurrency", this.getView().byId("fin.cash.fa.cp-displaycurrency").getValue());
							}

						} else {
							oSelectVariants.addParameter("DisplayCurrency", this.getView().byId("fin.cash.fa.cp-displaycurrency").getValue());

						}

						oNavParameters = {
							oDrilldownfilter: oSelectVariants.toJSONString()
						};
						this.getRouter().navTo("CashConcentrationSim", {
							Params: JSON.stringify(oNavParameters).toBase64URI()
						});

					}
					return;
				} else {

					sap.m.MessageBox.show(this.oResourceBundle.getText("DONOTSELECTHIERARCHY"), {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: this.oResourceBundle.getText("HIERERRORTITLE"),
						actions: [sap.m.MessageBox.Action.OK]
					});
				}
			},
			getDefaultSnapshotTime: function () {
				var currDate = new Date();
				currDate.setHours(23, 59, 59, 999);
				return new Date(currDate.getTime() - currDate.getTimezoneOffset() * 60000);
			},
			_cancelSubmit: function (event) {
				if (this._DrillDownPopover) {
					this._DrillDownPopover.close();
				}
			},

			handleSelect: function (event) {
				var oRB = event.getSource();
				var sId = oRB.getId().split("--")[2];
				if (sId === "fin.cash.fa.lhh-nvg") {
					this.getView().byId("fin.cash.fa.bah-nvg").setActiveHandling(false);
					this.getView().byId("fin.cash.fa.bank-account-hierarchy-id").setEnabled(false);
					this.getView().byId("fin.cash.fa.liquidity-item-hierarchy-id").setEnabled(true);
					this.getView().byId("fin.cash.fa.lih-displaycurrency").setEnabled(true);
					this.getView().byId("fin.cash.fa.cash-pool-id").setEnabled(false);
					this.getView().byId("fin.cash.fa.cp-displaycurrency").setEnabled(false);

					if (this.oWnerComponent.sLQHiername !== null) {
						this.getView().byId("fin.cash.fa.liquidity-item-hierarchy-id").setValue(this.oWnerComponent.sLQHiername);
					}
					if (this.existDisplayCurrency()) {
						//sap.ui.getCore().byId("fin.cash.fa.lih-displaycurrency").setEnabled(false);
						this.getView().byId("fin.cash.fa.lih-displaycurrency").setValue(this.existDisplayCurrency());
					} else {
						this.getView().byId("fin.cash.fa.lih-displaycurrency").setEnabled(true);
					}
				}
				if (sId === "fin.cash.fa.bah-nvg") {
					this.getView().byId("fin.cash.fa.lhh-nvg").setActiveHandling(false);
					this.getView().byId("fin.cash.fa.bank-account-hierarchy-id").setEnabled(true);
					this.getView().byId("fin.cash.fa.liquidity-item-hierarchy-id").setEnabled(false);
					this.getView().byId("fin.cash.fa.lih-displaycurrency").setEnabled(false);
					this.getView().byId("fin.cash.fa.cash-pool-id").setEnabled(false);
					this.getView().byId("fin.cash.fa.cp-displaycurrency").setEnabled(false);

					if (this.oWnerComponent.sBAHiername !== null) {
						this.getView().byId("fin.cash.fa.bank-account-hierarchy-id").setValue(this.oWnerComponent.sBAHiername);
					}
				}
				if (sId === "fin.cash.fa.cp-nvg") {
					this.getView().byId("fin.cash.fa.lhh-nvg").setActiveHandling(false);
					this.getView().byId("fin.cash.fa.bank-account-hierarchy-id").setEnabled(false);
					this.getView().byId("fin.cash.fa.liquidity-item-hierarchy-id").setEnabled(false);
					this.getView().byId("fin.cash.fa.lih-displaycurrency").setEnabled(false);
					this.getView().byId("fin.cash.fa.cash-pool-id").setEnabled(true);
					this.getView().byId("fin.cash.fa.cp-displaycurrency").setEnabled(true);

					if (this.oWnerComponent.sCPName !== null) {
						this.getView().byId("fin.cash.fa.cash-pool-id").setValue(this.oWnerComponent.sCPName);
					}
				}
			},

			onDataRecevied: function (oEvent) {
			},

			headerFormatter: function (sValue) {
				if (sValue === null || sValue === undefined || sValue === "") {
					var sUrl = sap.ui.resource("fin.cash.flow.analyzer.i18n", "i18n.properties");
					var oi18n = jQuery.sap.resources({
						url: sUrl
					});

					return oi18n.getText("NotAssign");
				} else {
					return sValue;
				}
			},

			setEmptyGroupValue: function () {
				this.getView().byId("ACBankAccount").setGroupHeaderFormatter(this.headerFormatter);
			},

			expressBasicCashMsg: function () {

			},

			onHandleBeforeRebindTable: function (oEvent) {
				//check
				this.setEmptyGroupValue();
				this.oSmartFilterBar = this.getView().byId("idsmartFilterBarItem");
				var aFilters = this.oCurrSmartFilterBar.getFilters()[0];
				var currencyVal = 0;
				var exRt = 0;
				//check the amount of filters in the array

				if (aFilters) {
					if (aFilters._bMultiFilter === false) {
						//for single situation, direct reading attribute sPath
						if (aFilters.sPath === "DisplayCurrency") {
							currencyVal = 10;
						}

					} else {
						//for muti filter situation, ergodic the list and check data
						var filterList = aFilters.aFilters;
						for (var i = 0; i < filterList.length; i++) {
							if (filterList[i].sPath === "DisplayCurrency") {
								currencyVal = 10;
							}
							if (filterList[i].sPath === "ExRateType") {
								exRt = 10;
							}
						}

					}

					if (currencyVal === 10) {

						this.byId("exRateTypeFilter").setVisibleInAdvancedArea(true);
						aFilters = this.oCurrSmartFilterBar.getFilters()[0];
						if (aFilters._bMultiFilter === true) {
							//for muti filter situation, ergodic the list and check data
							filterList = aFilters.aFilters;
							for (i = 0; i < filterList.length; i++) {
								if (filterList[i].sPath === "ExRateType") {
									exRt = 30;
								}
							}

						}
						if (exRt !== 30) {
							sap.m.MessageBox.show(this.oResourceBundle.getText("ExRTVldt"), {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: this.oResourceBundle.getText("ExRTVldt"),
								actions: [sap.m.MessageBox.Action.OK]
							});
							return;
						}

					}

					var currentDate = this.oCurrSmartFilterBar.getFilterData(true).KeyDate;
					this.refillDaysColumn(currentDate);
					this.loadCycle();

					var b = oEvent.getParameter("bindingParams");
					b.parameters.provideGrandTotals = true;
					var amountValue = this.getView().byId("idCyclePattern").getValue();
					var aDateFilters = new sap.ui.model.Filter("CyclePattern", sap.ui.model.FilterOperator.EQ, amountValue);
					b.filters.push(aDateFilters);

					if (this.getView().getModel("Scaling")) {
						aDateFilters = new sap.ui.model.Filter("ViewType", sap.ui.model.FilterOperator.EQ, parseInt(this.getView().getModel("Scaling").getData()
							.viewType, 10) + 1);
					}
					b.filters.push(aDateFilters);
					
					if(b.parameters.select) {
						this.byId("ACBankAccountName").setInResult(false);
						this.byId("ACCompanyCodeName").setInResult(false);
						var sel_elem = b.parameters.select.split(",");
						for(i = 0; i < sel_elem.length; i++){
							if(sel_elem[i] === "CompanyCode"){this.byId("ACCompanyCodeName").setInResult(true);}
							if(sel_elem[i] === "BankAccount"){this.byId("ACBankAccountName").setInResult(true);}
						}
					}

					var oSelectionVariant = new sap.ui.generic.app.navigation.service.SelectionVariant(this.oSmartFilterBar.getDataSuiteFormat());

					var releaseFlagSelection = oSelectionVariant.getParameter("ReleaseFlag");
					if (releaseFlagSelection !== undefined) {
						if (parseInt(releaseFlagSelection, 10) === 0) { //no, only release flow is needed
							var oFilterRelease = new sap.ui.model.Filter("ReleaseStatus", 'EQ', "");
							b.filters.push(oFilterRelease);
						}
					}

					/* add reconcliation status filter value*/
					var flg_recon = "";
					var flv_recon_0 = new sap.ui.model.Filter("ReconcliationStatus", "EQ", "0");
					if (b.filters[0].aFilters) {
						var iLength = b.filters[0].aFilters.length;
						for (i = 0; i < iLength; i++) {
							aFilters = b.filters[0].aFilters[i].aFilters;
							if (aFilters) {
								if (aFilters[0].sPath === "ReconcliationStatus") {
									aFilters.push(flv_recon_0);
									flg_recon = "X";
								}
							}
						}
					}
					if (flg_recon === "") {
						b.filters.push(flv_recon_0);
					}

					//add value of Historical Timestamp into filters
					var historyTimeStamp = this.getView().byId("idHistoricalTimeStamp").getDateValue();
					if (historyTimeStamp === undefined || historyTimeStamp === "" || historyTimeStamp === null) {
						historyTimeStamp = this.util.formatUTCDateString(new Date());
					} else {
						historyTimeStamp = this.util.formatUTCDateString(historyTimeStamp);
					}
					aDateFilters = new sap.ui.model.Filter("HistoricalTimeStamp", sap.ui.model.FilterOperator.EQ, historyTimeStamp);
					b.filters.push(aDateFilters);

					if (this.getView().getModel("Scaling")) {
						aDateFilters = new sap.ui.model.Filter("ISBANKCURRENCY",
							sap.ui.model.FilterOperator.EQ, this.getView().getModel("Scaling").getData().isBankCurrency);
						b.filters.push(aDateFilters);

						aDateFilters = new sap.ui.model.Filter("Calendar",
							sap.ui.model.FilterOperator.EQ, (this.getView().getModel("Scaling").getData().factoryCalendarId) ? (this.getView().getModel(
								"Scaling").getData().factoryCalendarId) : "*");
						b.filters.push(aDateFilters);

						aDateFilters = new sap.ui.model.Filter("PreviousFlag",
							sap.ui.model.FilterOperator.EQ, (this.getView().getModel("Scaling").getData().previousFlag) ? (this.getView().getModel(
								"Scaling").getData().previousFlag) : "0");
						b.filters.push(aDateFilters);

					} else {
						aDateFilters = new sap.ui.model.Filter("ISBANKCURRENCY", sap.ui.model.FilterOperator.EQ, "");
						b.filters.push(aDateFilters);

						aDateFilters = new sap.ui.model.Filter("Calendar", sap.ui.model.FilterOperator.EQ, "*");
						b.filters.push(aDateFilters);

						aDateFilters = new sap.ui.model.Filter("PreviousFlag", sap.ui.model.FilterOperator.EQ, "0");
						b.filters.push(aDateFilters);
					}

					//set inresult for direction 
					if (!this.getView().byId("ViewTypeExt").getVisible()) {
						this.getView().byId("Direction").setInResult(false);
					} else {
						this.getView().byId("Direction").setInResult(true);
					}
					// set inresult for Bank Country
					if (!this.getView().byId("ACBank").getVisible()) {
						this.getView().byId("ACBankCountry").setInResult(false);
					} else {
						this.getView().byId("ACBankCountry").setInResult(true);
					}

					// set inresult for AccId
					if (!this.getView().byId("ACBankAccount").getVisible()) {
						this.getView().byId("ACAccId").setInResult(false);
					} else {
						this.getView().byId("ACAccId").setInResult(true);
					}

					// disable btnPreviousCycle when end of period is true or calendar is enable
					var sEndofPeriod = this.oCurrSmartFilterBar.getFilterData(true).EndofPeriod;

					var sCalendar;
					if (this.getView().getModel("Scaling")) {
						sCalendar = this.getView().getModel("Scaling").getData().factoryCalendarId;
					}

					if (sEndofPeriod || sCalendar !== "*") {
						this.getView().byId("btnPreviousCycle").setEnabled(false);
					} else {
						this.getView().byId("btnPreviousCycle").setEnabled(true);
					}
				}
			},

			refillDaysColumn: function (oDate) {
				var currentDate = oDate;
				if (!currentDate) {
					currentDate = this.util.convertABAPDateToDate("20160111");
				}

				var sViewCyclePattern = this.getView().byId("idCyclePattern").getValue();

				if (sViewCyclePattern === "" && this.bIsSaveAsTile) {
					sViewCyclePattern = "D7";
				}

				if (sViewCyclePattern) {
					var cycleList = sViewCyclePattern.split("+");
				}

				var cycleNumber = 0;

				//set properties for overdue column

				var sPattern = "CYCLE" + "0" + JSON.stringify(cycleNumber);
				this.setVisible(sPattern, true);
				cycleNumber = cycleNumber + 1;

				for (var i = 0; i < cycleList.length; i++) {
					switch (cycleList[i].substr(0, 1)) {

					case 'D':
						// case date
						//set corresponding visible feature as true
						//set corresponding emphize feature as true if the date is in the actual date area.
						var pattermNum = parseInt(cycleList[i].substr(1), 10);
						for (var j = 0; j < pattermNum; j++) {

							if (cycleNumber <= 9) {
								sPattern = "CYCLE" + "0" + JSON.stringify(cycleNumber);
							} else {
								sPattern = "CYCLE" + JSON.stringify(cycleNumber);
							}
							this.setVisible(sPattern, true);
							cycleNumber = cycleNumber + 1;
						}
						break;
					case 'W':
						pattermNum = parseInt(cycleList[i].substr(1), 10);
						for (j = 0; j < pattermNum; j++) {
							if (cycleNumber <= 9) {
								sPattern = "CYCLE" + "0" + JSON.stringify(cycleNumber);
							} else {
								sPattern = "CYCLE" + JSON.stringify(cycleNumber);
							}
							this.setVisible(sPattern, true);
							cycleNumber = cycleNumber + 1;
						}
						break;
					case 'Y':
						pattermNum = parseInt(cycleList[i].substr(1), 10);
						for (j = 0; j < pattermNum; j++) {
							if (cycleNumber <= 9) {
								sPattern = "CYCLE" + "0" + JSON.stringify(cycleNumber);
							} else {
								sPattern = "CYCLE" + JSON.stringify(cycleNumber);
							}
							this.setVisible(sPattern, true);
							cycleNumber = cycleNumber + 1;
						}
						break;
					case 'Q':
						pattermNum = parseInt(cycleList[i].substr(1), 10);
						for (j = 0; j < pattermNum; j++) {
							if (cycleNumber <= 9) {
								sPattern = "CYCLE" + "0" + JSON.stringify(cycleNumber);
							} else {
								sPattern = "CYCLE" + JSON.stringify(cycleNumber);
							}
							this.setVisible(sPattern, true);
							cycleNumber = cycleNumber + 1;
						}
						break;
					case 'M':
						pattermNum = parseInt(cycleList[i].substr(1), 10);
						for (j = 0; j < pattermNum; j++) {
							if (cycleNumber <= 9) {
								sPattern = "CYCLE" + "0" + JSON.stringify(cycleNumber);
							} else {
								sPattern = "CYCLE" + JSON.stringify(cycleNumber);
							}
							this.setVisible(sPattern, true);
							cycleNumber = cycleNumber + 1;
						}
						break;
					default:
					}
				}
				//set value for future column
				if (cycleNumber <= 9) {
					sPattern = "CYCLE" + "0" + JSON.stringify(cycleNumber);
				} else {
					sPattern = "CYCLE" + JSON.stringify(cycleNumber);
				}
				this.setVisible(sPattern, true);
				cycleNumber = cycleNumber + 1;

				for (j = cycleNumber; j < 33; j++) {

					if (j <= 9) {
						sPattern = "CYCLE" + "0" + JSON.stringify(j);
					} else {
						sPattern = "CYCLE" + JSON.stringify(j);
					}
					this.setVisible(sPattern, false);
				}
			},

			checkDisplayCurrencyHasBeenSelected: function () {
				var checkResult = false;
				var currentFilters = this.oCurrSmartFilterBar.getFilters()[0];

				//check the amount of filters in the array
				if (currentFilters._bMultiFilter === false) {
					//for single situation, direct reading attribute sPath
					if (currentFilters.sPath === "DisplayCurrency") {
						return true;
					} else {
						return false;
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

			setVisible: function (oPattern, isVisible) {
				if (isVisible === true) {
					if (this.checkDisplayCurrencyHasBeenSelected()) {
						this.byId("D" + oPattern).setVisible(true);
						this.byId("B" + oPattern).setVisible(true);

					} else {
						this.byId("D" + oPattern).setVisible(false);
						this.byId("B" + oPattern).setVisible(true);
					}
				} else {
					this.byId("D" + oPattern).setVisible(false);
					this.byId("B" + oPattern).setVisible(false);
				}

			},

			isNull: function (val) {
				if (val === undefined || val === "" || val === null) {
					return true;
				}
				return false;

			},

			loadCycle: function () {
				//start lock
				var sPath = "/FCLM_CFBA_CYCLE_VIEWSet";
				var sCyclePattern = this.getView().byId("idCyclePattern").getValue();
				var sKeyDate = this.oCurrSmartFilterBar.getFilterData(true).KeyDate;
				var aFilters = [];
				var oFilter = null;

				var timeString = this.util.switchLocaltoUTC(sKeyDate);

				if (sKeyDate) {
					oFilter = new sap.ui.model.Filter("KeyDate", "EQ", timeString);
				} else {
					oFilter = new sap.ui.model.Filter("KeyDate", "EQ", "datetime'2014-04-11T00:00:00'");
				}
				aFilters.push(oFilter);

				if (sCyclePattern) {
					oFilter = new sap.ui.model.Filter("CyclePattern", "EQ", sCyclePattern);
				} else {
					oFilter = new sap.ui.model.Filter("CyclePattern", "EQ", "D7");
				}
				aFilters.push(oFilter);

				oFilter = new sap.ui.model.Filter("EndofPeriod", "EQ",
					(this.oCurrSmartFilterBar.getFilterData(true).EndofPeriod) ? (this.oCurrSmartFilterBar.getFilterData(true).EndofPeriod) : "");
				aFilters.push(oFilter);

				if (this.getView().getModel("Scaling")) {
					oFilter = new sap.ui.model.Filter("Calendar", "EQ",
						(this.getView().getModel("Scaling").getData().factoryCalendarId) ? this.getView().getModel("Scaling").getData().factoryCalendarId :
						"*");
					aFilters.push(oFilter);
					oFilter = new sap.ui.model.Filter("PreviousFlag", "EQ",
						(this.getView().getModel("Scaling").getData().previousFlag) ? this.getView().getModel("Scaling").getData().previousFlag : "0");
					aFilters.push(oFilter);
				} else {
					oFilter = new sap.ui.model.Filter("Calendar", "EQ", "*");
					aFilters.push(oFilter);
					oFilter = new sap.ui.model.Filter("PreviousFlag", "EQ", "0");
					aFilters.push(oFilter);
				}

				var oModel = this.oDataModel;
				if (oModel) {
					// this.oCurrSmartTable.setBusy(true);
					oModel.read(sPath, {
						async: false,
						filters: aFilters,
						success: $.proxy(this.handleCycleDataReady, this),
						error: $.proxy(this.handleCycleDataFailed, this)
					});
				}
			},

			handleCycleDataReady: function (oData) {
				// this.oCurrSmartTable.setBusy(false);
				this.oCycleData = {
					"results": []
				};
				for (var i = 0; i < oData["results"].length; i++) {
					var cycledata = {
						REP_CYCLE_KEY: oData["results"][i].CycleKey,
						CYCLE_TYPE: oData["results"][i].CycleType,
						REP_DATE_F: this.util.switchUTCtoLocal(oData["results"][i].DisplayDateFrom),
						REP_DATE_T: this.util.switchUTCtoLocal(oData["results"][i].DisplayDateTo),
						REP_DATE_ACTUAL_F: this.util.switchUTCtoLocal(oData["results"][i].DateFrom),
						REP_DATE_ACTUAL_T: this.util.switchUTCtoLocal(oData["results"][i].DateTo)
					};
					this.oCycleData["results"].push(cycledata);
				}
				this.fillAmountlabel();
			},

			handleCycleDataFailed: function (error) {
			},

			fillAmountlabel: function () {
				var oFieldMapping = [];
				for (var i = 0; i < this.oCycleData["results"].length; i++) {
					var sPatternItem = this.oCycleData["results"][i];
					var sStr = "";
					var sTooltip = "";
					var sStrPastCurrent = "";

					var aFieldMapping = {
						field: "",
						from: "",
						to: ""
					};

					switch (sPatternItem.CYCLE_TYPE) {
					case 'D':
						sStr = this.util.dateFormat(sPatternItem.REP_DATE_F);
						sTooltip = this.util.dateFormat(sPatternItem.REP_DATE_ACTUAL_F) + "~" + this.util.dateFormat(sPatternItem.REP_DATE_ACTUAL_T);
						break;
					case 'M':
						sStr = this.util.getMonth(sPatternItem.REP_DATE_F.getMonth() + 1).toString() + ", " + sPatternItem.REP_DATE_F.getFullYear().toString();
						sTooltip = this.util.dateFormat(sPatternItem.REP_DATE_ACTUAL_F) + "~" + this.util.dateFormat(sPatternItem.REP_DATE_ACTUAL_T);
						break;
					case 'W':
						sStr = this.oResourceBundle.getText("Week") + this.util.getWeekNum(sPatternItem.REP_DATE_F).toString() + ", " + sPatternItem.REP_DATE_F
							.getFullYear().toString();
						sTooltip = this.util.dateFormat(sPatternItem.REP_DATE_ACTUAL_F) + "~" + this.util.dateFormat(sPatternItem.REP_DATE_ACTUAL_T);
						break;
					case 'Q':
						sStr = this.util.getQuarter(sPatternItem.REP_DATE_F.getMonth() + 1).toString() + ", " + sPatternItem.REP_DATE_F.getFullYear().toString();
						sTooltip = this.util.dateFormat(sPatternItem.REP_DATE_ACTUAL_F) + "~" + this.util.dateFormat(sPatternItem.REP_DATE_ACTUAL_T);
						break;
					case 'Y':
						sStr = sPatternItem.REP_DATE_F.getFullYear().toString();
						sTooltip = this.util.dateFormat(sPatternItem.REP_DATE_ACTUAL_F) + "~" + this.util.dateFormat(sPatternItem.REP_DATE_ACTUAL_T);
						break;
					case 'A':
						sStr = this.oResourceBundle.getText("FUTURE"); 
						sTooltip = this.util.dateFormat(sPatternItem.REP_DATE_ACTUAL_F) + "~" + this.util.dateFormat(sPatternItem.REP_DATE_ACTUAL_T);
						break;
					case 'B':
						sStr = this.oResourceBundle.getText("OVERDUE");
						sTooltip = this.util.dateFormat(sPatternItem.REP_DATE_ACTUAL_F) + "~" + this.util.dateFormat(sPatternItem.REP_DATE_ACTUAL_T);

						//add mapping for navigation
						aFieldMapping.field = "OverDue";
						break;

					}

					if (aFieldMapping.field !== "OverDue") {

						aFieldMapping.field = sPatternItem.REP_CYCLE_KEY;
						var intValue = aFieldMapping.field.split("CYCLE")[1];
						var cycleNum = parseInt(intValue, 10);
						if (cycleNum >= 0) {
							aFieldMapping.field = "Data" + cycleNum.toString();
						} else {
							aFieldMapping.field = "OverDue";
						}

					}

					aFieldMapping.from = sPatternItem.REP_DATE_ACTUAL_F;
					aFieldMapping.to = sPatternItem.REP_DATE_ACTUAL_T;
					oFieldMapping.push(aFieldMapping);

					var oMultiLabel1 = new sap.m.Label({
						text: sStr,
						textAlign: "Center"
					});

					oMultiLabel1.setTooltip(sTooltip);

					if (sStrPastCurrent !== "") {
						oMultiLabel1.addStyleClass(sStrPastCurrent);
					}

					if (!this.checkDisplayCurrencyHasBeenSelected()) {

						this.byId("D" + sPatternItem.REP_CYCLE_KEY).removeAllMultiLabels();
						this.byId("D" + sPatternItem.REP_CYCLE_KEY).insertMultiLabel(oMultiLabel1, 1);
						this.byId("B" + sPatternItem.REP_CYCLE_KEY).removeAllMultiLabels();
						this.byId("B" + sPatternItem.REP_CYCLE_KEY).insertMultiLabel(oMultiLabel1, 1);
					} else {
						var oMultiLabel2 = new sap.m.Label({
							text: sStr,
							textAlign: "Center"
						});
						oMultiLabel2.setTooltip(this.oResourceBundle.getText(sTooltip + "DisplayCurrency"));

						if (sStrPastCurrent !== "") {
							oMultiLabel2.addStyleClass(sStrPastCurrent);
						}

						this.byId("D" + sPatternItem.REP_CYCLE_KEY).removeAllMultiLabels();
						this.byId("D" + sPatternItem.REP_CYCLE_KEY).insertMultiLabel(oMultiLabel2, 1);
						this.byId("DL" + sPatternItem.REP_CYCLE_KEY).setText(sStr);
						this.byId("B" + sPatternItem.REP_CYCLE_KEY).removeAllMultiLabels();
						this.byId("B" + sPatternItem.REP_CYCLE_KEY).insertMultiLabel(oMultiLabel1, 1);
						this.byId("BL" + sPatternItem.REP_CYCLE_KEY).setText(sStr);
					}
				}

				// add model of mapping for navigation
				var oFieldMappingModel = new JSONModel(oFieldMapping);
				this.getView().setModel(oFieldMappingModel, "FieldMapping");

				if (this.oCycleData["results"].length > 0) {
					for (var j = this.oCycleData["results"].length; j < 33; j++) {
						if (this.oCurrSmartFilterBar.getFilterData(true).DisplayCurrency) {

							if (j <= 9) {
								var sInvisibleItem = "DCYCLE" + "0" + JSON.stringify(j);
							} else {
								sInvisibleItem = "DCYCLE" + JSON.stringify(j);
							}

							this.byId(sInvisibleItem).setVisible(false);
							this.byId("DL" + sPatternItem.REP_CYCLE_KEY).setText(this.oResourceBundle.getText("Amount"));
						} else {
							if (j <= 9) {
								sInvisibleItem = "BCYCLE" + "0" + JSON.stringify(j);
							} else {
								sInvisibleItem = "BCYCLE" + JSON.stringify(j);
							}
							this.byId(sInvisibleItem).setVisible(false);
							this.byId("BL" + sPatternItem.REP_CYCLE_KEY).setText(this.oResourceBundle.getText("Amount"));
						}
					}
				}
			},

			// handle navigation of BalanceDay1~BalanceDay32
			handlePopOverOpens: function (oEvt) {
				this.oNav.onBeforePopoverOpens(oEvt, this);
			},

			onNavTargetsObtained: function (oEvent) {
				this.oNav.onTargetObtained(oEvent, this);

			},

			onTargetObtained: function (oEvent) {
				this.oNav.onTargetObtained(oEvent, this);

			},

			// handle navigation of BankAccount
			handlePopOverOpensBACC: function (oEvt) {
				this.oNav.onBeforePopoverOpensBACC(oEvt, this);
			},

			onNavTargetsObtainedBACC: function (oEvent) {
				this.oNav.onTargetObtainedBACC(oEvent, this);
			},

			onTargetObtainedBACC: function (oEvent) {
				this.oNav.onTargetObtainedBACC(oEvent, this);
			},

			// handle navigation of Bank
			handlePopOverOpensBANK: function (oEvt) {
				this.oNav.onBeforePopoverOpensBANK(oEvt, this);
			},

			onNavTargetsObtainedBANK: function (oEvent) {
				this.oNav.onTargetObtainedBANK(oEvent, this);
			},

			onTargetObtainedBANK: function (oEvent) {
				this.oNav.onTargetObtainedBANK(oEvent, this);
			},

			onTargetObtainedCommon: function (oEvent) {
				this.oNav.onTargetObtainedCommon(oEvent, this);
			},

			onHandleCloseForHDC: function (oEvt) {

				var aContexts = oEvt.getParameter("selectedContexts");
				var sMessage = this.oResourceBundle.getText("MSGDC");

				if (this.getView().byId("fin.cash.fa.lhh-nvg").getSelected() === true) {
					if (aContexts.length) {
						this.oWnerComponent.sLQHDSPCRCY = aContexts.map(function (oContext) {
							return oContext.getObject().WAERS;
						}).join(", ");
						sap.m.MessageToast.show(sMessage + " " + this.oWnerComponent.sLQHDSPCRCY);
					}
					oEvt.getSource().getBinding("items").filter([]);

					if (this.oWnerComponent.sLQHDSPCRCY !== null) {
						this.getView().byId("fin.cash.fa.lih-displaycurrency").setValue(this.oWnerComponent.sLQHDSPCRCY);
					}

				}

				if (this.getView().byId("fin.cash.fa.bah-nvg").getSelected() === true) {
					if (aContexts.length) {
						this.oWnerComponent.sBAHDSPCRCY = aContexts.map(function (oContext) {
							return oContext.getObject().WAERS;
						}).join(", ");
						sap.m.MessageToast.show(sMessage + " " +  this.oWnerComponent.sBAHDSPCRCY);
					}
					oEvt.getSource().getBinding("items").filter([]);

					if (this.oWnerComponent.sBAHDSPCRCY !== null) {
						this.getView().byId("fin.cash.fa.bah-displaycurrency").setValue(this.oWnerComponent.sBAHDSPCRCY);
					}
				}
				
				if (this.getView().byId("fin.cash.fa.cp-nvg").getSelected() === true) {
					if (aContexts.length) {
						this.oWnerComponent.sCPDSPCRCY = aContexts.map(function (oContext) {
							return oContext.getObject().WAERS;
						}).join(", ");
						sap.m.MessageToast.show(sMessage + " " + this.oWnerComponent.sCPDSPCRCY);
					}
					oEvt.getSource().getBinding("items").filter([]);

					if (this.oWnerComponent.sCPDSPCRCY !== null) {
						this.getView().byId("fin.cash.fa.cp-displaycurrency").setValue(this.oWnerComponent.sCPDSPCRCY);
					}

				}

			},

			//keep the App state when poping over 
			onPopoverLinkPressed: function (oEvent) {
				this.oNav.onPopoverLinkPressed(oEvent, this);
			},

			saveAppState: function () {

				this.oInnerAppData = {

					selectionVariant: this.oCurrSmartFilterBar.getDataSuiteFormat(),
					tableVariantId: this.oCurrSmartTable.getCurrentVariantId()
				};
				this.oStoreInnerAppStatePromise = this.oNavigationHandler.storeInnerAppState(this.oInnerAppData);

				this.oStoreInnerAppStatePromise.done(function () {

				});
				this.oStoreInnerAppStatePromise.fail(function (oError) {
					var oi18n = this.getView().getModel("i18n").getResourceBundle();
					oError.setUIText({
						oi18n: oi18n,
						sTextKey: "STORE_ERROR"
					});
					oError.showMessageBox();
				});
			},

			validateCyclePattern: function (oEvent) {

				var cyclePatternInput = this.getView().byId("idCyclePattern");
				var sCyclePattern = cyclePatternInput.getValue().toUpperCase();
				this.getView().byId("idCyclePattern").setValue(sCyclePattern);
				var iLen = 0;
				var regx = new RegExp("^([D,W,M,Q,Y]([1-9]|([1-2][0-9])|(3[0-1])))$");
				var cycleOrder = [];
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

			storeCurrentAppState: function () {
				var oAppStatePromise = this.oNavigationHandler.storeInnerAppState(this.getCurrentAppState());
				var that = this;
				oAppStatePromise.fail(function (oError) {
					that.arOwnerFilters(oError);
				});
			},

			getCurrentAppState: function () {
				/* Special handling for selection fields, for which defaults are defined:
				 If a field is visible in the SmartFilterBar and the user has cleared the input value, the field is not included in the selection variant, which 
				 is returned by getDataSuiteFormat() of the SmartFilterBar. But since it was cleared by purpose, we have to store the selection with the value "",
				 in order to set it again to an empty value, when restoring the selection after a back navigation. Otherwise, the default value would be set.
				*/

				var oSelectionVariant = new SelectionVariant(this.oSmartFilterBar.getDataSuiteFormat());
				// remove existing cyclepattern variant
				oSelectionVariant.removeParameter("CyclePattern");
				oSelectionVariant.addSelectOption("CyclePattern", "I", "EQ", this.getView().byId("idCyclePattern").getValue());
				oSelectionVariant.removeParameter("HistoricalTimeStamp");
				var sHistoricalTimeStamp = this.getView().byId("idHistoricalTimeStamp").getDateValue();
				if (!this.util.isNull(sHistoricalTimeStamp)) {
					oSelectionVariant.addSelectOption("HistoricalTimeStamp", "I", "EQ", sHistoricalTimeStamp.toJSON());
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

			prefetchDone: function (oEvt) {},

			onSettingForBankAccountView: function (oEvent) {

				// create popover
				if (!this._oPopover) {
					this._oPopover = sap.ui.xmlfragment(this.getView().getId(), "fin.cash.flow.analyzer.view.fragment.DisplaySelectionPopover", this);
					this.getView().addDependent(this._oPopover);

					var fncall = function (oEvent1) {

						var defaultView = 0;

						defaultView = (this.getView().getModel("Scaling").getData().viewType) ? (this.getView().getModel("Scaling").getData().viewType) :
							0;

						var radioButtonGroup = this.getView().byId("rbg-viewType");
						radioButtonGroup.setSelectedIndex(parseInt(defaultView, 10));

						if (defaultView === 0) {
							this._oPopover.setInitialFocus("rb-cdisplay");
						} else if (defaultView === 1) {
							this._oPopover.setInitialFocus("rb-ddisplay");
						}

					};

					this._oPopover.attachBeforeOpen($.proxy(fncall, this));

				}

				// delay because addDependent will do a async rerendering and the actionSheet will immediately close without it.
				var oButton = oEvent.getSource();
				jQuery.sap.delayedCall(0, this, function () {
					this._oPopover.openBy(oButton);
				});

			},

			onPopOK: function (oEvent) {

				this._oPopover.close();
				//this.viewType = sap.ui.getCore().byId("rbg-viewType").getSelectedIndex() + 1;
				var model = this.getView().getModel("Scaling").getData();
				model.viewType = this.getView().byId("rbg-viewType").getSelectedIndex();
				var jsonmodel = new JSONModel(model);
				this.getView().setModel(jsonmodel, "Scaling");

				//this.getView().getModel("Scaling").setProperty("viewType", sap.ui.getCore().byId("rbg-viewType").getSelectedIndex() );
				this.oCurrSmartTable.rebindTable(true);
			},

			onPopCancel: function (oEvent) {
				this._oPopover.close();
			},

			onBeforeRendering: function () {
				var sCozyClass = "sapUiSizeCozy",
					sCompactClass = "sapUiSizeCompact",
					sCondensedClass = "sapUiSizeCondensed";
				if (jQuery(document.body).hasClass(sCompactClass) || this.getOwnerComponent().getContentDensityClass() === sCompactClass) {
					this.oCurrSmartTable.addStyleClass(sCondensedClass);
				} else if (jQuery(document.body).hasClass(sCozyClass) || this.getOwnerComponent().getContentDensityClass() === sCozyClass) {
					this.oCurrSmartTable.addStyleClass(sCozyClass);
				}
			},
			onOK: function (oEvent) {
				this.oCurrSmartTable.rebindTable(true);
			},
			onCancel: function (oEvent) {
				this.oCurrSmartTable.rebindTable(false);
			},

			onHandleSearchForHDC: function (oEvt) {

				var aFilters = [];
				var sValue = oEvt.getParameter("value");
				var oFilter = new sap.ui.model.Filter("WAERS", sap.ui.model.FilterOperator.Contains, sValue);
				aFilters.push(oFilter);
				var oBinding = oEvt.getSource().getBinding("items");
				oBinding.filter(aFilters);

			},
			onHandleSearchForCAL: function (oEvt) {

				var aFilters = [];
				var sValue = oEvt.getParameter("value");
				var oFilter = new sap.ui.model.Filter("IDENT", sap.ui.model.FilterOperator.Contains, sValue);
				aFilters.push(oFilter);
				var oBinding = oEvt.getSource().getBinding("items");
				oBinding.filter(aFilters);

			},
			onNextCycle: function () {
				this.onCalculateValueDate(true);
			},
			onPreviousCycle: function () {
				this.onCalculateValueDate(false);
			},

			onCalculateValueDate: function (sflag) {
				var sTimePeriod = this.getView().byId("idCyclePattern").getValue();
				var sHistoricalTimeStamp = this.getView().byId("idHistoricalTimeStamp").getDateValue();

				var sEndofPeriod = this.oCurrSmartFilterBar.getFilterData(true).EndofPeriod;
				var sCalendar = this.getView().getModel("Scaling").getData().factoryCalendarId;

				if (sEndofPeriod === "X" || sCalendar !== "*") {

					var oFieldMapping = this.getView().getModel("FieldMapping").oData;
					var sValueDate = new Date(oFieldMapping[oFieldMapping.length - 1].from);

				} else {

					sValueDate = new Date(this.oCurrSmartFilterBar.getFilterData().KeyDate);

					var sCycleArray = sTimePeriod.split('+');
					for (var i = 0; i < sCycleArray.length; i++) {
						if (sCycleArray[i][0] === 'Y') {

							var sYear = parseInt(sCycleArray[i].substring(1, sCycleArray[i].length, 10), 10);
							if (sflag === false) {
								sValueDate = new Date(sValueDate.setFullYear(sValueDate.getFullYear() - sYear));

							} else {
								sValueDate = new Date(sValueDate.setFullYear(sValueDate.getFullYear() + sYear));

							}

						} else if (sCycleArray[i][0] === 'Q') {

							var sMonth = parseInt(sCycleArray[i].substring(1, sCycleArray[i].length), 10) * 3;
							if (sflag === false) {
								sValueDate = new Date(sValueDate.setMonth(sValueDate.getMonth() - sMonth));

							} else {
								sValueDate = new Date(sValueDate.setMonth(sValueDate.getMonth() + sMonth));

							}

						} else if (sCycleArray[i][0] === 'M') {

							sMonth = parseInt(sCycleArray[i].substring(1, sCycleArray[i].length), 10);
							if (sflag === false) {
								sValueDate = new Date(sValueDate.setMonth(sValueDate.getMonth() - sMonth));

							} else {
								sValueDate = new Date(sValueDate.setMonth(sValueDate.getMonth() + sMonth));

							}

						} else if (sCycleArray[i][0] === 'W') {

							var sDay = parseInt(sCycleArray[i].substring(1, sCycleArray[i].length), 10) * 7;
							if (sflag === false) {
								sValueDate = new Date(sValueDate.setDate(sValueDate.getDate() - sDay));

							} else {
								sValueDate = new Date(sValueDate.setDate(sValueDate.getDate() + sDay));

							}

						} else if (sCycleArray[i][0] === 'D') {

							sDay = parseInt(sCycleArray[i].substring(1, sCycleArray[i].length), 10);
							if (sflag === false) {
								sValueDate = new Date(sValueDate.setDate(sValueDate.getDate() - sDay));

							} else {
								sValueDate = new Date(sValueDate.setDate(sValueDate.getDate() + sDay));

							}

						}
					}
				}
				this.onHanldeCycle(sValueDate, sTimePeriod, sHistoricalTimeStamp);
			},

			onHanldeCycle: function (oValueDate, sTimePeriod, sHistoricalTimeStamp) {
				var oSelectionVariants = new sap.ui.generic.app.navigation.service.SelectionVariant(this.oCurrSmartFilterBar.getDataSuiteFormat());
				if( oValueDate ) {
					oValueDate.toJSON = this.util.convertDateTimeToABAPDateTime;                         
				}
				var sValueDate = oValueDate;
				oSelectionVariants.removeSelectOption("KeyDate");
				oSelectionVariants.removeSelectOption("CyclePattern");
				oSelectionVariants.removeSelectOption("HistoricalTimeStamp");
				oSelectionVariants.removeParameter("KeyDate");
				oSelectionVariants.removeParameter("CyclePattern");
				oSelectionVariants.removeParameter("HistoricalTimeStamp");
				oSelectionVariants.addSelectOption("KeyDate", "I", "EQ", sValueDate.toJSON());
				oSelectionVariants.addSelectOption("CyclePattern", "I", "EQ", sTimePeriod);
				
				var sTempTimeStamp;
				if (this.util.isNull(sHistoricalTimeStamp)) {
					sTempTimeStamp = this.util.getHistoryDateTimeDefault();
				} else {
					sTempTimeStamp = sHistoricalTimeStamp;
				}
				oSelectionVariants.addSelectOption("HistoricalTimeStamp", "I", "EQ", sTempTimeStamp.toJSON());

				this.oCurrSmartFilterBar.setDataSuiteFormat(oSelectionVariants.toJSONString(), true);

				this.oCurrSmartTable.rebindTable(true);
			},

			handleCrossNav: function (oAppData, oURLParameters) {

				var sDate = this.util.getValueDateDefault();
				var sTimePeriod = "D7";
				var sHistoricalTimeStamp = this.util.getHistoryDateTimeDefault();
				if (this.getView().getViewName() === "fin.cash.flow.analyzer.view.Worklist_D") {
					this.onCycleHandle(this.getView().byId("idCyclePattern"));
					this.oSelectVariants = new sap.ui.generic.app.navigation.service.SelectionVariant(oAppData.selectionVariant);
					this.setVisibleforFilter(this.oSelectVariants);
				} else {
					if (oAppData.bNavSelVarHasDefaultsOnly === false) { //navigation from other applications
						this.oSelectVariants = new sap.ui.generic.app.navigation.service.SelectionVariant(oAppData.selectionVariant);

						this.oSelectVariants.addSelectOption("KeyDate", "I", "EQ", sDate);
						this.oSelectVariants.addSelectOption("CyclePattern", "I", "EQ", sTimePeriod);
						this.oSelectVariants.addSelectOption("ReleaseFlag", "I", "EQ", "0");
						this.getView().byId("idCyclePattern").setValue(sTimePeriod);

						this.oSelectVariants.addSelectOption("HistoricalTimeStamp", "I", "EQ", sHistoricalTimeStamp.toJSON());
						this.getView().byId("idHistoricalTimeStamp").setDateValue(sHistoricalTimeStamp);

						this.oSelectVariants.addSelectOption("ReconcliationStatus", "I", "EQ", "3");
						this.oSelectVariants.addSelectOption("ReconcliationStatus", "I", "EQ", "4");
						this.oSelectVariants.addSelectOption("DateIndicator", "I", "EQ", "1");

						// rename all fields for each applications
						if (this.oSelectVariants.getSelectOption("P_DisplayCurrency")) {
							this.oSelectVariants.renameSelectOption("P_DisplayCurrency", "DisplayCurrency");
						}
						if (this.oSelectVariants.getSelectOption("P_ExchangeRateType")) {
							this.oSelectVariants.renameSelectOption("P_ExchangeRateType", "ExRateType");
						}

						if (this.oSelectVariants.getSelectOption("Currency")) {
							this.oSelectVariants.renameSelectOption("Currency", "BankAccountCurrency");
						}

						if (this.oSelectVariants.getSelectOption("BankHeadquarter")) {
							this.oSelectVariants.renameSelectOption("BankHeadquarter", "BankGroup");
						}

						if (this.oSelectVariants.getSelectOption("AccountingDocumentType")) {
							this.oSelectVariants.renameSelectOption("AccountingDocumentType", "FiDocumentType");
						}

						this.oCurrSmartFilterBar.setDataSuiteFormat(this.oSelectVariants.toJSONString(), true);
						this.setVisibleforFilter(this.oSelectVariants);
					}

					if ((oAppData.bNavSelVarHasDefaultsOnly === true || oAppData.bNavSelVarHasDefaultsOnly === undefined) && this.oCurrSmartFilterBar.getCurrentVariantId() !==
						"") { //default variant works
						//do nothing load variant
					}

					if ((oAppData.bNavSelVarHasDefaultsOnly === true || oAppData.bNavSelVarHasDefaultsOnly === undefined) && this.oCurrSmartFilterBar.getCurrentVariantId() ===
						"") { //default value works
						this.oSelectVariants = new sap.ui.generic.app.navigation.service.SelectionVariant(oAppData.selectionVariant);

						this.oSelectVariants.addSelectOption("KeyDate", "I", "EQ", sDate);
						this.oSelectVariants.addSelectOption("CyclePattern", "I", "EQ", sTimePeriod);
						this.getView().byId("idCyclePattern").setValue(sTimePeriod);
						this.oSelectVariants.addSelectOption("ReleaseFlag", "I", "EQ", "0");

						this.oSelectVariants.addSelectOption("HistoricalTimeStamp", "I", "EQ", sHistoricalTimeStamp.toJSON());
						this.getView().byId("idHistoricalTimeStamp").setDateValue(sHistoricalTimeStamp);

						this.oSelectVariants.addSelectOption("ReconcliationStatus", "I", "EQ", "3");
						this.oSelectVariants.addSelectOption("ReconcliationStatus", "I", "EQ", "4");
						this.oSelectVariants.addSelectOption("DateIndicator", "I", "EQ", "1");

						// rename all fields for global default value
						if (this.oSelectVariants.getSelectOption("DisplayCurrency")) {
							this.oSelectVariants.addSelectOption("ExRateType", "I", "EQ", "M");
						}

						if (this.oSelectVariants.getSelectOption("Currency")) {
							this.oSelectVariants.renameSelectOption("Currency", "BankAccountCurrency");
						}

						if (this.oSelectVariants.getSelectOption("BankHeadquarter")) {
							this.oSelectVariants.renameSelectOption("BankHeadquarter", "BankGroup");
						}

						if (this.oSelectVariants.getSelectOption("AccountingDocumentType")) {
							this.oSelectVariants.renameSelectOption("AccountingDocumentType", "FiDocumentType");
						}

						this.oCurrSmartFilterBar.setDataSuiteFormat(this.oSelectVariants.toJSONString(), true);
						this.setVisibleforFilter(this.oSelectVariants);
					}
				}
				//if (this.oCurrSmartTable) {
				//	this.oCurrSmartTable.rebindTable(true);
				//}
			},

			setVisibleforFilter: function (oSelectVariants) {
				if (oSelectVariants.getSelectOption("Bank")) {
					this.byId("FBBank").setVisibleInAdvancedArea(true);
				}

				if (oSelectVariants.getSelectOption("BankCountry")) {
					this.byId("FBBankCountry").setVisibleInAdvancedArea(true);
				}

				if (oSelectVariants.getSelectOption("DisplayCurrency")) {
					this.byId("FBDisplayCurrency").setVisibleInAdvancedArea(true);
				}

				if (oSelectVariants.getSelectOption("BankGroup")) {
					this.byId("FBBankGroup").setVisibleInAdvancedArea(true);
				}

				if (oSelectVariants.getSelectOption("CertaintyLevel")) {
					this.byId("FBCertaintyLevel").setVisibleInAdvancedArea(true);
				}

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
			},
			
			onHandleBeforeExport: function(oEvent) {
				var aWorkbook = oEvent.getParameters().exportSettings.workbook;
				var j = 0, i = 0, k = 0;
				for(j=0; j<aWorkbook.columns.length; j++) {
					var columnName = aWorkbook.columns[j].property;
					if( columnName === "OverDue" || columnName.includes("Data") ) {
						//aWorkbook.columns[j].type = 'Number';
						//aWorkbook.columns[j].width = 25;
						//aWorkbook.columns[j].scale = 2;
						//aWorkbook.columns[j].delimiter = true;
						aWorkbook.columns[j].type = 'currency';
                        aWorkbook.columns[j].unitProperty = 'BankAccountCurrency';
                        aWorkbook.columns[j].displayUnit = true;
                        aWorkbook.columns[j].width = 25;
					}
					if(	columnName.includes("Data") ) {
						for(i=k; i< this.oCurrSmartTable.getTable().getColumns().length ; i++ )	{
							var property1 = this.oCurrSmartTable.getTable().getColumns()[i].getLeadingProperty();
							if(aWorkbook.columns[j].property === property1) {
								k = i;
								break;
							}
						}
						aWorkbook.columns[j].label = this.oCurrSmartTable.getTable().getColumns()[i].getMultiLabels()[0].getText();
					}
				}
				/*var j = 0;
				for (j = 0; j < aWorkbook.columns.length; j++) {
					if(aWorkbook.columns[j].label.substr(0,5) === "Cycle") {
						break;
					}
				}
				j--;	// setting the correct index
				for (var i = 0; i < this.oCycleData["results"].length; i++) {
					var sPatternItem = this.oCycleData["results"][i];
					var sStr = "";
					switch (sPatternItem.CYCLE_TYPE) {
						case 'D':
							sStr = this.util.dateFormat(sPatternItem.REP_DATE_F);
							break;
						case 'M':
							sStr = this.util.getMonth(sPatternItem.REP_DATE_F.getMonth() + 1).toString() + ", " + sPatternItem.REP_DATE_F.getFullYear().toString();
							break;
						case 'W':
							sStr = this.oResourceBundle.getText("Week") + this.util.getWeekNum(sPatternItem.REP_DATE_F).toString() + ", " + sPatternItem.REP_DATE_F.getFullYear().toString();
							break;
						case 'Q':
							sStr = this.util.getQuarter(sPatternItem.REP_DATE_F.getMonth() + 1).toString() + ", " + sPatternItem.REP_DATE_F.getFullYear().toString();
							break;
						case 'Y':
							sStr = sPatternItem.REP_DATE_F.getFullYear().toString();
							break;
						case 'A':
							sStr = this.oResourceBundle.getText("FUTURE");
							break;
						case 'B':
							sStr = this.oResourceBundle.getText("OVERDUE");
							break;
					}
					aWorkbook.columns[i+j].label = sStr;
				}*/
				oEvent.getParameters().exportSettings.workbook = aWorkbook;
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
				this.byId("FilterText").setText(this.byId("idsmartFilterBarItem").retrieveFiltersWithValuesAsText());
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