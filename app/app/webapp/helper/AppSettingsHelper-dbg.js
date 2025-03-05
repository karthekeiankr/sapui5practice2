/*
 * Copyright (C) 2009-2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("fin.cash.flow.analyzer.helper.AppSettingsHelper");
jQuery.sap.require("sap.ui.comp.odata.MetadataAnalyser");
jQuery.sap.require("sap.ui.comp.providers.ValueHelpProvider");
jQuery.sap.require("sap.ui.comp.providers.ValueListProvider");

fin.cash.flow.analyzer.helper.AppSettingsHelper = function(oModel, oParentView, oParentControler, oPersonalizer) {
	this.oModel = oModel;
	this.oParentView = oParentView;  
	this.oParentController = oParentControler;
	this.oPersonalizer = oPersonalizer;
	this.oDialog = null;

	this.aValueListProvider = [];
	this.aValueHelpProvider = [];

	this.oBusyIndicator = new sap.m.BusyDialog();

	this.handleWorkingdaysSelected = function() {

		if (sap.ui.getCore().byId("WorkingRadioBtn").getSelectedIndex() === 0) {
			sap.ui.getCore().byId("FactoryCalendarId").setEnabled(false);
			sap.ui.getCore().byId("PreviousFlag").setEnabled(false);
		} else {
			sap.ui.getCore().byId("FactoryCalendarId").setEnabled(true);
			sap.ui.getCore().byId("PreviousFlag").setEnabled(true);
		}
	};

	this.handleUsrDsplyCrcyValueHelp = function(oEvt) {
		if (!this._UsrDsplyCrcyDialog) {
			this._UsrDsplyCrcyDialog = sap.ui.xmlfragment("fin.cash.flow.analyzer.view.fragment.UsrDsplyCrcyDialog", this);
			this._UsrDsplyCrcyDialog.setModel(this.oModel);
			this._UsrDsplyCrcyDialog.setModel(this.oDialog.getModel("i18n"), "i18n");
		}
		this._UsrDsplyCrcyDialog.setMultiSelect(false);
		this._UsrDsplyCrcyDialog.setRememberSelections(true);
		// clear the old search filter
		this._UsrDsplyCrcyDialog.getBinding("items").filter([]);
		// toggle compact style
		jQuery.sap.syncStyleClass("sapUiSizeCompact", this.oParentView, this._UsrDsplyCrcyDialog);
		this._UsrDsplyCrcyDialog.open();
	};

	this.onHandleSearchForHDC = function(oEvt) {

		var aFilters = [];
		var sValue = oEvt.getParameter("value");
		var oFilter = new sap.ui.model.Filter("WAERS", sap.ui.model.FilterOperator.Contains, sValue);
		aFilters.push(oFilter);
		var oBinding = oEvt.getSource().getBinding("items");
		oBinding.filter(aFilters);

	};
	
	this.onHandleSearchForCAL = function(oEvt) {

				var aFilters = [];
				var sValue = oEvt.getParameter("value");
				var oFilter = new sap.ui.model.Filter("IDENT", sap.ui.model.FilterOperator.Contains, sValue);
				aFilters.push(oFilter);
				var oBinding = oEvt.getSource().getBinding("items");
				oBinding.filter(aFilters);

			};

	this.handleCalandarValueHelp = function(oEvt) {
		if (!this._CADialog) {
			this._CADialog = sap.ui.xmlfragment("fin.cash.flow.analyzer.view.fragment.CADialog", this);
			this._CADialog.setModel(this.oModel);
			this._CADialog.setModel(this.oDialog.getModel("i18n"), "i18n");
		}
		this._CADialog.setMultiSelect(false);
		this._CADialog.setRememberSelections(true);
		// clear the old search filter
		this._CADialog.getBinding("items").filter([]);
		// toggle compact style
		jQuery.sap.syncStyleClass("sapUiSizeCompact", this.oParentView, this._CADialog);
		this._CADialog.open();
	};

	this.onHandleCloseForUsrDCrcy = function(oEvt) {

		var crcy = oEvt.getParameter("selectedContexts")[0].getObject().WAERS;
		if (crcy) {
			sap.ui.getCore().byId("SettingDisplayCurrency").setValue(crcy);
		}
	};

	this.onHandleCloseForUsrCal = function(oEvt) {

		var crcy = oEvt.getParameter("selectedContexts")[0].getObject().IDENT;
		if (crcy) {
			sap.ui.getCore().byId("FactoryCalendarId").setValue(crcy);
		}
	};

	this.checkExpendLevel = function(oEvt) {
		var regx = new RegExp("^(0)$|^100$|^[1-9][0-9]?$");
		var levelInput = oEvt.getParameter("value");
		if (regx.test(levelInput) === false) {
			sap.ui.getCore().byId("SettingExpendLevel").setValueState("Error");
		} else {
			sap.ui.getCore().byId("SettingExpendLevel").setValueState("None");
		}
	};
};

fin.cash.flow.analyzer.helper.AppSettingsHelper.prototype.getSettingsDialog = function() {
	if (!this.oDialog) {
		this.oDialog = sap.ui.xmlfragment(
			"fin.cash.flow.analyzer.view.fragment.AppSettingsDialog",
			this
		);
		this.oDialog.setModel(this.oModel);
		this.oParentView.addDependent(this.oDialog);

		(function() {
			 this.DB_IsBankCurrency = sap.ui.getCore().byId("DB_IsBankCurrency");
			 this.DefaultView = sap.ui.getCore().byId("DefaultView");
			 this.SettingExpendLevel = sap.ui.getCore().byId("SettingExpendLevel");
			 this.SettingDisplayCurrency = sap.ui.getCore().byId("SettingDisplayCurrency");
			 this.Scaling = sap.ui.getCore().byId("Scaling");
			 this.FactoryCalendarId = sap.ui.getCore().byId("FactoryCalendarId");
			 this.PreviousFlag = sap.ui.getCore().byId("PreviousFlag");
			 this.WorkingRadioBtn = sap.ui.getCore().byId("WorkingRadioBtn");
			
		}).call(this);

		this.oDialog.attachEvent('beforeOpen', $.proxy(this.onBeforeOpen, this));
	}

	$.sap.syncStyleClass("sapUiSizeCompact", this.oParentView, this.oDialog);
	$.sap.syncStyleClass("sapUiSizeCompact", this.oParentView, this.oBusyIndicator);

	return this.oDialog;
};

fin.cash.flow.analyzer.helper.AppSettingsHelper.prototype.asyncGetSettings = function(fnSuccess, fnFail, oContext) {
	if (this.oPersonalizer) {
		this.oBusyIndicator.open();
		this.oPersonalizer.getPersData()
			.done(function(oPersData) {
				$.sap.log.debug("Reading personalization data done.");
				if (fnSuccess) {
					fnSuccess.call(oContext || {}, oPersData || {});
				}
			})
			.fail(function() {
				$.sap.log.error("Reading personalization data failed.");
				if (fnFail) {
					fnFail.call(oContext || {});
				}
			})
			.always($.proxy(function() {
				this.oBusyIndicator.close();
			}, this));
	} else {
		fnFail.call(oContext || {});
	}
};

fin.cash.flow.analyzer.helper.AppSettingsHelper.prototype.onBeforeOpen = function(oEvent) {

	this.asyncGetSettings(function(oSettings) {
		// Update the input fields
		if (oSettings['Scaling']) {
			this.Scaling.setSelectedKey(oSettings['Scaling']);
		} else {
			this.Scaling.setSelectedKey(0);
		}

		if (oSettings['DefaultView']) {
			this.DefaultView.setSelectedIndex(parseInt(oSettings['DefaultView']));
		} else {
			this.DefaultView.setSelectedIndex(0);
		}

		if (oSettings['DB_IsBankCurrency']) {
			this.DB_IsBankCurrency.setSelectedIndex(parseInt(oSettings['DB_IsBankCurrency']));
		} else {
			this.DB_IsBankCurrency.setSelectedIndex(0);
		}
		if (oSettings['SettingDisplayCurrency']) {
			this.SettingDisplayCurrency.setValue(oSettings['SettingDisplayCurrency']);
		} else {
			this.SettingDisplayCurrency.setValue("");
		}

		if (oSettings['SettingExpendLevel']) {
			this.SettingExpendLevel.setValue(oSettings['SettingExpendLevel']);
		} else {
			this.SettingExpendLevel.setValue("");
		}

		if (oSettings['WorkingRadioBtn']) {
			this.WorkingRadioBtn.setSelectedIndex(parseInt(oSettings['WorkingRadioBtn'], 10));
		} else {
			this.WorkingRadioBtn.setSelectedIndex(0);
		}
		this.handleWorkingdaysSelected();
		if (oSettings['FactoryCalendarId']) {
			this.FactoryCalendarId.setValue(oSettings['FactoryCalendarId']);
		} else {
			this.FactoryCalendarId.setValue("*");
		}

		if (oSettings['PreviousFlag']) {
			if (oSettings['PreviousFlag'] === '0') {
				this.PreviousFlag.setSelectedButton(sap.ui.getCore().byId("fin.cash.fa.main-np-button"));
			} else {
				this.PreviousFlag.setSelectedButton(sap.ui.getCore().byId("fin.cash.fa.main-pp-button"));
			}
		} else {
			this.PreviousFlag.setSelectedButton(this.PreviousFlag.getSelectedButton("fin.cash.fa.main-np"));
		}

	}, null, this);
};

fin.cash.flow.analyzer.helper.AppSettingsHelper.prototype.onOK = function() {
	$.sap.log.debug("OK Pressed");
	if (this.oPersonalizer) {
		var oPersData = {};

		// Get the user input
		oPersData['Scaling'] = this.Scaling.getSelectedKey();
		oPersData['DefaultView'] = this.DefaultView.getSelectedIndex();
		oPersData['DB_IsBankCurrency'] = this.DB_IsBankCurrency.getSelectedIndex();
		oPersData['SettingExpendLevel'] = this.SettingExpendLevel.getValue();
		oPersData['SettingDisplayCurrency'] = this.SettingDisplayCurrency.getValue();
		oPersData['WorkingRadioBtn'] = this.WorkingRadioBtn.getSelectedIndex();
		oPersData["FactoryCalendarId"] = (oPersData['WorkingRadioBtn'])?(this.FactoryCalendarId.getValue()):"*";
		oPersData["PreviousFlag"] = (this.PreviousFlag.getSelectedButton() === "fin.cash.fa.main-pp-button") ? "-1" : "0";

		this.rbIsBankCurrency = this.DB_IsBankCurrency.getSelectedIndex();
		//var isbankcurrency = (oPersData['DB_IsBankCurrency'] === 0) ? "" : "X";
		var isbankcurrency;
		switch(oPersData['DB_IsBankCurrency']) {
			case 0:
				isbankcurrency = "";
				break;
			case 1:
				isbankcurrency = "X";
				break;
			case 2:
			    isbankcurrency = "L";
			    break;
		}
		
		this.oParentView.getModel("Scaling").setData({
			scaling: oPersData['Scaling'],
			expend: oPersData['SettingExpendLevel'],
			displayCurrency: oPersData['SettingDisplayCurrency'],
			isBankCurrency: isbankcurrency,
			workingRadioBtn: oPersData['WorkingRadioBtn'],
			factoryCalendarId: oPersData["FactoryCalendarId"],
			previousFlag: oPersData["PreviousFlag"],
			viewType: oPersData['DefaultView']

		}, false);
		this.oDialog.close();
		this.oPersonalizer.setPersData(oPersData)
			.done(function() {
				$.sap.log.debug("Saving personalization data done.");
			})
			.fail(function() {
				$.sap.log.error("Saving personalization data failed.");
			});

	}
};

fin.cash.flow.analyzer.helper.AppSettingsHelper.prototype.onCancel = function() {
	$.sap.log.debug("Cancel Pressed");
	this.oDialog.close();
};