sap.ui.define(
    [
        'sap/ui/core/mvc/ControllerExtension'
        // ,'sap/ui/core/mvc/OverrideExecution'
    ],
    function (
        ControllerExtension
        // ,OverrideExecution
    ) {
        'use strict';
        return ControllerExtension.extend("customer.adaptationproject1.city", {
        override: {
            onInit: function () {
                console.log("hai")
                // var oSmartFilterBar = this.getView().byId(
                //     "mdm.md.customer.manage::sap.suite.ui.generic.template.ListReport.view.ListReport::C_BusinessPartnerCustomer--listReportFilter"
                // ); 
                
                // if (oSmartFilterBar) {
                //     console.log("SmartFilterBar found and event attached.");
                //     oSmartFilterBar.attachFilterChange(this.onFilterChange, this);
                // } else {
                //     console.error("SmartFilterBar not found");
                // }
            }

           

        }


            
        });
    }
);
