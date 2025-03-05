/*
 * Copyright (C) 2009-2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["fin/cash/flow/analyzer/controller/BaseController"],function(B){"use strict";return B.extend("fin.cash.flow.analyzer.controller.S1",{onInit:function(){if(this.extHookonDataReceived){this.extHookonDataReceived(this.model);}if(this.extHookOnInit){this.extHookOnInit();}}});});
