/*
 * Copyright (C) 2009-2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object",
	"sap/m/MessageBox",
	"sap/ui/generic/app/navigation/service/NavigationHandler",
	"sap/ui/generic/app/navigation/service/SelectionVariant"

], function(Object, MessageBox, NavigationHandler, SelectionVariant) {
	"use strict";

	return {

		//************************************************************************************************************************
		// handle external navigation by link event
		//************************************************************************************************************************
		onBeforePopoverOpens: function(oEvent, that) {

			var oParameters = oEvent.getParameters();
			var oSource = oEvent.getSource();
			var sId = oParameters.originalId;

			var oSelectVariants = new sap.ui.generic.app.navigation.service.SelectionVariant(that.oCurrSmartFilterBar.getDataSuiteFormat());

			this.processNullNaviValue(sId, oSelectVariants, oSource, that);

			this.addMoreNavParameters(oParameters, oSelectVariants, that);

			this.addCurrency(oSelectVariants, oParameters, that);

			var noNav = this.setDateForDiffPaymentDay(oParameters, oSelectVariants, oSource, that);

			if(that.getView().byId(oParameters.originalId)){
				this.setOverduePlanningLevel(oParameters, oSelectVariants, oSource, that);
			}

			this.removeNotUsedContextNavParameters(oParameters);

			this.mapFieldsToCCFI(oParameters, oSelectVariants, oSource, that);

			//Cash Request
			this.mapFieldsToCashRequest(oParameters, oSelectVariants, oSource, that);

			this.deriveLiquidityItem(oSelectVariants, oParameters, that);

			// this.saveAppState(oEvent, that);

			// set is nav flag for navigation
			oParameters.semanticAttributes.noNav = noNav;

			that.oNavigationHandler.processBeforeSmartLinkPopoverOpens(oParameters, oSelectVariants.toJSONString(), this.oInnerAppData);

		},

		onTargetObtained: function(oEvent, that) {
			var oParameters = oEvent.getParameters();
			var oSource = oEvent.getSource();

			var oAcceptAction = [];
			var oForm = this.addContentToPopOver(oParameters, oSource, that);

			if ((oParameters.semanticAttributes.noNav && oSource.getText() === "-") ||
				(that.getView().getViewName() === "fin.cash.flow.analyzer.view.LiquidityItemHierarchy" && oParameters.semanticAttributes.IsData !==
					"X")) {
				oParameters.actions = oAcceptAction;
			} else {

				jQuery.each(oParameters.actions, function(index, value) {
					var str = value.getHref();

					if (that.getView().getViewName() !== "fin.cash.flow.analyzer.view.LiquidityItemHierarchy") {
						if ((str.search(/BankAccount-transferFrom\?/) !== -1) || (str.search(/BankAccount-transferTo\?/) !== -1)) {
							oAcceptAction.push(value);
						}
					}

					// if (!(oParameters.semanticAttributes.ViewTypeExt === "2FLOWS" && oSource.getProperty("fieldName") === "Data1")) {
					/*if ((str.search(/BankAccount-analyzePaymentDetails\?/) !== -1)) {
						oAcceptAction.push(value);
					}*/
					// }

					//Cash Request
					if ((str.search(/BankAccount-createCashRequestReceiving\?/) !== -1)) {
						oAcceptAction.push(value);
					}
					if ((str.search(/BankAccount-createCashRequestSending\?/) !== -1)) {
						oAcceptAction.push(value);
					}
					
					//MMF
					if ((str.search(/BankAccount-createMMFCashRequestReceiving\?/) !== -1)) {
						oAcceptAction.push(value);
					}
					if ((str.search(/BankAccount-createMMFCashRequestSending\?/) !== -1)) {
						oAcceptAction.push(value);
					}
				});
				
				var oSelVariant = new sap.ui.generic.app.navigation.service.SelectionVariant(that.oCurrSmartFilterBar.getDataSuiteFormat());
				var isBankCurrency = that.getView().getModel("Scaling").getData().isBankCurrency;
				oParameters.actions = this.provideAdditionalParameter(oAcceptAction, oSelVariant, isBankCurrency);

			}

			// set name for navigation popover 
			var sPopOverName = "";
			if (oSource.getProperty("text")) {
				sPopOverName = oSource.getProperty("text");
			}

			oParameters.show(sPopOverName, null, oParameters.actions, oForm);

		},

		onPopoverLinkPressed: function(oEvent, that) {

		},

		// handle navigation enhancement for BankAccount 
		onBeforePopoverOpensBACC: function(oEvent, that) {

			var oParameters = oEvent.getParameters();

			if (that.sHierType === "BKH") {

				if (oParameters.semanticAttributes.isData && oParameters.semanticAttributes.isData === "X" && oParameters.semanticAttributes.newDataNode !==
					true) {

					var oSelectVariants = new sap.ui.generic.app.navigation.service.SelectionVariant(that.oCurrSmartFilterBar.getDataSuiteFormat());

					this.addMoreNavParametersBACC(oParameters, oSelectVariants);

					this.removeNotUsedContextNavParameters(oParameters);

					that.oNavigationHandler.processBeforeSmartLinkPopoverOpens(oParameters, oSelectVariants.toJSONString(), this.oInnerAppData);
				}

			} else {

				oSelectVariants = new sap.ui.generic.app.navigation.service.SelectionVariant(that.oCurrSmartFilterBar.getDataSuiteFormat());

				this.addMoreNavParametersBACC(oParameters, oSelectVariants);

				this.removeNotUsedContextNavParameters(oParameters);

				that.oNavigationHandler.processBeforeSmartLinkPopoverOpens(oParameters, oSelectVariants.toJSONString(), this.oInnerAppData);

			}

		},

		onTargetObtainedBACC: function(oEvent, that) {
			var oParameters = oEvent.getParameters();
			var oSource = oEvent.getSource();

			var oAcceptAction = [];
			var oForm = new sap.ui.layout.form.SimpleForm({
				ColumnsL: 2
			});
			oForm.setLayout("ResponsiveGridLayout");

			jQuery.each(oParameters.actions, function(index, value) {
				var str = value.getHref();

				if (str.search(/BankStatement-manage/) !== -1) {

					// value.setProperty("text", that.oResourceBundle.getText("BS_MONITOR"));
					oAcceptAction.push(value);
				}

				if (str.search(/BankAccount-manageMasterData\?/) !== -1) {

					oAcceptAction.push(value);
				}

			});

			oParameters.actions = this.provideAdditionalParameterBACC(oAcceptAction);

			// set name for navigation popover 
			var sPopOverName = "";
			if (oSource.getProperty("text")) {
				sPopOverName = oSource.getProperty("text");
			}

			oParameters.show(sPopOverName, null, oParameters.actions, oForm);

		},

		onPopoverLinkPressedBACC: function(oEvent, that) {

		},

		// handle navigation enhancement for Bank
		onBeforePopoverOpensBANK: function(oEvent, that) {

			var oParameters = oEvent.getParameters();
			var oSource = oEvent.getSource();
			var sId = oParameters.originalId;

			var oSelectVariants = new sap.ui.generic.app.navigation.service.SelectionVariant(that.oCurrSmartFilterBar.getDataSuiteFormat());

			this.addMoreNavParametersBACC(oParameters, oSelectVariants);

			this.removeNotUsedContextNavParameters(oParameters);

			that.oNavigationHandler.processBeforeSmartLinkPopoverOpens(oParameters, oSelectVariants.toJSONString(), this.oInnerAppData);

		},

		onTargetObtainedBANK: function(oEvent, that) {
			var oParameters = oEvent.getParameters();
			var oSource = oEvent.getSource();

			var oAcceptAction = [];
			var oForm = new sap.ui.layout.form.SimpleForm({
				ColumnsL: 2
			});
			oForm.setLayout("ResponsiveGridLayout");

			jQuery.each(oParameters.actions, function(index, value) {
				var str = value.getHref();

				if (str.search(/BankAccount-manageBank\?/) !== -1) {

					oAcceptAction.push(value);
				}

			});

			oParameters.actions = this.provideAdditionalParameterBACC(oAcceptAction);

			// set name for navigation popover 
			var sPopOverName = "";
			if (oSource.getProperty("text")) {
				sPopOverName = oSource.getProperty("text");
			}

			oParameters.show(sPopOverName, null, oParameters.actions, oForm);

		},

		onPopoverLinkPressedBANK: function(oEvent, that) {

		},
		
		onTargetObtainedCommon: function(oEvent, that) {
			var oParameters = oEvent.getParameters();
			var oSource = oEvent.getSource();
			var oAcceptAction = [];
			var oForm = new sap.ui.layout.form.SimpleForm({
				ColumnsL: 2
			});
			oForm.setLayout("ResponsiveGridLayout");
			jQuery.each(oParameters.actions, function(index, value) {
				oAcceptAction.push(value);
			});
			oParameters.actions = this.provideAdditionalParameterBACC(oAcceptAction);
			// set name for navigation popover 
			var sPopOverName = "";
			if (oSource.getProperty("text")) {
				sPopOverName = oSource.getProperty("text");
			}
			oParameters.show(sPopOverName, null, oParameters.actions, oForm);
		},
		
		//************************************************************************************************************************
		// define method
		//************************************************************************************************************************

		processNullNaviValue: function(sId, oSelectionVariant, oSource, that) {

			// to get the instance of current smart link
			var oSmartLink = that.getView().byId(sId);
			if (oSmartLink) {
				var oContext = oSmartLink.getBindingContext();
				// to get the original semantic naviagtion fields
				var oSourceObject = oContext.getObject(oContext.getPath());
				// var aGroupedColumns = this.getGroupedCollumns();

				if (oSourceObject.BankAccount === "") {
					if (oSelectionVariant.getSelectOption("BankAccount")) {
						oSelectionVariant.removeSelectOption("BankAccount");
					}
					oSelectionVariant.addSelectOption("BankAccount", "I", "EQ", "");
				}

				if (oSourceObject.GLAccount === "") {
					if (oSelectionVariant.getSelectOption("GLAccount")) {
						oSelectionVariant.removeSelectOption("GLAccount");
					}
					oSelectionVariant.addSelectOption("GLAccount", "I", "EQ", "");
				}
			}
		},

		addMoreNavParameters: function(oParameters, oSelectionVariant, that) {
			oSelectionVariant.addParameter("TransferFrom", "X");
			oSelectionVariant.addParameter("TransferTo", "X");

			oSelectionVariant.addParameter("preferredMode", "create");

			var CurrentViewName = that.getView().getViewName();
			var historyTimeStamp = new Date();
			switch (CurrentViewName) {
				case "fin.cash.flow.analyzer.view.Worklist_D":
				case "fin.cash.flow.analyzer.view.Worklist":
					historyTimeStamp = that.getView().byId("idHistoricalTimeStamp").getDateValue();
					break;
				case "fin.cash.flow.analyzer.view.BankAccountHierarchy":
					historyTimeStamp = that.getView().byId("idHistoricalTimeStampForBA").getDateValue();
					break;
				case "fin.cash.flow.analyzer.view.LiquidityItemHierarchy":
					historyTimeStamp = that.getView().byId("idHistoricalTimeStampForLQ").getDateValue();
					break;
			}

			//var historyTimeStamp = that.getView().byId("idHistoricalTimeStamp").getDateValue();
			//			oSelectionVariant.addParameter("HistoricalTimeStamp", historyTimeStamp.toJSON());
			if (historyTimeStamp === undefined || historyTimeStamp === "" || historyTimeStamp === null) {
				historyTimeStamp = new Date();
			}
			oSelectionVariant.addParameter("HistoricalTimeStamp", historyTimeStamp.toJSON());

			// var sKeyDate = oSelectionVariant.getParameter("KeyDate");
			// oSelectionVariant.addSelectOption("ValueDate", "I", "BT", sKeyDate, sKeyDate);
			
			var releaseFlag = oSelectionVariant.getParameter("ReleaseFlag");
			if(releaseFlag === undefined){
					oSelectionVariant.addParameter("ReleaseFlag", "1");
			}
			
			if (oParameters.semanticAttributes.Direction) {
				if (oParameters.semanticAttributes.Direction === "+") {
					oSelectionVariant.addParameter("InflowIndicator", "2");
				} else {
					oSelectionVariant.addParameter("InflowIndicator", "3");
				}
			}

			// sort order should be taken from BKH
			if (oSelectionVariant.getParameter("BankAccountGroup") && that.SortOrder != undefined) {
				oParameters.semanticAttributes.sortid = that.SortOrder;
			} else if (oParameters.semanticAttributes.sortid) {
				if (oParameters.semanticAttributes.newDataNode === true) {
					var lastDot = oParameters.semanticAttributes.sortid.lastIndexOf(".");
					oParameters.semanticAttributes.sortid = oParameters.semanticAttributes.sortid.substring(0, lastDot);
				}

			}

		},

		addMoreNavParametersBACC: function(oParameters, oSelectionVariant) {

			if (oParameters.semanticAttributes.Bank) {
				oParameters.semanticAttributes.BankInternalId = oParameters.semanticAttributes.Bank;
			}

			if (oParameters.semanticAttributes.AccId) {
				oParameters.semanticAttributes.BankAccountInternalID = oParameters.semanticAttributes.AccId;
			}

			oParameters.semanticAttributes.BankAccountRevision = "0000";
			oParameters.semanticAttributes.DraftUUID = "00000000-0000-0000-0000-000000000000";
			oParameters.semanticAttributes.IsActiveEntity = true;
		},

		addCurrency: function(oSelectionVariant, oParameters, that) {

			// if (that.rbIsBankCurrency) {
			var isBankCurrency = that.getView().getModel("Scaling").getData().isBankCurrency;
			if (that.sHierType === "BKH") {
				isBankCurrency = "X";
			}
			if (isBankCurrency === "X") {
				if (!oSelectionVariant.getSelectOption("BankAccountCurrency")) {
					if (oParameters.semanticAttributes.BankAccountCurrency) {
						oSelectionVariant.addParameter("BankAccountCurrency", oParameters.semanticAttributes.BankAccountCurrency);
					} else if (oParameters.semanticAttributes.Currency) {
						oSelectionVariant.addParameter("BankAccountCurrency", oParameters.semanticAttributes.Currency);
					}
				}
			} else {
				if (!oSelectionVariant.getSelectOption("Currency")) {
					if (oParameters.semanticAttributes.BankAccountCurrency) {
						if (isBankCurrency === "L") {
							oSelectionVariant.addParameter("LocalCurrency", oParameters.semanticAttributes.BankAccountCurrency);
						} else {
							oSelectionVariant.addParameter("Currency", oParameters.semanticAttributes.BankAccountCurrency);
						}
					} else if (oParameters.semanticAttributes.Currency) {
						if (isBankCurrency === "L") {
							oSelectionVariant.addParameter("LocalCurrency", oParameters.semanticAttributes.Currency);
						} else {
							oSelectionVariant.addParameter("Currency", oParameters.semanticAttributes.Currency);
						}
						if (oSelectionVariant.getSelectOption("BankAccountCurrency")) {
							oSelectionVariant.removeSelectOption("BankAccountCurrency");
						}
					} else if (oSelectionVariant.getSelectOption("BankAccountCurrency")) {
						var sBACurrency = oSelectionVariant.getSelectOption("BankAccountCurrency");
						if (isBankCurrency === "L") {
							oSelectionVariant.massAddSelectOption("LocalCurrency", sBACurrency);
						} else {
							oSelectionVariant.massAddSelectOption("Currency", sBACurrency);
						}
						if (oSelectionVariant.getSelectOption("BankAccountCurrency")) {
							oSelectionVariant.removeSelectOption("BankAccountCurrency");
						}
					}

					if (oParameters.semanticAttributes.BankAccountCurrency !== "" && oParameters.semanticAttributes.BankAccountCurrency !== undefined) {
						delete oParameters.semanticAttributes.BankAccountCurrency;

						if (oSelectionVariant.getSelectOption("BankAccountCurrency")) {
							oSelectionVariant.removeSelectOption("BankAccountCurrency");
						}
					}

				} else if (oParameters.semanticAttributes.BankAccountCurrency) {
					if (isBankCurrency === "L") {
						oSelectionVariant.addParameter("LocalCurrency", oParameters.semanticAttributes.BankAccountCurrency);
					} else {
						oSelectionVariant.addParameter("Currency", oParameters.semanticAttributes.BankAccountCurrency);
					}
					delete oParameters.semanticAttributes.BankAccountCurrency;
				}

			}

		},

		deriveLiquidityItem: function(oSelectionVariant, oParameters, that) {

			if (that.getView().getViewName() === "fin.cash.flow.analyzer.view.LiquidityItemHierarchy") {

				if (oParameters.semanticAttributes.IsData !== "X") {

					var sLiquidityItem = oSelectionVariant.getValue("LiquidityItem");
					if (sLiquidityItem) {
						oSelectionVariant.removeSelectOption("LiquidityItem");
					}

				} else {

					if (oParameters.semanticAttributes.LiquidityItem === "#EMPTY") {

						oParameters.semanticAttributes.LiquidityItem = "";

					}

				}

			}

		},

		addContentToPopOver: function(oParameters, oSource, that) {

			//Show Bank Transfer & Check Cash Flow Items navigation
			var oForm = new sap.ui.layout.form.SimpleForm({
				ColumnsL: 2
			});
			oForm.setLayout("ResponsiveGridLayout");

			if (that.getView().getViewName() === "fin.cash.flow.analyzer.view.LiquidityItemHierarchy") {

				// if (oParameters.semanticAttributes.IsData === "X") {
				// Liquidity Item
				var oLiquidityItemText = new sap.m.Text();
				var sLiquidityItemLabelText = that.oResourceBundle.getText("LIQUIDITYITEM");
				var oLiquidityItemLabel = new sap.m.Label({
					text: sLiquidityItemLabelText
				});

				if (oParameters.semanticAttributes.LiquidityItem) {
					oLiquidityItemText.setText(oParameters.semanticAttributes.LiquidityItem + ": " + oParameters.semanticAttributes.name);
				} else if (oParameters.semanticAttributes.LiquidityItem === "") {
					oLiquidityItemText.setText(that.oResourceBundle.getText("NotAssign"));
				}

				oForm.addContent(oLiquidityItemLabel);
				oForm.addContent(oLiquidityItemText);
				// }

			} else {

				// bank account
				var oBankAccountText = new sap.m.Text();
				var sBankAccountLabelText = that.oResourceBundle.getText("BANKACCOUNTLABEL");
				var oBankAccountLabel = new sap.m.Label({
					text: sBankAccountLabelText
				});

				var bankAccountNameTxt = "";
				if (oParameters.semanticAttributes.BankAccountName) {
					bankAccountNameTxt = oParameters.semanticAttributes.BankAccountName;
				}

				if (oParameters.semanticAttributes.BankAccount !== "") {
					oBankAccountText.setText(oParameters.semanticAttributes.BankAccount + " " + bankAccountNameTxt);
				} else if (oParameters.semanticAttributes.BankAccount === "") {
					oBankAccountText.setText(that.oResourceBundle.getText("NotAssign"));
				}

				oForm.addContent(oBankAccountLabel);
				oForm.addContent(oBankAccountText);

				// if (that.getView().getViewName() !== "fin.cash.flow.analyzer.view.BankAccountHierarchy") {
				// Company Code
				var oCompanyCodeText = new sap.m.Text();
				var sCompanyCodeLabelText = that.oResourceBundle.getText("COMPANYCODELABEL");
				var oCompanyCodeLabel = new sap.m.Label({
					text: sCompanyCodeLabelText
				});

				var companyCodeNameTxt = "";
				if (oParameters.semanticAttributes.CompanyCodeName) {
					companyCodeNameTxt = oParameters.semanticAttributes.CompanyCodeName;
				}

				if (oParameters.semanticAttributes.CompanyCode) {
					oCompanyCodeText.setText(oParameters.semanticAttributes.CompanyCode + " " + companyCodeNameTxt);
				}

				oForm.addContent(oCompanyCodeLabel);
				oForm.addContent(oCompanyCodeText);
				// }
			}
			
			var bDetailPage = false;
			var viewType = that.getView().getModel("Scaling").getData().viewType;
			if (that.getView().getViewName() === "fin.cash.flow.analyzer.view.Worklist") {
				var oContext = that.getView().byId(oParameters.originalId).getBindingContext();
				var oSourceObject = oContext.getObject(oContext.getPath());
				if (viewType === 1 || oSourceObject.ViewTypeExt === "2FLOWS") {
					bDetailPage = true;
				}
			}
			if (that.getView().getViewName() === "fin.cash.flow.analyzer.view.LiquidityItemHierarchy") {
				if(oParameters.semanticAttributes.IsData === "X") {
					bDetailPage = true;
				}
			}
			
			if (bDetailPage === true) {
				var oEmptyLabel = new sap.m.Label();
				oForm.addContent(oEmptyLabel);
				var oThis = this;
				var sLinkText = that.oResourceBundle.getText("DETAIL_PAGE_TITLE");
				var oLink = new sap.m.Link({
					text: sLinkText,
					press: function(oEvent){
						oThis.onDetailListNaviPressed(oParameters, oSource, that);
					}
				});
				oForm.addContent(oLink);
			}

			return oForm;
		},

		onDetailListNaviPressed: function( oParameters, oSource, that ) {
			var sOriginalId = oParameters.originalId;
			var oSelectionVariant = new SelectionVariant(that.oCurrSmartFilterBar.getDataSuiteFormat());
			var oSourceObject;
			//this.processNullNaviValue(sOriginalId, oSelectionVariant, oSource, that);
			this.addMoreNavParameters(oParameters, oSelectionVariant, that);
			this.addCurrency(oSelectionVariant, oParameters, that);
			this.setDateForDiffPaymentDay(oParameters, oSelectionVariant, oSource, that);
			//this.removeNotUsedContextNavParameters(oParameters);
			this.mapFieldsToCCFI(oParameters, oSelectionVariant, oSource, that);
			//this.deriveLiquidityItem(oSelectionVariant, oParameters, that);
			if(that.getView().byId(sOriginalId)){
				var oSmartLink = that.getView().byId(sOriginalId);
				var oContext = oSmartLink.getBindingContext();
				oSourceObject = oContext.getObject(oContext.getPath());
			} else {
				oSourceObject = oParameters.semanticAttributes;
			}
			delete oSourceObject.__metadata;
			
			that.getOwnerComponent().setSelectionVariant(oSelectionVariant);
			var oNaviParams = {
				pSelRow: oSourceObject,
				pAmount: oParameters.mainNavigation.getText(),
				pSetting: that.getView().getModel("Scaling").getData()
			};
			that.getRouter().navTo("DetailList", {
				Params: JSON.stringify(oNaviParams).toBase64URI()
			});
		},
		
		provideAdditionalParameter: function(sAction, oSelVariant, isBankCurrency) {
			var sAccecptAction = [];
			var tempStr = null;
			var sCertaintyLevelList = this.getCertaintyLevelDefault();
			var sCertaintyLevel = "";
			var fExisted = "";
			jQuery.each(sAction, function(index, value) {
				var sUrl = value.getHref();
				if ((sUrl.search(/BankAccount-transferFrom\?/) !== -1) && (sUrl.search(/BankAccount-transferTo\?/) === -1)) { // To handle transferFrom  					tempStr = sUrl.replace("TransferTo=X", "TransferTo= ");
					tempStr = sUrl.replace("TransferTo=X", "TransferTo= ");
					tempStr = tempStr.replace("AccId=", "PayingBankAccountInternalID=");
					tempStr = tempStr.replace("CompanyCode=", "PayingCompanyCode=");
					if (tempStr.search("HouseBank") !== -1) {
						tempStr = tempStr.replace("HouseBank=", "PayingHouseBank=");
						tempStr = tempStr.replace("HouseBankAccount=", "PayingHouseBankAccount=");
					} else {
						tempStr = tempStr.replace("BankAccount=", "PayingBankAccount=");
					}
					value.setHref(tempStr);
				}
				if ((sUrl.search(/BankAccount-transferTo/) !== -1)) {
					tempStr = sUrl.replace("TransferFrom=X", "TransferFrom= ");
					tempStr = tempStr.replace("AccId=", "PayeeBankAccountInternalID=");
					tempStr = tempStr.replace("CompanyCode=", "PayeeCompanyCode=");
					if (tempStr.search("HouseBank") !== -1) {
						tempStr = tempStr.replace("HouseBank=", "PayeeHouseBank=");
						tempStr = tempStr.replace("HouseBankAccount=", "PayeeHouseBankAccount=");
					} else {
						tempStr = tempStr.replace("BankAccount=", "PayeeBankAccount=");
					}
					value.setHref(tempStr);
				}
				//Cash Request
				if ((sUrl.search(/BankAccount-createCashRequestReceiving/) !== -1)) {
					oSelVariant.removeSelectOption("CertaintyLevel");
					oSelVariant.removeParameter("CertaintyLevel");
					fExisted = "";
					jQuery.each(sCertaintyLevelList, function(index, value) {
						sCertaintyLevel = "CertaintyLevel=" + value;
						if ((sUrl.search(sCertaintyLevel) !== -1)) {
							sUrl = sUrl.replace(sCertaintyLevel, "CertaintyLevel=CSHRQ");
							fExisted = "X";
							return;
						}
					} );
					tempStr = sUrl.replace("CompanyCode=", "CashReqCompanyCode=");
					tempStr = tempStr.replace("AccId=", "ReceivingBankAccountIntID=");
					tempStr = tempStr.replace("BankAccount=", "ReceivingBankAccount=");
					if (fExisted !== "X") {
						tempStr = tempStr + "&CertaintyLevel=CSHRQ";
					}
					value.setHref(tempStr);
				}
				if ((sUrl.search(/BankAccount-createCashRequestSending/) !== -1)) {
					oSelVariant.removeSelectOption("CertaintyLevel");
					oSelVariant.removeParameter("CertaintyLevel");
					fExisted = "";
					jQuery.each(sCertaintyLevelList, function(index, value) {
						sCertaintyLevel = "CertaintyLevel=" + value;
						if ((sUrl.search(sCertaintyLevel) !== -1)) {
							sUrl = sUrl.replace(sCertaintyLevel, "CertaintyLevel=CSHRQ");
							fExisted = "X";
							return;
						}
					} );
					tempStr = sUrl.replace("CompanyCode=", "CashReqCompanyCode=");
					tempStr = tempStr.replace("AccId=", "SendingBankAccountIntID=");
					tempStr = tempStr.replace("BankAccount=", "SendingBankAccount=");
					if (fExisted !== "X") {
						tempStr = tempStr + "&CertaintyLevel=CSHRQ";
					}
					value.setHref(tempStr);
				}
				//MMF
				if ((sUrl.search(/BankAccount-createMMFCashRequestReceiving/) !== -1)) {
					oSelVariant.removeSelectOption("CertaintyLevel");
					oSelVariant.removeParameter("CertaintyLevel");
					fExisted = "";
					jQuery.each(sCertaintyLevelList, function(index, value) {
						sCertaintyLevel = "CertaintyLevel=" + value;
						if ((sUrl.search(sCertaintyLevel) !== -1)) {
							sUrl = sUrl.replace(sCertaintyLevel, "CertaintyLevel=CSHRQ");
							fExisted = "X";
							return;
						}
					} );
					tempStr = sUrl.replace("CompanyCode=", "CashReqCompanyCode=");
					tempStr = tempStr.replace("AccId=", "ReceivingBankAccountIntID=");
					tempStr = tempStr.replace("BankAccount=", "ReceivingBankAccount=");
					if (fExisted !== "X") {
						tempStr = tempStr + "&CertaintyLevel=CSHRQ";
					}
					tempStr = tempStr + "&CashReqInstrCategory=FT";
					tempStr = tempStr + "&TrsyCshFlowDebtInvmtCode=BORROW";
					if (isBankCurrency === "X") {
						tempStr = tempStr.replace("BankAccountCurrency=", "TradedCurrency=");
					} else if (isBankCurrency === "L") {
						tempStr = tempStr.replace("LocalCurrency=", "TradedCurrency=");
					} else {
						tempStr = tempStr.replace("Currency=", "TradedCurrency=");
					}
					value.setHref(tempStr);
				}
				if ((sUrl.search(/BankAccount-createMMFCashRequestSending/) !== -1)) {
					oSelVariant.removeSelectOption("CertaintyLevel");
					oSelVariant.removeParameter("CertaintyLevel");
					fExisted = "";
					jQuery.each(sCertaintyLevelList, function(index, value) {
						sCertaintyLevel = "CertaintyLevel=" + value;
						if ((sUrl.search(sCertaintyLevel) !== -1)) {
							sUrl = sUrl.replace(sCertaintyLevel, "CertaintyLevel=CSHRQ");
							fExisted = "X";
							return;
						}
					} );
					tempStr = sUrl.replace("CompanyCode=", "CashReqCompanyCode=");
					tempStr = tempStr.replace("AccId=", "SendingBankAccountIntID=");
					tempStr = tempStr.replace("BankAccount=", "SendingBankAccount=");
					if (fExisted !== "X") {
						tempStr = tempStr + "&CertaintyLevel=CSHRQ";
					}
					tempStr = tempStr + "&CashReqInstrCategory=FT";
					tempStr = tempStr + "&TrsyCshFlowDebtInvmtCode=INVEST";
					if (isBankCurrency === "X") {
						tempStr = tempStr.replace("BankAccountCurrency=", "TradedCurrency=");
					} else if (isBankCurrency === "L") {
						tempStr = tempStr.replace("LocalCurrency=", "TradedCurrency=");
					} else {
						tempStr = tempStr.replace("Currency=", "TradedCurrency=");
					}
					value.setHref(tempStr);
				}
				
				//add property for opening link in new tab
				value.setProperty("target", "_blank");
				value.setProperty("isSuperiorAction", true);

			});
			sAccecptAction = sAction;
			return sAccecptAction;
		},

		provideAdditionalParameterBACC: function(sAction) {
			var sAccecptAction = [];
			// var tempStr = null;
			jQuery.each(sAction, function(index, value) {
				// var sUrl = value.getHref();

				//add property for opening link in new tab
				value.setProperty("target", "_blank");

			});
			sAccecptAction = sAction;
			return sAccecptAction;
		},

		removeNotUsedContextNavParameters: function(oParameters) {

			// remove data * fields
			var name = "Data";
			var convertName = "ConvertData";
			var index = 1;
			var field = name + index.toString();
			var convertField = convertName + index.toString();
			while (oParameters.semanticAttributes[field]) {
				delete oParameters.semanticAttributes[field];
				delete oParameters.semanticAttributes[convertField];

				index = index + 1;
				field = name + index.toString();
				convertField = convertName + index.toString();
			}

			// remove overdue
			if (oParameters.semanticAttributes.OverDue) {
				delete oParameters.semanticAttributes.OverDue;
			}

			if (oParameters.semanticAttributes.ConvertOverDue) {
				delete oParameters.semanticAttributes.ConvertOverDue;
			}

			if (oParameters.semanticAttributes.CyclePattern) {
				delete oParameters.semanticAttributes.CyclePattern;
			}

			if (oParameters.semanticAttributes.beforeBalance) {
				delete oParameters.semanticAttributes.beforeBalance;
			}
			
			if (oParameters.semanticAttributes.beforeBalanceDsp) {
				delete oParameters.semanticAttributes.beforeBalanceDsp;
			}
			
			if (oParameters.semanticAttributes.transferAmount) {
				delete oParameters.semanticAttributes.transferAmount;
			}
			
			if (oParameters.semanticAttributes.transferAmountDsp) {
				delete oParameters.semanticAttributes.transferAmountDsp;
			}
			
			if (oParameters.semanticAttributes.maxTargetAmount) {
				delete oParameters.semanticAttributes.maxTargetAmount;
			}
			
			if (oParameters.semanticAttributes.minTransferAmount) {
				delete oParameters.semanticAttributes.minTransferAmount;
			}
			
			if (oParameters.semanticAttributes.afterBalance) {
				delete oParameters.semanticAttributes.afterBalance;
			}
			
			if (oParameters.semanticAttributes.afterBalanceDsp) {
				delete oParameters.semanticAttributes.afterBalanceDsp;
			}

		},

		setDateForDiffPaymentDay: function(oParameters, oSelectionVariant, oSource, that) {

			var fieldName = oSource.getProperty("fieldName");

			var valueDate = oSelectionVariant.getValue("KeyDate");

			var sCertaintyLevel = this.getCertaintyLevelDefault();

			if (valueDate) {
				var sValueDateObj = this.parseNavToValueDate(oParameters, fieldName, valueDate[0].Low, that);

				if (sValueDateObj && sValueDateObj.sLow && sValueDateObj.sHigh) {
					oSelectionVariant.addSelectOption("ValueDate", "I", "BT", sValueDateObj.sLow, sValueDateObj.sHigh);
				}
			}

			// For opening balance on Day 1, Certainty Level is "ACTUAL"
			if ((oParameters.semanticAttributes.ViewTypeExt === "1BEG_BAL") && (fieldName === "Data1")) {
				if (oSelectionVariant.getValue("CertaintyLevel")) {
					oSelectionVariant.removeSelectOption("CertaintyLevel");
				}
				oSelectionVariant.addSelectOption("CertaintyLevel", "I", "EQ", "ACTUAL");
				return false;
			} else if (fieldName === "OverDue") {
				// for overdue, only forecast data will be retrived. No actual data
				if (!oSelectionVariant.getValue("CertaintyLevel")) {
					// oSelectionVariant.removeSelectOption("CertaintyLevel");

					jQuery.each(sCertaintyLevel, function(index, value) {
						if (value !== "ACTUAL") {
							oSelectionVariant.addSelectOption("CertaintyLevel", "I", "EQ", value);
						}
					});

				} else {
					var arrCertaintyLevel = oSelectionVariant.getValue("CertaintyLevel");
					oSelectionVariant.removeSelectOption("CertaintyLevel");
					jQuery.each(arrCertaintyLevel, function (index, value) {
						if (value.Low !== "ACTUAL") {
							oSelectionVariant.addSelectOption("CertaintyLevel", "I", "EQ", value.Low);
						}
					});
				}

				return false;

			} else {
				var actualDate = oSelectionVariant.getValue("ActualDate");
				var sFilterCertaintyLevel = oSelectionVariant.getValue("CertaintyLevel");
				if (actualDate) {
					if (actualDate[0].Low > sValueDateObj.sHigh) {

						if (!sFilterCertaintyLevel) {
							oSelectionVariant.addSelectOption("CertaintyLevel", "I", "EQ", "ACTUAL");
						}
						return true;
					} else if (actualDate[0].Low < sValueDateObj.sHigh) {
						return false;
					}
				} else {
					return false;
				}
			}

		},
		
		setOverduePlanningLevel: function(oParameters, oSelectionVariant, oSource, that) {

			var oSmartLink = that.getView().byId(oParameters.originalId);
			var oContext = oSmartLink.getBindingContext();
			// to get the original semantic naviagtion fields
			var oSourceObject = oContext.getObject(oContext.getPath());
			var fieldName = oSource.getProperty("fieldName");
			
			if (oSourceObject.ViewTypeExt === "2FLOWS" && oSourceObject.DisplayPlanningLevel !== undefined) {
				var overduepl = oSelectionVariant.getSelectOption("OverduePlanningLevel");
				var pl = oSelectionVariant.getSelectOption("PlanningLevel");
				
				if (fieldName === 'OverDue') {
					jQuery.each(overduepl, function(index, value){
						if (oSourceObject.DisplayPlanningLevel === value.Low) {
							oSelectionVariant.removeSelectOption("OverduePlanningLevel");
							return;
						}
					});
					if (oSelectionVariant.getSelectOption("OverduePlanningLevel") !== undefined) {
						oSelectionVariant.removeSelectOption("OverduePlanningLevel");
						oSelectionVariant.addSelectOption("OverduePlanningLevel", "I", "EQ", oSourceObject.DisplayPlanningLevel);
						oSelectionVariant.addSelectOption("OverduePlanningLevel", "E", "EQ", oSourceObject.DisplayPlanningLevel);
					} else {
						oSelectionVariant.addSelectOption("OverduePlanningLevel", "I", "EQ", oSourceObject.DisplayPlanningLevel);
					}
				} else if (fieldName === 'Data1') {
					jQuery.each(overduepl, function(index, value){
						if (oSourceObject.DisplayPlanningLevel === value.Low) {
							oSelectionVariant.removeSelectOption("OverduePlanningLevel");
							return;
						}
					});
					if (oSelectionVariant.getSelectOption("OverduePlanningLevel") !== undefined) {
						oSelectionVariant.removeSelectOption("OverduePlanningLevel");
						oSelectionVariant.addSelectOption("OverduePlanningLevel", "I", "EQ", oSourceObject.DisplayPlanningLevel);
						oSelectionVariant.addSelectOption("OverduePlanningLevel", "E", "EQ", oSourceObject.DisplayPlanningLevel);
					} else {
						oSelectionVariant.addSelectOption("OverduePlanningLevel", "I", "EQ", oSourceObject.DisplayPlanningLevel);
					}
					
					jQuery.each(pl, function(index, value){
						if (oSourceObject.DisplayPlanningLevel === value.Low) {
							oSelectionVariant.removeSelectOption("PlanningLevel");
							return;
						}
					});
					if (oSelectionVariant.getSelectOption("PlanningLevel") !== undefined) {
						oSelectionVariant.removeSelectOption("PlanningLevel");
						oSelectionVariant.addSelectOption("PlanningLevel", "I", "EQ", oSourceObject.DisplayPlanningLevel);
						oSelectionVariant.addSelectOption("PlanningLevel", "E", "EQ", oSourceObject.DisplayPlanningLevel);
					} else {
						oSelectionVariant.addSelectOption("PlanningLevel", "I", "EQ", oSourceObject.DisplayPlanningLevel);
					}
				} else {
					jQuery.each(pl, function(index, value){
						if (oSourceObject.DisplayPlanningLevel === value.Low) {
							oSelectionVariant.removeSelectOption("PlanningLevel");
							return;
						}
					});
					if (oSelectionVariant.getSelectOption("PlanningLevel") !== undefined) {
						oSelectionVariant.removeSelectOption("PlanningLevel");
						oSelectionVariant.addSelectOption("PlanningLevel", "I", "EQ", oSourceObject.DisplayPlanningLevel);
						oSelectionVariant.addSelectOption("PlanningLevel", "E", "EQ", oSourceObject.DisplayPlanningLevel);
					} else {
						oSelectionVariant.addSelectOption("PlanningLevel", "I", "EQ", oSourceObject.DisplayPlanningLevel);
					}
				}
			} 
			delete oParameters.semanticAttributes.DisplayPlanningLevel;

		},

		parseNavToValueDate: function(oParameters, fieldName, sValueDate, that) {
			var oFromNavDate = new Date(sValueDate);
			var oToNavDate = new Date(sValueDate);
			var oValueDatePair = {};
			var oFieldMapping = [];
			var aFieldMapping = null;
			oFieldMapping = that.getView().getModel("FieldMapping").oData;
			oFieldMapping.forEach(function(element, index) {
				if (element.field === fieldName) {
					aFieldMapping = element;
					return;
				}
			});
			//Main View
			if (that.getView().getViewName() === "fin.cash.flow.analyzer.view.Worklist" ||
				that.getView().getViewName() === "fin.cash.flow.analyzer.view.Worklist_D") {
				// Delta Display
				if (that.getView().getModel("Scaling").getData().viewType === 1) {
					if (fieldName) {
						oFromNavDate = new Date(aFieldMapping.from);
						if (aFieldMapping.to.getFullYear() === 9999) {
							aFieldMapping.to.setMonth(0);
							aFieldMapping.to.setDate(1);
						}
						oToNavDate = new Date(aFieldMapping.to);
						oFromNavDate.toJSON = that.util.convertDateTimeToABAPDateTime;
						oToNavDate.toJSON = that.util.convertDateTimeToABAPDateTime;
						oValueDatePair = {
							sLow: oFromNavDate.toJSON(),
							sHigh: oToNavDate.toJSON()
						};
					}
				} else if (that.getView().getModel("Scaling").getData().viewType === 0) {
					if (oParameters.semanticAttributes.ViewTypeExt) {
						if (oParameters.semanticAttributes.ViewTypeExt === "2FLOWS") {
							oFromNavDate = new Date(aFieldMapping.from);
							if (aFieldMapping.to.getFullYear() === 9999) {
								aFieldMapping.to.setMonth(0);
								aFieldMapping.to.setDate(1);
							}
							oToNavDate = new Date(aFieldMapping.to);
							// for Day one, flows contain overdue flows
							if (fieldName === "Data1") {
								oFromNavDate.setFullYear(1900);
								oFromNavDate.setMonth(0);
								oFromNavDate.setDate(1);
							}
							oFromNavDate.toJSON = that.util.convertDateTimeToABAPDateTime;
							oToNavDate.toJSON = that.util.convertDateTimeToABAPDateTime;
							oValueDatePair = {
								sLow: oFromNavDate.toJSON(),
								sHigh: oToNavDate.toJSON()
							};
						} else if (oParameters.semanticAttributes.ViewTypeExt === "1BEG_BAL") {
							oFromNavDate.setFullYear(1900);
							oFromNavDate.setMonth(0);
							oFromNavDate.setDate(1);
							oToNavDate.setDate((aFieldMapping.from.getDate() - 1));
							if (fieldName === "OverDue") {
								oToNavDate = new Date(oFromNavDate);
							}
							oFromNavDate.toJSON = that.util.convertDateTimeToABAPDateTime;
							oToNavDate.toJSON = that.util.convertDateTimeToABAPDateTime;
							oValueDatePair = {
								sLow: oFromNavDate.toJSON(),
								sHigh: oToNavDate.toJSON()
							};
						} else if (oParameters.semanticAttributes.ViewTypeExt === "3END_BAL") {
							oFromNavDate.setFullYear(1900);
							oFromNavDate.setMonth(0);
							oFromNavDate.setDate(1);
							if (aFieldMapping.to.getFullYear() === 9999) {
								aFieldMapping.to.setMonth(0);
								aFieldMapping.to.setDate(1);
							}
							oToNavDate = new Date(aFieldMapping.to);
							oFromNavDate.toJSON = that.util.convertDateTimeToABAPDateTime;
							oToNavDate.toJSON = that.util.convertDateTimeToABAPDateTime;
							oValueDatePair = {
								sLow: oFromNavDate.toJSON(),
								sHigh: oToNavDate.toJSON()
							};
						}
					} else {
						oFromNavDate.setFullYear(1900);
						oFromNavDate.setMonth(0);
						oFromNavDate.setDate(1);
						if (aFieldMapping.to.getFullYear() === 9999) {
							aFieldMapping.to.setMonth(0);
							aFieldMapping.to.setDate(1);
						}
						oToNavDate = new Date(aFieldMapping.to);
						oFromNavDate.toJSON = that.util.convertDateTimeToABAPDateTime;
						oToNavDate.toJSON = that.util.convertDateTimeToABAPDateTime;
						oValueDatePair = {
							sLow: oFromNavDate.toJSON(),
							sHigh: oToNavDate.toJSON()
						};
					}
				}
			} else if (that.getView().getViewName() === "fin.cash.flow.analyzer.view.LiquidityItemHierarchy") {
				oFromNavDate = new Date(aFieldMapping.from);
				oToNavDate = new Date(aFieldMapping.to);
				// for Day one, flows contain overdue flows
				if (fieldName === "ConvertData1" && !that.FromMainView) {
					oFromNavDate.setFullYear(1900);
					oFromNavDate.setMonth(0);
					oFromNavDate.setDate(1);
				}
				oFromNavDate.toJSON = that.util.convertDateTimeToABAPDateTime;
				oToNavDate.toJSON = that.util.convertDateTimeToABAPDateTime;
				oValueDatePair = {
					sLow: oFromNavDate.toJSON(),
					sHigh: oToNavDate.toJSON()
				};
			} else if (that.getView().getViewName() === "fin.cash.flow.analyzer.view.BankAccountHierarchy") {
				oFromNavDate.setFullYear(1900);
				oFromNavDate.setMonth(0);
				oFromNavDate.setDate(1);
				oToNavDate = new Date(aFieldMapping.to);
				oFromNavDate.toJSON = that.util.convertDateTimeToABAPDateTime;
				oToNavDate.toJSON = that.util.convertDateTimeToABAPDateTime;
				oValueDatePair = {
					sLow: oFromNavDate.toJSON(),
					sHigh: oToNavDate.toJSON()
				};
			}
			return oValueDatePair;
		},

		getCertaintyLevelDefault: function() {
			var aLevelItem = ["SI_CIT", "TRM_D", "REC_N", "PAY_N", "TRM_O", "ACTUAL",
				"CMIDOC", "FICA", "SDSO", "MEMO", "MMPO", "MMPR", "MMSA",
				"SDSA", "PAYRQ", "PYORD", "FIP2P", "LEASE", "PARKED", "INTRAM", "CSHRQ"
			];
			return aLevelItem;
		},

		mapFieldsToCCFI: function(oParameters, oSelectVariants, oSource, that) {

			// Bank Country
			var sBankCountry = oSelectVariants.getValue("BankCountry");
			if (sBankCountry) {

				jQuery.each(sBankCountry, function(index, value) {
					oSelectVariants.addSelectOption("BankCountryKey", value.Sign, value.Option, value.Low, value.High);
				});

			}

			// Journal Entry Type
			var sJEType = oSelectVariants.getValue("FiDocumentType");
			if (sJEType) {

				jQuery.each(sJEType, function(index, value) {
					oSelectVariants.addSelectOption("DocType", value.Sign, value.Option, value.Low, value.High);
				});

			}

			//add parameter HistoryTimeStamp
			// var sHistoricalTimeStamp = oSelectVariants.getParameter("HistoricalTimeStamp");
			// oSelectVariants.addSelectOption("HistoryTimeStamp", "I", "EQ", sHistoricalTimeStamp);
			
			var sActualDate = oSelectVariants.getValue("ActualDate");
			var sValueDate = oSelectVariants.getValue("KeyDate");
			oSelectVariants.removeParameter("ActualDate");
			if (!that.sHierType) {
				var oSmartLink = that.getView().byId(oParameters.originalId);
				var oContext = oSmartLink.getBindingContext();
				var oSourceObject = oContext.getObject(oContext.getPath());
				if (oSourceObject.ViewTypeExt === "2FLOWS") {
					var aFieldMapping = null;
					var fieldName = oSource.getProperty("fieldName");
					var oFieldMapping = that.getView().getModel("FieldMapping").oData;
					oFieldMapping.forEach(function (element, index) {
						if (element.field === fieldName) {
							aFieldMapping = element;
							return;
						}
					});
					var oDate1 = new Date(aFieldMapping.from);
					oDate1.toJSON = that.util.convertDateTimeToABAPDateTime;
					var sDate1 = oDate1.toJSON();
					if (sActualDate && sActualDate[0].Low > sDate1) {
					    oSelectVariants.addSelectOption("ActualDate", "I", "BT", sDate1, sActualDate[0].Low);
					} else {
						oSelectVariants.addSelectOption("ActualDate", "I", "BT", sDate1, sDate1);
					}
				} else {
					if (sActualDate && sActualDate[0].Low > sValueDate[0].Low) {
						oSelectVariants.addSelectOption("ActualDate", "I", "BT", "1900-01-01T00:00:00.000", sActualDate[0].Low);
					} else {
						oSelectVariants.addSelectOption("ActualDate", "I", "BT", "1900-01-01T00:00:00.000", sValueDate[0].Low);
					}
				}
			} else {
				if (sActualDate && sActualDate[0].Low > sValueDate[0].Low) {
					oSelectVariants.addSelectOption("ActualDate", "I", "BT", "1900-01-01T00:00:00.000", sActualDate[0].Low);
				} else {
					oSelectVariants.addSelectOption("ActualDate", "I", "BT", "1900-01-01T00:00:00.000", sValueDate[0].Low);
				}
			}
		},
		
		mapFieldsToCashRequest: function (oParameters, oSelectionVariant, oSource, that) {
			var oFieldMapping = [];
			var aFieldMapping = null;
			var fieldName = oSource.getProperty("fieldName");
			oFieldMapping = that.getView().getModel("FieldMapping").oData;
			oFieldMapping.forEach(function (element, index) {
				if (element.field === fieldName) {
					aFieldMapping = element;
					return;
				}
			});
			var oValueDate = new Date(aFieldMapping.to);
			oValueDate.toJSON = that.util.convertDateTimeToABAPDateTime;
			var sValueDate = oValueDate.toJSON();
			sValueDate = sValueDate.substring(0, sValueDate.length-1);
			oSelectionVariant.addParameter("CashReqValueDate", sValueDate);
			oSelectionVariant.addParameter("TermStartDate", sValueDate);
			
			/*var oTermEndDate = new Date(oValueDate.setMonth(oValueDate.getMonth()+1));
			oTermEndDate.toJSON = that.util.convertDateTimeToABAPDateTime;
			var sTermEndDate = oTermEndDate.toJSON();
			sTermEndDate = sTermEndDate.substring(0, sTermEndDate.length-1);
			oSelectionVariant.addParameter("TermEndDate", sTermEndDate);*/
		}
	};

});