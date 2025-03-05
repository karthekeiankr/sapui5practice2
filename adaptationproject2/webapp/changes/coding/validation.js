sap.ui.define(
    [
        'sap/ui/core/mvc/ControllerExtension',
        'sap/m/MessageToast'
        // ,'sap/ui/core/mvc/OverrideExecution'
    ],
    function (
        ControllerExtension,
        MessageToast
        // ,OverrideExecution
    ) {
        'use strict';
        return ControllerExtension.extend("customer.adaptationproject2.validation", {

            override: {
                onInit: function () {
                    let oModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/C_MYCHEMICALAPPROVALSLIST_CDS/");    
                    oModel.read("/C_CHAStatus_InputHelp", {
                        success: function (oData) {
                            console.log("Fetched Data:", oData.results);
     
                            if (oData.results.length > 0) {
                                this.sChemicalStatus = parseFloat(oData.results[3].ChemicalApprovalStatus) || 0;
                                console.log("Stored ChemicalApprovalStatus for validation:", this.sChemicalStatus);
                            } else {
                                console.warn("No data found in C_CHAStatus_InputHelp.");
                            }
                        }.bind(this),
                        error: function (oError) {
                            console.error("Error fetching ChemicalApprovalStatus:", oError);
                        }
                    });
                },
 
                beforeSaveExtension: function () {
                    let creditWorthinessScore = sap.ui.getCore().byId(
                        "mdm.md.customer.manage::sap.suite.ui.generic.template.ObjectPage.view.Details::C_BusinessPartnerCustomer--com.sap.vocabularies.UI.v1.FieldGroup::Basic2::OrganizationBPName2::Field"
                    );
                    
                    return new Promise((resolve, reject) => {
                        let enteredValue = parseFloat(creditWorthinessScore?.getValue()) || 0;
     
                        if (!enteredValue) {
                            console.log("Enter value");
                            MessageToast.show("Enter the value");
                            reject();
                        } else if (enteredValue >= this.sChemicalStatus) {
                            console.log("Entered value exceeds allowed limit");
                            MessageToast.show("Value must be less than " + this.sChemicalStatus);
                            reject();
                        } else {
                            MessageToast.show("Value Entered Successfully");
                            console.log("Value entered:", enteredValue);
                            resolve();
                        }
                    });
                }
            }
                // beforeSaveExtension: function () {
                //     console.log("onBefore Save");
                //     let input = sap.ui.getCore().byId("mdm.md.customer.manage::sap.suite.ui.generic.template.ObjectPage.view.Details::C_BusinessPartnerCustomer--com.sap.vocabularies.UI.v1.FieldGroup::Basic2::OrganizationBPName3::Field");
                //     return new Promise((resolve,reject)=>{
                //         if(!input?.getValue()){
                //             MessageToast.show("Enter value");
                //             console.log("enter")
                //             reject();
                //         }
                //         else{
                //             MessageToast.show("Entered the Value");
                //             console.log("value ")
                //             resolve();
                //         }
                //     })

                    
                
         
            // metadata: {
            // 	// extension can declare the public methods
            // 	// in general methods that start with "_" are private
            // 	methods: {
            // 		publicMethod: {
            // 			public: true /*default*/ ,
            // 			final: false /*default*/ ,
            // 			overrideExecution: OverrideExecution.Instead /*default*/
            // 		},
            // 		finalPublicMethod: {
            // 			final: true
            // 		},
            // 		onMyHook: {
            // 			public: true /*default*/ ,
            // 			final: false /*default*/ ,
            // 			overrideExecution: OverrideExecution.After
            // 		},
            // 		couldBePrivate: {
            // 			public: false
            // 		}
            // 	}
            // },
            // // adding a private method, only accessible from this controller extension
            // _privateMethod: function() {},
            // // adding a public method, might be called from or overridden by other controller extensions as well
            // publicMethod: function() {},
            // // adding final public method, might be called from, but not overridden by other controller extensions as well
            // finalPublicMethod: function() {},
            // // adding a hook method, might be called by or overridden from other controller extensions
            // // override these method does not replace the implementation, but executes after the original method
            // onMyHook: function() {},
            // // method public per default, but made private via metadata
            // couldBePrivate: function() {},
            // // this section allows to extend lifecycle hooks or override public methods of the base controller
            // override: {
            // 	/**
            // 	 * Called when a controller is instantiated and its View controls (if available) are already created.
            // 	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
            // 	 * @memberOf {{controllerExtPath}}
            // 	 */
            // 	onInit: function() {
            // 	},
            // 	/**
            // 	 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
            // 	 * (NOT before the first rendering! onInit() is used for that one!).
            // 	 * @memberOf {{controllerExtPath}}
            // 	 */
            // 	onBeforeRendering: function() {
            // 	},
            // 	/**
            // 	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
            // 	 * This hook is the same one that SAPUI5 controls get after being rendered.
            // 	 * @memberOf {{controllerExtPath}}
            // 	 */
            // 	onAfterRendering: function() {
            // 	},
            // 	/**
            // 	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
            // 	 * @memberOf {{controllerExtPath}}
            // 	 */
            // 	onExit: function() {
            // 	},
            // 	// override public method of the base controller
            // 	basePublicMethod: function() {
            // 	}
            // }
        });
    }
);
