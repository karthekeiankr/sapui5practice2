/*
 * Copyright (C) 2009-2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function(Controller) {
  "use strict";

  return Controller.extend("fin.cash.flow.analyzer.controller.BaseController", {
    /**
     * Convenience method for accessing the router.
     * @public
     * @returns {sap.ui.core.routing.Router} the router for this component
     */
    getRouter: function() {
      return sap.ui.core.UIComponent.getRouterFor(this);
    },

    /**
     * Convenience method for getting the view model by name.
     * @public
     * @param {string} [sName] the model name
     * @returns {sap.ui.model.Model} the model instance
     */
    getModel: function(sName) {
      return this.getView().getModel(sName);
    },

    /**
     * Convenience method for setting the view model.
     * @public
     * @param {sap.ui.model.Model} oModel the model instance
     * @param {string} sName the model name
     * @returns {sap.ui.mvc.View} the view instance
     */
    setModel: function(oModel, sName) {
      return this.getView().setModel(oModel, sName);
    },

    /**
     * Getter for the resource bundle.
     * @public
     * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
     */
    getResourceBundle: function() {
      return this.getOwnerComponent().getModel("i18n").getResourceBundle();
    },


    /**
     * Event handler when the share by E-Mail button has been clicked
     * @public
     */
    onShareEmailPress: function() {
    /*  var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
      sap.m.URLHelper.triggerEmail(
        null,
        oViewModel.getProperty("/shareSendEmailSubject"),
        oViewModel.getProperty("/shareSendEmailMessage")
      );*/
      if(this.storeCurrentAppState){
      	this.storeCurrentAppState();
      }
      sap.m.URLHelper.triggerEmail(
			null,
			this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("appDescription"),
			document.URL
		);
    },
    
    onShareInJamPress: function() {

		var oShareDialog = sap.ui.getCore().createComponent({
			name: "sap.collaboration.components.fiori.sharing.dialog",
			settings: {
				object: {
					id: new URI().toString(),
					share: this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("appDescription")
				}
			}
		});
		oShareDialog.open();
    },
    

    guid: function() {
     /* return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
          v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });*/
      return "xxx";
    },
    daysDiff: function(sfromDate, stoDate) {
      var fromDate = new Date(sfromDate);
      var toDate = new Date(stoDate);
      return Math.round((fromDate - toDate) / (1000 * 60 * 60 * 24));
    },
    showMessageBoxForODataError: function(oError, sDefaultErrorMsg) {
      var oRequest = oError.request;
      var oResponse = JSON.parse(oError.response.body);
      var oResourceBundle = this.oApplicationFacade.getResourceBundle();

      var sUri = null,
        sMsg = null,
        sTimestamp = null,
        sResolution = null,
        sNote = null,
        sDetail = null;
      if (oRequest) {
        sUri = oRequest.requestUri;
      }
      if (oResponse && oResponse.error) {
        if (oResponse.error.message) {
          sMsg = oResponse.error.message.value;
        }
        if (oResponse.error.innererror) {
          sTimestamp = oResponse.error.innererror.timestamp;
          if (oResponse.error.innererror.Error_Resolution) {
            sResolution = oResponse.error.innererror.Error_Resolution.SAP_Transaction;
            sNote = oResponse.error.innererror.Error_Resolution.SAP_Note;
          }
        }
      }

      if (sUri && sTimestamp && sResolution && sNote) {
        var sFormat = oResourceBundle.getText('ODATA_ERROR_MSG_DETAIL');
        sDetail = $.sap.formatMessage(sFormat, [sUri, sTimestamp, sResolution, sNote]);
      }

      if (sMsg && sDetail) {
        this.showErrorMessage(sMsg, sDetail);
      } else {
        this.showErrorMessage(sDefaultErrorMsg);
      }
    }

  });

});