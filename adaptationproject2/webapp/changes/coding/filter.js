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
        return ControllerExtension.extend("customer.adaptationproject2.filter", {
            
           

            override: {
                // Override public method of the ListReport controller
                templateBaseExtension: {
                  addFilters: function (fnAddFilter, sControlId) {
                      // var oView = this.base.getView();
                      // var oComboBox = oView.byId("customFilterConfiguse"); // Use view.byId() instead of getCore()
                      // custom logic
                        let namespace = this.getMetadata()?.getNamespace();
                        let oComboBox = this.base.byId(
                        namespace + ".customFilterComboBoxuse"
                      );
                      if (!oComboBox) {
                          console.warn("Custom filter ComboBox not found.");
                          return;
                      }else{
                        console.log("combobox found" + oComboBox );
                      }
              
                      var sSelectedKey = oComboBox.getSelectedKey();
                      var oFilter = null;
                      console.log(sSelectedKey)
              
                      switch (sSelectedKey) {
                          case "WXYZ":
                              oFilter = new Filter("C_BusinessPartnerCustomer", FilterOperator.Contains, "WXYZ");
                              console.log(oFilter)
                              break;
                          case "banglore":
                              oFilter = new Filter("CityName", FilterOperator.EQ, "Bangalore");
                              break;
                          default:
                              console.warn("No valid filter selected.");
                              return;
                      }
              
                      if (oFilter) {
                          fnAddFilter(oFilter);
                      }
                  }
                   /**

                * Can be used to store specific state by calling fnSetAppStateData(oControllerExtension, oAppState).

                * oControllerExtension must be the ControllerExtension instance for which the state should be stored.                * oAppState is the state to be stored.

                */

                // provideExtensionAppStateData: function (fnSetAppStateData) {

                //     let namespace = this.getMetadata()?.getNamespace();
                //         let oComboBox = this.base.byId(
                //         namespace + ".customFilterComboBoxuse"
                //       );

                //     var sSelectedKey = oComboBox.getSelectedKey();

                                

                //     fnSetAppStateData(this, {

                //         customApprovalFilter: sSelectedKey

                //     });

                // },



                // /**

                // * Allows extensions to restore their state according to a state which was previously stored.

                // */

                // restoreExtensionAppStateData: function (fnGetAppStateData) {

                //     var oExtensionData = fnGetAppStateData(this);

                //     if(oExtensionData) {

                //         this.byId(".customFilterComboBoxuse").setSelectedKey(oExtensionData.customApprovalFilter);

                //     }

                // }

              }
              
              },
            //   onOpenCustom: function () {
            //     var oView = this.getView();
    
            //     if (!this.pDialog) {
            //         this.pDialog = Fragment.load({
            //             id: oView.getId(),
            //             name: "my.adaptation.fragments.CustomDetail",
            //             controller: this
            //         }).then(function (oDialog) {
            //             oView.addDependent(oDialog);
            //             return oDialog;
            //         });
            //     }
            //     this.pDialog.then(function (oDialog) {
            //         oDialog.open();
            //     });
            // },
    
            // onCloseCustom: function (oEvent) {
            //     oEvent.getSource().getParent().close();
            // }
        });
    }
);
