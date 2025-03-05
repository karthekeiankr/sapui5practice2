/*
 * Copyright (C) 2009-2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/util/MockServer"
], function(MockServer) {
	"use strict";

	return {

		_sServiceUrl: "/sap/opu/odata/sap/FCLM_CASH_FLOW_ANALYZER_SRV/",
		_sMetadataAddress: "fin/cash/flow/analyzer/localService",
		_sModulePath: "fin/cash/flow/analyzer/localService/mockdata",
		_sAppModulePath: "fin/cash/flow/analyzer",

		/**
		 * Initializes the mock server. You can configure the delay with the URL parameter "serverDelay"
		 * The local mock data in this folder is returned instead of the real data for testing.
		 *
		 * @public
		 */

		init: function() {
			var oUriParameters = jQuery.sap.getUriParameters(),
				oMockServer = new MockServer({
					rootUri: this._sServiceUrl
				});

			var sMetadataPath = jQuery.sap.getModulePath(this._sMetadataAddress);
			var sMockdataPath = jQuery.sap.getModulePath(this._sModulePath);
			
			// configure mock server with a delay of 1s
			MockServer.config({
				autoRespond: true,
				autoRespondAfter: (oUriParameters.get("serverDelay") || 1000)
			});

			// load local mock data
			oMockServer.simulate(sMetadataPath + "/metadata.xml", {
				sMockdataBaseUrl: sMockdataPath
			});
			
			var aRequests = oMockServer.getRequests();

			// aRequests.push({

			// 	method: "GET",

			// 	path: new RegExp("GetActionPrivilege"),

			// 	response: function(oXhr) {
			// 		jQuery.sap.log.debug("MockServer: incoming create request for url: " + oXhr.url);
			// 	    return oXhr.respond(200, {
			// 				"Content-Type": "application/json;charset=utf-8"
			// 			}, JSON.stringify({
			// 				d: {
			// 					"GetActionPrivilege": {
			// 						"__metadata": {
			// 							"type": "FCLM_CASH_FLOW_ANALYZER_SRV.ActionPrivilege"
			// 						},
			// 						"CustMaintable": "X",
			// 						"VendMaintable": "X",
			// 						"CustVisible": "X",
			// 						"VendVisible": "X",
			// 						"UserName": "Xiecl",
			// 						"PrpsCreatable": "X"
			// 					}
			// 				}
			// 			}));
			// 	}

			// });

			// aRequests.push({

			// 	method: "GET",

			// 	path: new RegExp("CheckProposal\\?RunDate=(.*)&RunID=(.*)&PaymentRun=(.*)&IgnoreFldList=(.*)"),

			// 	response: function(oXhr,rundate,runid,payt,ignore) {
			// 		jQuery.sap.log.debug("MockServer: incoming create request for url: " + oXhr.url);
			// 		if(ignore !== "'POST_DATE'"){
			// 	    return oXhr.respond(200, {
			// 				"Content-Type": "application/json;charset=utf-8"
			// 			}, JSON.stringify({
			// 				d: {
			// 					"results": [
			// 					{									
			// 						"Entity_Set_Name": "PaytProposalSet",
			// 						"Entity_Usage": "",
			// 						"Ignore_Field": "POST_DATE",
			// 						"New_Value": "",
			// 						"Table_Index": "0000000000",
			// 						"RunDate": "20160703",
			// 						"RunID": "ST001",
			// 						"Counter": "0000000000",
			// 						"MsgTy": "W",
			// 						"MsgNo": "029",
			// 						"MsgV1": "",
			// 						"MsgV2": "",
			// 						"MsgV3": "",
			// 						"MsgV4": "",
			// 						"MsgID": "FAP_SPP",
			// 						"MessageText": "Posting date is in the past. Do you want to continue?",
			// 						"FieldName": "PostingDate"
			// 					}
			// 					]
			// 				}
			// 			}));
			// 	} else {
			// 		return oXhr.respond(200, {
			// 			"Content-Type": "application/json;charset=utf-8"
			// 		}, JSON.stringify({
			// 			d: {
			// 			}
			// 		}));
			// 		}
			// }

			// });

			// aRequests.push({

			// 	method: "GET",

			// 	path: new RegExp("ScheduleProposal/?((.*)?)?"),

			// 	response: function(oXhr) {
			// 		jQuery.sap.log.debug("MockServer: incoming create request for url: " + oXhr.url);
			// 	    return oXhr.respond(200, {
			// 				"Content-Type": "application/json;charset=utf-8"
			// 			}, JSON.stringify({
			// 				d: {
			// 					"results":[]
			// 				}
			// 			}));
			// 	}

			// });

			// aRequests.push({

			// 	method: "GET",

			// 	path: new RegExp("FreeSelFieldSet/?((.*)?)?"),

			// 	response: function(oXhr) {
			// 		jQuery.sap.log.debug("MockServer: incoming create request for url: " + oXhr.url);
			// 	    return oXhr.respond(200, {
			// 				"Content-Type": "application/json;charset=utf-8"
			// 			}, JSON.stringify({
			// 				d: {
			// 					"results":[]
			// 				}
			// 			}));
			// 	}

			// });

			// aRequests.push({

			// 	method: "GET",

			// 	path: new RegExp("CheckRunDateAndID\\?RunDate=(.*)&RunID=(.*)&IgnoreFldList=(.*)"),

			// 	response: function(oXhr) {
			// 		jQuery.sap.log.debug("MockServer: incoming create request for url: " + oXhr.url);
			// 	    return oXhr.respond(200, {
			// 				"Content-Type": "application/json;charset=utf-8"
			// 			}, JSON.stringify({
			// 				d: {
			// 				}
			// 			}));
			// 	}

			// });
			
			// aRequests.push({

			// 	method: "GET",

			// 	path: new RegExp("CheckDDSEPA\\?CompanyCodeList=(.*)&PaymentMethodList=(.*)"),

			// 	response: function(oXhr) {
			// 		jQuery.sap.log.debug("MockServer: incoming create request for url: " + oXhr.url);
			// 	    return oXhr.respond(200, {
			// 				"Content-Type": "application/json;charset=utf-8"
			// 			}, JSON.stringify({
			// 				d: {
			// 					"CheckDDSEPA": {
			// 						"__metadata": {
			// 							"type": "FCLM_CASH_FLOW_ANALYZER_SRV.ActionPrivilege"
			// 						},
			// 						"Visible": false
			// 					}
			// 				}
			// 			}));
			// 	}

			// });

			// aRequests.push({

			// 	method: "GET",

			// 	path: new RegExp("DeleteProposal/?((.*)?)?"),

			// 	response: function(oXhr) {
			// 		jQuery.sap.log.debug("MockServer: incoming create request for url: " + oXhr.url);
			// 	    return oXhr.respond(200, {
			// 				"Content-Type": "application/json;charset=utf-8"
			// 			}, JSON.stringify({
			// 				d: {
			// 				}
			// 			}));
			// 	}

			// });
			
			// aRequests.push({
			// 	method: "GET",
			// 	path: new RegExp("CheckEditLock/?((.*)?)?"),

			// 	response: function(oXhr) {
			// 		jQuery.sap.log.debug("MockServer: incoming create request for url: " + oXhr.url);
			// 	    return oXhr.respond(200, {
			// 				"Content-Type": "application/json;charset=utf-8"
			// 			}, JSON.stringify({
			// 				d: {
			// 				    "__batchResponses": [
			// 				                         {
			// 				                             "data": {
			// 				                                 "results": []
			// 				                             }
			// 				                         }
			// 				                     ]
			// 				                 }
			// 			}));
			// 	}

			// });

			// aRequests.push({

			// 	method: "GET",

			// 	path: new RegExp("GetPaytMethList/?((.*)?)?"),

			// 	response: function(oXhr) {
			// 		jQuery.sap.log.debug("MockServer: incoming create request for url: " + oXhr.url);
			// 	    return oXhr.respond(200, {
			// 				"Content-Type": "application/json;charset=utf-8"
			// 			}, JSON.stringify( {
			// 			    "d": {
			// 			            "__batchResponses": [
			// 			                {
			// 			                    "data": {
			// 			                        "results": [
			// 			                            {
			// 			                                "Land1": "US",
			// 			                                "Text2": "Bank transfer (ACH CCD)",
			// 			                                "Zlsch": "2"
			// 			                            },
			// 			                            {
			// 			                                "Land1": "US",
			// 			                                "Text2": "ISO PAIN.001",
			// 			                                "Zlsch": "4"
			// 			                            },
			// 			                            {
			// 			                                "Land1": "US",
			// 			                                "Text2": "Check",
			// 			                                "Zlsch": "C"
			// 			                            },
			// 			                            {
			// 			                                "Land1": "US",
			// 			                                "Text2": "Bank transfer (ACH CCD)",
			// 			                                "Zlsch": "D"
			// 			                            },
			// 			                            {
			// 			                                "Land1": "US",
			// 			                                "Text2": "ISO PAIN.001 Credit Transfer",
			// 			                                "Zlsch": "I"
			// 			                            },
			// 			                            {
			// 			                                "Land1": "US",
			// 			                                "Text2": "Bank transfer (ACH PPD)",
			// 			                                "Zlsch": "U"
			// 			                            },
			// 			                            {
			// 			                                "Land1": "US",
			// 			                                "Text2": "Bank transfer (ACH CTX)",
			// 			                                "Zlsch": "T"
			// 			                            }
			// 			                        ]
			// 			                    }
			// 			                }
			// 			            ]
			// 			    }
			// 			} ));
			// 	}

			// });
			
			oMockServer.setRequests(aRequests);

			oMockServer.start();

			jQuery.sap.log.info("Running the app with mock data");
		}
	};

});