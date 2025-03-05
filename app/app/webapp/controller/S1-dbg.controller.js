/*
 * Copyright (C) 2009-2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"fin/cash/flow/analyzer/controller/BaseController" 
], function(BaseController) {
	"use strict";

	return BaseController.extend("fin.cash.flow.analyzer.controller.S1", {
		
		onInit: function() { 
			/**
			 * @ControllerHook hook for data revceived
			 * 
			 * @callback fin.cash.paymentdetail.display.view.S1~extHookonDataReceived
			 * @param {sap.ui.model.json.JSONModel}
			 *          model
			 * @return {void}
			 * 
			 */
			if (this.extHookonDataReceived) { // check whether any extension has implemented the hook...
				this.extHookonDataReceived(this.model); // ...and call it
			}
	
			 
		 
			/**
			 * @ControllerHook OnInit of the Fullscreen Controller Implement this hook if you want to do something when
			 *                 the controller is initialized.
			 * @callback sap.ca.scfld.md.controller.BaseFullscreenController~extHookOnInit
			 */
			if (this.extHookOnInit) {
				this.extHookOnInit();
			}
		}
	});

});