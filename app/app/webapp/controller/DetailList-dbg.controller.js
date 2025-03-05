/*
 * Copyright (C) 2009-2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"fin/cash/flow/analyzer/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"fin/cash/flow/analyzer/model/formatter",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/generic/app/navigation/service/SelectionVariant",
		"sap/ui/generic/app/navigation/service/NavigationHandler",
		"fin/cash/flow/analyzer/util/StringUtil",
		"fin/cash/flow/analyzer/util/ErrorHandler",
		"fin/cash/flow/analyzer/util/Conversions",
		"fin/cash/flow/analyzer/util/Formatter"
	],

	function (BaseController,
		JSONModel,
		formatter,
		Filter,
		FilterOperator,
		SelectionVariant,
		NavigationHandler,
		StringUtil,
		ErrorHandler,
		Conversions,
		Formatter) {
		"use strict";

		return BaseController.extend("fin.cash.flow.analyzer.controller.DetailList", {

			Conversions: Conversions,
			Formatter: Formatter,

			onInit: function () {
				this.oFilterStr = null;
				this.oSelRow = null;
				this.utilConversion = Conversions;
				this.oNavigationHandler = new NavigationHandler(this);
				this.oCurrSmartTable = this.getView().byId("idDetailListSmartTable");
				this.oCurrAnalyticalTable = this.getView().byId("idDetailListTable");
				this.oCurrSmartFilterBar = this.getView().byId("idDetailListSmartFilterBar");
				this.oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
				this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
				if (sap.ui.Device.system.desktop) {
					this.getView().addStyleClass("sapUiSizeCompact");
					this.oCurrSmartTable.addStyleClass("sapUiSizeCondensed");
				} else {
					this.getView().addStyleClass("sapUiSizeCozy");
					this.oCurrSmartTable.addStyleClass("sapUiSizeCozy");
				}
				var oPageModel = new sap.ui.model.json.JSONModel();
				this.getView().setModel(oPageModel, "page");
				this.getRouter().attachRoutePatternMatched(this.onRoutePatternMatched, this);
			},

			onRoutePatternMatched: function (oEvent) {
				var oHistory = sap.ui.core.routing.History.getInstance();
				if (oHistory.getDirection() === "Backwards" || oHistory.getDirection() === "Forwards" || (oHistory.getDirection() === "Unknown" &&
						oHistory.aHistory.length !== 1) || (oHistory.aHistory.length === 2 && oHistory.aHistory[1].substring(0, 1) === "L") || (oHistory.aHistory
						.length === 2 && oHistory.aHistory[1].substring(0, 1) === "B")) {
					return;
				}

				//Get title
				var sTitle = this.oResourceBundle.getText("DETAIL_PAGE_NAVIGATION_TITLE");
				this.getOwnerComponent().getService("ShellUIService").then(
					function (oShellUIService) {
						if (oShellUIService) {
							oShellUIService.setTitle(sTitle);
						}
					}
				);

				var oArguments = oEvent.getParameter("arguments");
				var oNaviParams = null;
				if (oArguments) {
					oNaviParams = JSON.parse(String.fromBase64URI(oArguments.Params));
				}
				oNaviParams = $.extend({
					pSelRow: null,
					pAmount: null,
					pSetting: null
				}, oNaviParams);
				this.oSelRow = oNaviParams.pSelRow;
				var oSelRow = this.oSelRow;

				//Get direction text and state
				this._getDirection(oSelRow);
				//Get amount
				oSelRow.Amount = oNaviParams.pAmount;
				//Get user settings
				oSelRow.Scaling = oNaviParams.pSetting.scaling;
				oSelRow.isBankCurrency = oNaviParams.pSetting.isBankCurrency;
				//ID+Text
				if (oSelRow.BankAccount !== undefined) {
					if (oSelRow.BankAccountName !== undefined && oSelRow.BankAccountName !== "") {
						oSelRow.FullBankAccount = oSelRow.BankAccount + " (" + oSelRow.BankAccountName + ")";
					} else {
						oSelRow.FullBankAccount = oSelRow.BankAccount;
					}
				}
				if (oSelRow.CompanyCode !== undefined) {
					if (oSelRow.CompanyCodeName !== undefined && oSelRow.CompanyCodeName !== "") {
						oSelRow.FullCompanyCode = oSelRow.CompanyCode + " (" + oSelRow.CompanyCodeName + ")";
					} else {
						oSelRow.FullCompanyCode = oSelRow.CompanyCode;
					}
				}
				if (oSelRow.BankGroup !== undefined) {
					if (oSelRow.BankGroupName !== undefined && oSelRow.BankGroupName !== "") {
						oSelRow.FullBankGroup = oSelRow.BankGroup + " (" + oSelRow.BankGroupName + ")";
					} else {
						oSelRow.FullBankGroup = oSelRow.BankGroup;
					}
				}
				if (oSelRow.DisplayPlanningLevel !== undefined) {
					if (oSelRow.PlanningLevelDesc !== undefined && oSelRow.PlanningLevelDesc !== "") {
						oSelRow.FullPlanningLevel = oSelRow.DisplayPlanningLevel + " (" + oSelRow.PlanningLevelDesc + ")";
					} else {
						oSelRow.FullPlanningLevel = oSelRow.DisplayPlanningLevel;
					}
				}
				if (oSelRow.CashPlanningGroup !== undefined) {
					if (oSelRow.CashPlanningGroupDesc !== undefined && oSelRow.CashPlanningGroupDesc !== "") {
						oSelRow.FullPlanningGroup = oSelRow.CashPlanningGroup + " (" + oSelRow.CashPlanningGroupDesc + ")";
					} else {
						oSelRow.FullPlanningGroup = oSelRow.CashPlanningGroup;
					}
				}
				if (oSelRow.LiquidityItem !== undefined) {
					if (oSelRow.LiquidityItemName !== undefined && oSelRow.LiquidityItemName !== "") {
						oSelRow.FullLiquidityItem = oSelRow.LiquidityItem + " (" + oSelRow.LiquidityItemName + ")";
					} else {
						oSelRow.FullLiquidityItem = oSelRow.LiquidityItem;
					}
				}

				//Set visible in page header
				this._setVisible(oSelRow.DirectionText, "idFlowDirection");
				this._setVisible(oSelRow.BankAccount, "idBankAccount");
				this._setVisible(oSelRow.CompanyCode, "idCompanyCode");
				this._setVisible(oSelRow.Bank, "idBank");
				this._setVisible(oSelRow.BankCountry, "idBankCountry");
				this._setVisible(oSelRow.BankGroup, "idBankGroup");
				this._setVisible(oSelRow.HouseBank, "idHouseBank");
				this._setVisible(oSelRow.HouseBankAccount, "idHouseBankAccount");
				this._setVisible(oSelRow.CertaintyLevel, "idCertaintyLevel");
				this._setVisible(oSelRow.DisplayPlanningLevel, "idPlanningLevel");
				this._setVisible(oSelRow.CashPlanningGroup, "idPlanningGroup");
				this._setVisible(oSelRow.LiquidityItem, "idLiquidityItem");
				this._setVisible(oSelRow.GLAccount, "idGLAccount");
				this._setVisible(oSelRow.ProfitCenter, "idProfitCenter");
				this._setVisible(oSelRow.BusinessArea, "idBusinessArea");
				this._setVisible(oSelRow.PaymentMethod, "idPaymentMethod");
				this._setVisible(oSelRow.Segment, "idSegment");
				this._setVisible(oSelRow.SummarizationTerm, "idSummarizationTerm");
				this._setVisible(oSelRow.TradingPartner, "idTradingPartner");

				if (this.oCurrSmartFilterBar.isInitialised() === true && !this.oShareActionSheet === true) {
					this._initSmartFilterBar();
				}
			},

			onInitSmartFilterBar: function () {
				if (this.oCurrSmartFilterBar.isInitialised() === true) {
					this._initSmartFilterBar();
				}
			},

			_initSmartFilterBar: function () {
				var that = this;
				var oSmartFilterBar = that.getView().byId("idDetailListSmartFilterBar");
				var oSelRow = that.oSelRow;
				var oParseNavigationPromise = that.oNavigationHandler.parseNavigation();
				var dTimeStamp = that.utilConversion.getHistoryDateTimeDefault();

				oParseNavigationPromise.done(function (oAppData, oURLParameters, sNavType) {
					var oSelectVariant = null;
					if (sNavType === sap.ui.generic.app.navigation.service.NavType.iAppState) {
						oSelectVariant = new SelectionVariant(oAppData.selectionVariant);
					} else {
						oSelectVariant = that.getOwnerComponent().getSelectionVariant();
						oSelectVariant.removeParameter("CyclePattern");
						oSelectVariant.removeParameter("TransferFrom");
						oSelectVariant.removeParameter("TransferTo");
						oSelectVariant.removeParameter("preferredMode");
						oSelectVariant.removeParameter("ReleaseFlag");
						oSelectVariant.renameParameter("HistoricalTimeStamp", "SnapshotTimestamp");
						oSelectVariant.removeParameter("LiquidityHierarchyName");
						oSelectVariant.removeParameter("DisplayCurrency");
						oSelectVariant.renameSelectOption("AccId", "BankAccountInternalID");
						oSelectVariant.renameSelectOption("BankAccount", "BankAccountNumber");
						oSelectVariant.renameSelectOption("ReconcliationStatus", "ReconciliationStatus");
						oSelectVariant.addSelectOption("ReconciliationStatus", "I", "EQ", "0");
						//change value date format
						var aValueDate = oSelectVariant.getSelectOption("ValueDate");
						oSelectVariant.removeSelectOption("ValueDate");
						oSelectVariant.addSelectOption("ValueDate", "I", "BT", aValueDate[0].Low.substring(0, aValueDate[0].Low.length - 1), aValueDate[
							0].High.substring(0, aValueDate[0].High.length - 1));

						if (oSelRow.BankAccountGroup !== undefined) {
							var sSortOrder = oSelRow.sortid + "%";
							oSelectVariant.addParameter("SortOrder", sSortOrder);
						}
						if (oSelRow.Direction !== undefined) {
							oSelectVariant.addParameter("Direction", oSelRow.Direction);
						}
						if (oSelRow.AccId !== undefined) {
							oSelectVariant.removeSelectOption("BankAccountInternalID");
							oSelectVariant.addParameter("BankAccountInternalID", oSelRow.AccId);
						}
						if (oSelRow.Bank !== undefined) {
							oSelectVariant.removeSelectOption("Bank");
							oSelectVariant.addParameter("Bank", oSelRow.Bank);
						}
						if (oSelRow.BankAccount !== undefined) {
							oSelectVariant.removeSelectOption("BankAccountNumber");
							oSelectVariant.addParameter("BankAccountNumber", oSelRow.BankAccount);
						}
						if (oSelRow.BankAccountCurrency !== undefined) {
							switch (oSelRow.isBankCurrency) {
							case "":
								oSelectVariant.addParameter("TransactionCurrency", oSelRow.BankAccountCurrency);
								break;
							case "X":
								oSelectVariant.addParameter("AccountCurrency", oSelRow.BankAccountCurrency);
								break;
							case "L":
								oSelectVariant.addParameter("CompanyCodeCurrency", oSelRow.BankAccountCurrency);
								break;
							}
							oSelectVariant.removeParameter("Currency");
							oSelectVariant.removeParameter("BankAccountCurrency");
							oSelectVariant.removeParameter("LocalCurrency");
							oSelectVariant.removeSelectOption("Currency");
							oSelectVariant.removeSelectOption("BankAccountCurrency");
							oSelectVariant.removeSelectOption("LocalCurrency");
						}
						if (oSelRow.BankAccountCurrency === undefined && oSelRow.DisplayCurrency !== undefined) {
							switch (oSelRow.isBankCurrency) {
							case "":
								oSelectVariant.renameParameter("Currency", "TransactionCurrency");
								oSelectVariant.renameParameter("BankAccountCurrency", "TransactionCurrency");
								oSelectVariant.renameParameter("LocalCurrency", "TransactionCurrency");
								oSelectVariant.renameSelectOption("Currency", "TransactionCurrency");
								oSelectVariant.renameSelectOption("BankAccountCurrency", "TransactionCurrency");
								oSelectVariant.renameSelectOption("LocalCurrency", "TransactionCurrency");
								break;
							case "X":
								oSelectVariant.renameParameter("Currency", "AccountCurrency");
								oSelectVariant.renameParameter("BankAccountCurrency", "AccountCurrency");
								oSelectVariant.renameParameter("LocalCurrency", "AccountCurrency");
								oSelectVariant.renameSelectOption("Currency", "AccountCurrency");
								oSelectVariant.renameSelectOption("BankAccountCurrency", "AccountCurrency");
								oSelectVariant.renameSelectOption("LocalCurrency", "AccountCurrency");
								break;
							case "L":
								oSelectVariant.renameParameter("Currency", "CompanyCodeCurrency");
								oSelectVariant.renameParameter("BankAccountCurrency", "CompanyCodeCurrency");
								oSelectVariant.renameParameter("LocalCurrency", "CompanyCodeCurrency");
								oSelectVariant.renameSelectOption("Currency", "CompanyCodeCurrency");
								oSelectVariant.renameSelectOption("BankAccountCurrency", "CompanyCodeCurrency");
								oSelectVariant.renameSelectOption("LocalCurrency", "CompanyCodeCurrency");
								break;
							}
						}
						if (oSelRow.BankCountry !== undefined) {
							oSelectVariant.removeSelectOption("BankCountry");
							oSelectVariant.addParameter("BankCountry", oSelRow.BankCountry);
						}
						if (oSelRow.BankGroup !== undefined) {
							oSelectVariant.removeSelectOption("BankGroup");
							oSelectVariant.addParameter("BankGroup", oSelRow.BankGroup);
						}
						if (oSelRow.BusinessArea !== undefined) {
							oSelectVariant.removeSelectOption("BusinessArea");
							oSelectVariant.addParameter("BusinessArea", oSelRow.BusinessArea);
						}
						if (oSelRow.CashPlanningGroup !== undefined) {
							oSelectVariant.removeSelectOption("CashPlanningGroup");
							oSelectVariant.addParameter("CashPlanningGroup", oSelRow.CashPlanningGroup);
						}
						if (oSelRow.CertaintyLevel !== undefined) {
							oSelectVariant.removeSelectOption("CertaintyLevel");
							oSelectVariant.addParameter("CertaintyLevel", oSelRow.CertaintyLevel);
						}
						if (oSelRow.CompanyCode !== undefined) {
							oSelectVariant.removeSelectOption("CompanyCode");
							oSelectVariant.addParameter("CompanyCode", oSelRow.CompanyCode);
						}
						if (oSelRow.DisplayPlanningLevel !== undefined) {
							oSelectVariant.removeSelectOption("DisplayPlanningLevel");
							oSelectVariant.addParameter("DisplayPlanningLevel", oSelRow.DisplayPlanningLevel);
						}
						if (oSelRow.GLAccount !== undefined) {
							oSelectVariant.removeSelectOption("GLAccount");
							oSelectVariant.addParameter("GLAccount", oSelRow.GLAccount);
						}
						if (oSelRow.HouseBank !== undefined) {
							oSelectVariant.removeSelectOption("HouseBank");
							oSelectVariant.addParameter("HouseBank", oSelRow.HouseBank);
						}
						if (oSelRow.HouseBankAccount !== undefined) {
							oSelectVariant.removeSelectOption("HouseBankAccount");
							oSelectVariant.addParameter("HouseBankAccount", oSelRow.HouseBankAccount);
						}
						if (oSelRow.PaymentMethod !== undefined) {
							oSelectVariant.removeSelectOption("PaymentMethod");
							oSelectVariant.addParameter("PaymentMethod", oSelRow.PaymentMethod);
						}
						if (oSelRow.LiquidityItem !== undefined) {
							oSelectVariant.removeSelectOption("LiquidityItem");
							oSelectVariant.addParameter("LiquidityItem", oSelRow.LiquidityItem);
						}
						if (oSelRow.ProfitCenter !== undefined) {
							oSelectVariant.removeSelectOption("ProfitCenter");
							oSelectVariant.addParameter("ProfitCenter", oSelRow.ProfitCenter);
						}
						if (oSelRow.Segment !== undefined) {
							oSelectVariant.removeSelectOption("Segment");
							oSelectVariant.addParameter("Segment", oSelRow.Segment);
						}
						if (oSelRow.SummarizationTerm !== undefined) {
							oSelectVariant.removeSelectOption("SummarizationTerm");
							oSelectVariant.addParameter("SummarizationTerm", oSelRow.SummarizationTerm);
						}
						if (oSelRow.TradingPartner !== undefined) {
							oSelectVariant.removeSelectOption("TradingPartner");
							oSelectVariant.addParameter("TradingPartner", oSelRow.TradingPartner);
						}
					}

					var aValueDate = oSelectVariant.getSelectOption("ValueDate");
					if (aValueDate[0].Low === aValueDate[0].High) {
						oSelRow.SelDate = that.Formatter.formatDate(new Date(Date.parse(aValueDate[0].Low)));
					} else {
						oSelRow.SelDate = that.Formatter.formatDate(new Date(Date.parse(aValueDate[0].Low))) + " - " + that.Formatter.formatDate(new Date(
							Date.parse(aValueDate[0].High)));
					}
					var sDateIndicator = oSelectVariant.getParameter("DateIndicator");
					if (sDateIndicator === "2") {
						oSelRow.SelDateLabel = that.oResourceBundle.getText("POSTING_DATE");
					} else {
						oSelRow.SelDateLabel = that.oResourceBundle.getText("VALUE_DATE");
					}

					//Get snapshot time
					var sTimeStamp = oSelectVariant.getParameter("SnapshotTimestamp");
					if (sTimeStamp) {
						dTimeStamp = new Date(Date.parse(sTimeStamp));
					}
					that.getView().byId("dtpSnapshotTimestamp").setDateValue(dTimeStamp);
					
					//Get Exchange Rate Type
					var sExRateType = oSelectVariant.getParameter("ExRateType");
					if (sExRateType) {
						oSelRow.ExRateType = sExRateType;
					}
					
					//Set model for page header
					var oRowModel = new JSONModel(oSelRow);
					that.getView().setModel(oRowModel, "selRow");

					//Save AppState
					if (!oAppData.selectionVariant) {
						that.storeNewAppState(oSelectVariant);
					}
					oSmartFilterBar.setDataSuiteFormat(oSelectVariant.toJSONString(), true);
					oSmartFilterBar.search();
				});
			},

			storeNewAppState: function (oSelectionVariant) {
				var oAppStatePromise = this.oNavigationHandler.storeInnerAppState({
					selectionVariant: oSelectionVariant.toJSONString()
				});
				var that = this;
				oAppStatePromise.fail(function (oError) {
					that.arOwnerFilters(oError);
				});
			},

			onHandleBeforeRebindTable: function (oEvent) {
				var oBindingParams = oEvent.getParameter("bindingParams");
				var dTimeStamp = this.getView().byId("dtpSnapshotTimestamp").getDateValue();
				oBindingParams.filters.push(new sap.ui.model.Filter("SnapshotTimestamp", "EQ", this.utilConversion.formatUTCDateString(dTimeStamp)));
				oBindingParams.parameters.autoExpandMode = "Sequential";
				oBindingParams.parameters.provideGrandTotals = true;
				if (oBindingParams.parameters.select) {
					this.byId("idColumnCompanyCodeName").setInResult(false);
					this.byId("idColumnGLAccountName").setInResult(false);
					this.byId("idColumnLiquidityItemName").setInResult(false);
					this.byId("idColumnPlanningLevelName").setInResult(false);
					this.byId("idColumnCashPlanningGroupName").setInResult(false);
					this.byId("idColumnCustomerName").setInResult(false);
					this.byId("idColumnSupplierName").setInResult(false);
					this.byId("idColumnBankAccountDescription").setInResult(false);
					this.byId("idColumnPaymentMethodName").setInResult(false);
					this.byId("idColumnCertaintyLevelName").setInResult(false);
					var sel_elem = oBindingParams.parameters.select.split(",");
					for (var i = 0; i < sel_elem.length; i++) {
						if (sel_elem[i] === "CompanyCode") {
							this.byId("idColumnCompanyCodeName").setInResult(true);
						}
						if (sel_elem[i] === "GLAccount") {
							this.byId("idColumnGLAccountName").setInResult(true);
						}
						if (sel_elem[i] === "LiquidityItem") {
							this.byId("idColumnLiquidityItemName").setInResult(true);
						}
						if (sel_elem[i] === "DisplayPlanningLevel") {
							this.byId("idColumnPlanningLevelName").setInResult(true);
						}
						if (sel_elem[i] === "CashPlanningGroup") {
							this.byId("idColumnCashPlanningGroupName").setInResult(true);
						}
						if (sel_elem[i] === "Customer") {
							this.byId("idColumnCustomerName").setInResult(true);
						}
						if (sel_elem[i] === "Supplier") {
							this.byId("idColumnSupplierName").setInResult(true);
						}
						if (sel_elem[i] === "BankAccountNumber") {
							this.byId("idColumnBankAccountDescription").setInResult(true);
						}
						if (sel_elem[i] === "PaymentMethod") {
							this.byId("idColumnPaymentMethodName").setInResult(true);
						}
						if (sel_elem[i] === "CertaintyLevel") {
							this.byId("idColumnCertaintyLevelName").setInResult(true);
						}
					}
				}
			},

			onPressNavigation: function (oEvent) {
				var sExRateType = "M";
				var oContext = oEvent.getSource().getBindingContext();
				if (!oContext) {
					return;
				}
				var oBinding = oContext.getModel().getProperty(oContext.getPath());
				if (oBinding.AmountInTransactionCurrency && oBinding.AmountInTransactionCurrency === 0 ) {
					sap.m.MessageBox.warning(this.oResourceBundle.getText("MSG_UNRLZE_NOT_SUPPORT"));
					return;
				}
				if (this.oSelRow.ExRateType) {
					sExRateType = this.oSelRow.ExRateType;
				}
				var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
				if (oCrossAppNavigator) {
					var sHash = oCrossAppNavigator.hrefForExternal({
						target: {
							semanticObject: "BankAccount",
							action: "analyzePaymentDetails"
						},
						params: {
							OriginApplication: oBinding.OriginApplication,
							OriginDocument: oBinding.OriginDocumentID,
							CashFlow: oBinding.OriginFlowID,
							OriginSystem: oBinding.OriginSystem,
							OriginTransactionQualifier: oBinding.OriginTransQualifier,
							OriginTransaction: oBinding.OriginTransactionID,
							ExchangeRateType: sExRateType,
							CashFlowSnapshotDateTime: this.getView().byId("dtpSnapshotTimestamp").getDateValue(),
							preferredMode: "display",
							"sap-ushell-navmode": "explace"
						}
					}) || "";
					sap.m.URLHelper.redirect(window.location.href.split('#')[0] + sHash, true);
				}
			},

			_setVisible: function (sValue, sId) {
				if (sValue !== undefined) {
					this.byId(sId).setVisible(true);
				} else {
					this.byId(sId).setVisible(false);
				}
			},

			_getDirection: function (oSelRow) {
				var sDirectionText = "";
				var sDirectionState = "";
				if (oSelRow.Direction !== undefined) {
					if (oSelRow.Direction === "+") {
						sDirectionText = this.oResourceBundle.getText("INFLOW");
						sDirectionState = "Success";
					} else if (oSelRow.Direction === "-") {
						sDirectionText = this.oResourceBundle.getText("OUTFLOW");
						sDirectionState = "Error";
					}
				}
				if (oSelRow.ViewTypeExt !== undefined) {
					if (oSelRow.ViewTypeExt === "1BEG_BAL") {
						sDirectionText = this.oResourceBundle.getText("BEGINNINGBAL");
						sDirectionState = "None";
					} else if (oSelRow.ViewTypeExt === "3END_BAL") {
						sDirectionText = this.oResourceBundle.getText("ENDINGBAL");
						sDirectionState = "None";
					}
				}
				if (sDirectionText) {
					oSelRow.DirectionText = sDirectionText;
					oSelRow.DirectionState = sDirectionState;
				} else {
					oSelRow.DirectionState = "None";
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
				this.oShareActionSheet.openBy(oEvent.getSource());
			}

		});
	});