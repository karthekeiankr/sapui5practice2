/*
 * Copyright (C) 2009-2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("fin.cash.flow.analyzer.util.ErrorHandler");
jQuery.sap.require("sap.m.MessageBox");

fin.cash.flow.analyzer.util.ErrorHandler = { 

	initODateErrorHandler: function(oComponent) {

		this._oComponent = oComponent;
		this._oDataModel = oComponent.getModel();
		this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
		this._bMessageOpen = false;
		//temporary code
		this._oController = oComponent;

		this._oDataModel.attachEvent("metadataFailed", function(oEvent) {
			var oParameters = oEvent.getParameters();
			var sMessage = oParameters.statusCode + " (" + oParameters.statusText + ")\r\n" +
				oParameters.message + "\r\n" +
				oParameters.responseText + "\r\n";
			this.showMessage(sMessage, "metadataFailed");
		}, this);

		this._oDataModel.attachEvent("requestFailed", function(oEvent) {
			var oParameters = oEvent.getParameters();
			var sMessage, oResponseText;
			if (jQuery.isEmptyObject(oParameters.response)) {
				return;
			} else {
				if (oParameters.response.statusCode !== 404 ||
					(oParameters.response.statusCode === 404 && oParameters.response.responseText.indexOf("Cannot POST") === 0)) {
					oResponseText = JSON.parse(oEvent.getParameter("response").responseText);
					if (oResponseText &&
						oResponseText.error &&
						oResponseText.error.innererror &&
						oResponseText.error.innererror.errordetails &&
						oResponseText.error.innererror.errordetails[0] &&
						oResponseText.error.innererror.errordetails[0].message) {
						sMessage = oParameters.response.statusCode + " (" + oParameters.response.statusText + ")\r\n" +
							oResponseText.error.innererror.errordetails[0].message;
					} else {
						sMessage = oParameters.response.statusCode + " (" + oParameters.response.statusText + ")\r\n" +
							oParameters.response.message + "\r\n" +
							oParameters.response.responseText + "\r\n";
					}
					this.showMessage(sMessage, "requestFailed");
				}
			}

		}, this);

		this._oDataModel.attachEvent("requestCompleted", function(oEvent) {
			var oParameters = oEvent.getParameters();
			var sMessage, oResponseText;
			if (oParameters.success === true) {
				return;
			} else {
				if (oParameters.errorobject) {
					if('abort' === oParameters.errorobject.statusText || oParameters.errorobject.responseText === ''){
						//ignore aborted request error handler which is one of the batch requests when ungrouping.
						//Internal Incident: 1880104533
						return;
					}
					oResponseText = JSON.parse(oParameters.errorobject.responseText);
					if (oResponseText &&
						oResponseText.error &&
						oResponseText.error.innererror &&
						oResponseText.error.innererror.errordetails &&
						oResponseText.error.innererror.errordetails[0] &&
						oResponseText.error.innererror.errordetails[0].message) {
						sMessage = "(" + oParameters.errorobject.message + " " + oParameters.errorobject.statusCode 
							       + " " +oParameters.errorobject.statusText + ")\r\n"
							       + oResponseText.error.innererror.errordetails[0].message;
					}
					this.showMessage(sMessage, "requestCompleted");
				}
			}
		}, this);
	},

	showMessage: function(sMessageDetail, sErrorType) {

		var sMessageContent, sMessageTilte;

		switch (sErrorType) {
			case "requestCompleted":
				{
					sMessageTilte = this._oResourceBundle.getText("ODATA_REQUEST_COMPLETED_TITLE");
					sMessageContent = this._oResourceBundle.getText("ODATA_REQUEST_COMPLETED");
					break;
				}
			case "requestFailed":
				{
					sMessageTilte = this._oResourceBundle.getText("ODATA_REQUEST_FAILED_TITLE");
					sMessageContent = this._oResourceBundle.getText("ODATA_REQUEST_FAILED");
					break;
				}
			case "metadataFailed":
				{
					sMessageTilte = this._oResourceBundle.getText("ODATA_METADATA_FAILED_TITLE");
					sMessageContent = this._oResourceBundle.getText("ODATA_METADATA_FAILED");
					break;

				}

		}
		sap.m.MessageBox.show(
			sMessageContent, {
				icon: sap.m.MessageBox.Icon.ERROR,
				title: sMessageTilte,
				details: sMessageDetail,
				styleClass: "sapUiSizeCompact",
				actions: [sap.m.MessageBox.Action.CLOSE]
			}
		);
	}
};