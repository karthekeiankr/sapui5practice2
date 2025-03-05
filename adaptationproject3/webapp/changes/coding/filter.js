sap.ui.define(
    [
        'sap/ui/core/mvc/ControllerExtension',
         "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator"
        // ,'sap/ui/core/mvc/OverrideExecution'
    ],
    function (
        ControllerExtension,
        Filter, FilterOperator
        // ,OverrideExecution
    ) {
        'use strict';
        return ControllerExtension.extend("customer.adaptationproject3.filter", {
            override: {
                // Override public method of the ListReport controller
                templateBaseExtension: {
                  addFilters: function (fnAddFilter, sControlId) {
                        let namespace = this.getMetadata()?.getNamespace();
                        let oComboBox = this.base.byId(
                        namespace + ".customFilterComboBoxuse"
                      );

                      let oTable = this.getView().byId("mdm.md.customer.manage::sap.suite.ui.generic.template.ListReport.view.ListReport::C_BusinessPartnerCustomer--responsiveTable"); // Replace with actual table ID

                      if (!oTable) {
                          console.error("Table not found!");
                          return;
                      }
          
                      let oBinding = oTable.getBinding("items");
                      if (!oBinding) {
                          console.warn("Table binding is not yet available. Delaying filter application...");
                          setTimeout(() => this.addFilters(fnAddFilter, sControlId), 500);
                          return;
                      }
          
                    
                     if (!oComboBox) {
                          console.warn("Custom filter ComboBox not found.");
                          return;
                      }else{
                        console.log("combobox found" + oComboBox );
                      }
              
                      var sSelectedKey = oComboBox.getSelectedKey();
                      let aFilters = [];
          
                      console.log("Selected Key: ", sSelectedKey);
          
                      if (sSelectedKey === "coimbatore") {
                          aFilters.push(new Filter("CityName", FilterOperator.EQ, "coimbatore"));
                      } else if (sSelectedKey === "banglore") {
                          aFilters.push(new Filter("CityName", FilterOperator.EQ, "Bangalore"));
                      }
                      console.log(CityName)
                      if (aFilters.length > 0) {
                          console.log("Applying filters: ", aFilters);
                          oBinding.filter(aFilters);
                      } else {
                          console.warn("No valid filter selected.");
                      }
                  }
                }
            
        // onInit: function () {
        //     this.applyCustomFilters();
        //     console.log("oninit")
        // },
        // onFilterChange: function () {
        //     this.applyCustomFilters();
        //     console.log("onfilterchange")
        // },
        // applyCustomFilters: function () {
        //     console.log("filter")
        //     let oTable = this.getView().byId("yourTableId"); // Replace with actual table ID

        //     if (!oTable) {
        //         console.error("Table not found!");
        //         return;
        //     }

        //     let oBinding = oTable.getBinding("items");
        //     if (!oBinding) {
        //         console.error("Table binding not found!");
        //         return;
        //     }

        //     // Get selected filter value
        //     let sSelectedKey = this.getView().byId("customFilterComboBoxuse").getSelectedKey();
        //     let aFilters = [];

        //     console.log("Selected Key: ", sSelectedKey);

        //     if (sSelectedKey === "coimbatore") {
        //         aFilters.push(new Filter("CityName", FilterOperator.EQ, "coimbatore"));
        //     } else if (sSelectedKey === "banglore") {
        //         aFilters.push(new Filter("CityName", FilterOperator.EQ, "Bangalore"));
        //     }

        //     if (aFilters.length > 0) {
        //         console.log("Applying filters: ", aFilters);
        //         oBinding.filter(aFilters);
        //     } else {
        //         console.warn("No valid filter selected.");
        //     }
        // }
        }

    });
});
