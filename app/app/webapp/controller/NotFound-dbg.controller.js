/*
 * Copyright (C) 2009-2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"fin/cash/flow/analyzer/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("fin.cash.flow.analyzer.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);