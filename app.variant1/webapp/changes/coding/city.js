sap.ui.define(
    [
        'sap/ui/core/mvc/ControllerExtension',
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator"
    ],
    function (ControllerExtension, Filter, FilterOperator) {
        'use strict';
        return ControllerExtension.extend("customer.app.variant1.city", {
            overrides: {
                onBeforeRebindTableExtension: function () {
                    console.log("EXTENSION onBefore RebindTableExtension");
                },
            },
            onInit: function () {
                var oSmartFilterBar = this.getView().byId(
                    "mdm.md.customer.manage::sap.suite.ui.generic.template.ListReport.view.ListReport::C_BusinessPartnerCustomer--listReportFilter"
                ); 
                
                if (oSmartFilterBar) {
                    console.log("SmartFilterBar found and event attached.");
                    oSmartFilterBar.attachFilterChange(this.onFilterChange, this);
                } else {
                    console.error("SmartFilterBar not found");
                }
            },

            onFilterChange: function (oEvent) {
                console.log("Filter changed");

                var oSmartTable = this.getView().byId(
                    "mdm.md.customer.manage::sap.suite.ui.generic.template.ListReport.view.ListReport::C_BusinessPartnerCustomer--responsiveTable"
                ); 
                
                if (!oSmartTable) {
                    console.error("SmartTable not found");
                    return;
                }

                var oBinding = oSmartTable.getTable().getBinding("items");
                if (!oBinding) {
                    console.error("Binding is undefined");
                    return;
                }

                var oFilterField = this.getView().byId(
                    "mdm.md.customer.manage::sap.suite.ui.generic.template.ListReport.view.ListReport::C_BusinessPartnerCustomer--listReport-CityName-header"
                );

                if (!oFilterField) {
                    console.error("City filter field not found");
                    return;
                }

                var sCityValue = oFilterField.getValue(); 
                console.log("City filter value:", sCityValue);

                if (sCityValue && sCityValue.toLowerCase() !== "coimbatore") {
                    console.log("Clearing filter");
                    oBinding.filter(null);
                } else {
                    console.log("Applying filter for Coimbatore");
                    var oCityFilter = new Filter("City", FilterOperator.EQ, "Coimbatore");
                    oBinding.filter([oCityFilter]);
                }
            }
        });
    }
);
