sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library"
],
function (Controller,JSONModel,Spreadsheet,exportLibrary) {
    "use strict";

    return Controller.extend("dmixmtable.controller.View1", {
        onInit: function () {
            var oTotalsModel = new JSONModel({
                DieselAmount: 0,
                GLNQTY: 0,
                KMQTY: 0,
                TyreAmount: 0,
                MaintenanceAmount: 0,
                SalaryAmount: 0,
                FeesAmount: 0,
                InsuranceAmount: 0,
                OtherAmount: 0,
                CUBMTR: 0,
                DieselPerKm: 0,
                TyrePerKm: 0,
                MaintenancePerKm: 0,
                SalaryPerKm: 0,
                FeesPerKm: 0,
                InsurancePerKm: 0,
                OthersPerKm: 0,
                TotalCostPerKm: 10,
                TRIPS: 0,
                AveragePerLoad: 0
            });

            this.getView().setModel(oTotalsModel, "totalsModel");
        },

        onAfterRendering: function () {
            this.calculateColumnTotals();

            var that = this; // Preserve reference to `this`
    
            // Ensure that the function runs after rendering
            setTimeout(function () {
                that.addTotalsRow();
            }, 500); // Slight delay to ensure UI elements are ready
        },
        calculateColumnTotals: function () {
            return new Promise((resolve, reject) => {
                var oTable = this.getView().byId("equipmentcostcentre");
        
                if (!oTable) {
                    console.error("Table not found.");
                    reject();
                    return;
                }
        
                var oBinding = oTable.getBinding("items");
                if (!oBinding) {
                    console.warn("Table binding not found.");
                    reject();
                    return;
                }
        
                // Fetch all contexts synchronously (for OData V2 / JSONModel)
                var aContexts = oBinding.getContexts(0, oBinding.getLength());
        
                var oTotals = {
                    DieselAmount: 0,
                    GLNQTY: 0,
                    KMQTY: 0,
                    TyreAmount: 0,
                    MaintenanceAmount: 0,
                    SalaryAmount: 10,
                    FeesAmount: 0,
                    InsuranceAmount: 0,
                    OtherAmount: 0,
                    CUBMTR: 0,
                    DieselPerKm: 0,
                    TyrePerKm: 0,
                    MaintenancePerKm: 0,
                    SalaryPerKm: 10,
                    FeesPerKm: 0,
                    InsurancePerKm: 0,
                    OthersPerKm: 0,
                    TotalCostPerKm: 0,
                    TRIPS: 0,
                    AveragePerLoad: 0
                };
        
                // Iterate over the contexts and accumulate totals
                aContexts.forEach(function (oContext) {
                    var oData = oContext.getObject();
                    if (oData) {
                        Object.keys(oTotals).forEach((key) => {
                            oTotals[key] += parseFloat(oData[key]) || 0;
                        });
                    }
                });
        
                // Format totals to 2 decimal places
                Object.keys(oTotals).forEach((key) => {
                    oTotals[key] = Number(oTotals[key]).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                });
        
                // Additional Calculation: SalaryEfficiency = SalaryAmount / SalaryPerKm
                if (parseFloat(oTotals.SalaryPerKm) !== 0) {
                    oTotals.SalaryEfficiency = (parseFloat(oTotals.SalaryAmount) / parseFloat(oTotals.SalaryPerKm)).toFixed(2);
                } else {
                    oTotals.SalaryEfficiency = "N/A";
                }
        
                // Update the totals model
                var oTotalsModel = this.getView().getModel("totalsModel");
                if (!oTotalsModel) {
                    oTotalsModel = new sap.ui.model.json.JSONModel();
                    this.getView().setModel(oTotalsModel, "totalsModel");
                }
                oTotalsModel.setData(oTotals);
        
                console.log("Totals calculated:", oTotals);
                resolve();
            });
        },
        
        
        downloadExcel: function () {
            var that = this;
        
            // Check if XLSX is already loaded
            if (typeof XLSX === "undefined") {
                jQuery.sap.require("sap.ui.thirdparty.jquery");
                jQuery.getScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.3/xlsx.full.min.js")
                    .done(function () {
                        console.log("XLSX library loaded successfully.");
                        that.exportToExcel(); // Call export function after loading XLSX
                    })
                    .fail(function () {
                        console.error("Failed to load XLSX library.");
                        sap.m.MessageToast.show("Failed to load Excel library!");
                    });
                return;
            }
        
            this.exportToExcel(); // Call export function if XLSX is already available
        },
        

        exportToExcel: function () {
            var oTable = this.byId("equipmentcostcentre"); // Main Table ID
            var oTotalsTable = this.byId("totalsTable"); // Totals Table ID
        
            var aColumns = [];
            var aData = [];
        
            // Extract column headers
            var aTableColumns = oTable.getColumns();
            aTableColumns.forEach(function (oColumn) {
                var sColumnHeader = oColumn.getHeader().getText();
                aColumns.push(sColumnHeader);
            });
        
            // Extract all rows from sap.m.Table
            var aTableRows = oTable.getItems(); 
            if (!aTableRows || aTableRows.length === 0) {
                sap.m.MessageToast.show("No data available to export!");
                return;
            }
        
            // Extract row data
            aTableRows.forEach(function (oRow) {
                var aRow = [];
                var aCells = oRow.getCells();
                
                aCells.forEach(function (oCell) {
                    if (oCell.getText) {
                        aRow.push(oCell.getText()); // Extract text from each cell
                    } else {
                        aRow.push("");
                    }
                });
        
                aData.push(aRow);
            });
        
            // Add totals row separator
            aData.push([]);
            aData.push(["TOTALS"]);
        
            // Extract totals table data (if available)
            if (oTotalsTable) {
                var aTotalRowData = oTotalsTable.getItems()[0].getCells();
                var aTotalValues = [];
        
                aTotalRowData.forEach(function (oCell) {
                    aTotalValues.push(oCell.getText());
                });
        
                aData.push(aTotalValues);
            }
        
            // Create a worksheet
            var ws = XLSX.utils.aoa_to_sheet([aColumns, ...aData]);
        
            // Create a workbook and add the worksheet
            var wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Cost Centre Data");
        
            // Save the file
            XLSX.writeFile(wb, "CostCentreData.xlsx");
            
            sap.m.MessageToast.show("Export successful!");
        },
        onCompanyCodeValueHelpRequest: function (oEvent) {
            var oInput = oEvent.getSource();
            var sProperty = "CompanyCode";
            var sFieldName = "I_CompanyCodeStdVH";

            if (!this._oCompanyCodeValueHelpDialog) {
                this._oCompanyCodeValueHelpDialog = new sap.m.SelectDialog({
                    title: "Select Company Code",
                    items: {
                        path: '/' + sFieldName,
                        template: new sap.m.StandardListItem({
                            title: "{" + sProperty + "}"
                        })
                    },
                    search: function (oEvent) {
                        var sValue = oEvent.getParameter("value");
                        var oFilter = new Filter("title", FilterOperator.Contains, sValue);
                        oEvent.getSource().getBinding("items").filter([oFilter]);
                    },
                    confirm: function (oEvent) {
                        var oSelectedItem = oEvent.getParameter("selectedItem");
                        if (oSelectedItem) {
                            oInput.setValue(oSelectedItem.getTitle());
                        }
                    },
                    cancel: function () {
                        oInput.setValue(""); // Optionally reset the input field
                        if (this._oCompanyCodeValueHelpDialog) {
                            this._oCompanyCodeValueHelpDialog.destroy(); // Destroy the dialog
                            this._oCompanyCodeValueHelpDialog = null; // Clean up the reference
                        }
                    },
                    contentHeight: "200px"
                });
                this._oCompanyCodeValueHelpDialog.setModel(this.getView().getModel());
            }

            this._oCompanyCodeValueHelpDialog.open();
        },
        // f4 help for the Customer Number filter
        onCustomerValueHelpRequest: function (oEvent) {
            var oInput = oEvent.getSource();
            var sProperty = "Customer";
            var sFieldName = "ZFI_BA_CUST_ST_OPN_ITM_CUST_VH";

            if (!this._oCustomerValueHelpDialog) {
                this._oCustomerValueHelpDialog = new sap.m.SelectDialog({
                    title: "Select Customer",
                    items: {
                        path: '/' + sFieldName,
                        template: new sap.m.StandardListItem({
                            title: "{" + sProperty + "}"
                        })
                    },
                    liveChange: function (oEvent) {
                        var sValue = oEvent.getParameter("value");
                        var oFilter = new Filter(sProperty, FilterOperator.Contains, sValue); // Fixed property name

                        var oBinding = oEvent.getSource().getBinding("items");
                        if (oBinding) {
                            oBinding.filter([oFilter]); // Apply filter properly
                        }
                    },
                    confirm: function (oEvent) {
                        var oSelectedItem = oEvent.getParameter("selectedItem");
                        if (oSelectedItem) {
                            oInput.setValue(oSelectedItem.getTitle());
                        }
                    },
                    cancel: function () {
                        oInput.setValue(""); // Optionally reset the input field
                        if (this._oCustomerValueHelpDialog) {
                            this._oCustomerValueHelpDialog.destroy(); // Destroy the dialog
                            this._oCustomerValueHelpDialog = null; // Clean up the reference
                        }
                    },
                    contentHeight: "200px"
                });
                this._oCustomerValueHelpDialog.setModel(this.getView().getModel());
            }

            this._oCustomerValueHelpDialog.open();
        },
        // Search function for Filter
        onSearch: function () {
            var oView = this.getView();
            var oModel = oView.getModel(); // Get the OData model
        
            // Reset unsaved changes before performing search
            if (oModel && oModel.hasPendingChanges()) {
                oModel.resetChanges(); // Discard all unsaved changes
            }

            var oTable = oView.byId("equipmentcostcentre");
            var container = oView.byId("scrollcontainer");

            // Get filter values
            var sCompanyCode = oView.byId("companyCodeItem");
            var sFiscalYear = oView.byId("fiscalYearItem");
            var sCustomer = oView.byId("customerItem");
            var oDateRange = oView.byId("docDateItem");
            // Get values
            var sCompanyCodeValue = sCompanyCode.getValue().trim();
            var sFiscalYearValue = sFiscalYear.getValue().trim();
            var sCustomerValue = sCustomer.getValue().trim();
            var oDateRangeValue = oDateRange.getDateValue(); // Start Date
            var oEndDateValue = oDateRange.getSecondDateValue(); // End Date

            // Validation for mandatory fields
            var bValid = true;

            if (!sCompanyCodeValue) {
                sCompanyCode.setValueState("Error");
                sCompanyCode.setValueStateText("Company Code is required");
                bValid = false;
            } else {
                sCompanyCode.setValueState("None");
            }

            if (!sCustomerValue) {
                sCustomer.setValueState("Error");
                sCustomer.setValueStateText("Customer is required");
                bValid = false;
            } else {
                sCustomer.setValueState("None");
            }

            if (!oDateRangeValue || !oEndDateValue) {
                oDateRange.setValueState("Error");
                oDateRange.setValueStateText("Document Date range is required");
                bValid = false;
            } else {
                oDateRange.setValueState("None");
            }
            // Stop execution if validation fails
            if (!bValid) {
                sap.m.MessageToast.show("Please fill all mandatory fields");
                return;
            }

            this.sCustomer = sCustomerValue;
            this.oDateRange = oDateRangeValue;
            this.oEndDate = oEndDateValue;

            // Update the header text dynamically
            this.onSearchCust().then(() => {
                var oTitle = this.getView().byId("dynamicheadertext");
                var formattedHeader = `Statement of Account: ${this.sCustomer} - ${this.CustomerName} Starting From ${this._formatDatedata(this.oDateRange)} to ${this._formatDatedata(this.oEndDate)}`;
                if (oTitle) {
                    oTitle.setText(formattedHeader);
                }
            });

            var aFilters = [];
            if (sCompanyCodeValue) {
                aFilters.push(new Filter("CompanyCode", FilterOperator.EQ, sCompanyCodeValue));
            }
            if (sFiscalYearValue) {
                aFilters.push(new Filter("FiscalYear", FilterOperator.EQ, sFiscalYearValue));
            }
            if (sCustomerValue) {
                aFilters.push(new Filter("Customer", FilterOperator.EQ, sCustomerValue));
            }
            if (oDateRangeValue && oEndDateValue) {
                aFilters.push(new Filter("DocumentDate", FilterOperator.BT, this._formatDate(oDateRangeValue), this._formatDate(oEndDateValue)));
            } else if (oDateRangeValue) {
                aFilters.push(new Filter("DocumentDate", FilterOperator.EQ, this._formatDate(oDateRangeValue)));
            }

            // Get table binding and apply filters
            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                oBinding.filter(aFilters);
            }
            
            this.calculateTotal().then(()=>{
                this.onUpdateBalance()
                container.setVisible(true);
            })
        },
        // format date in format of "YYYY-MM-DD"
        _formatDate: function (oDate) {
            if (!oDate) return null;
            return oDate.toISOString().split('T')[0]; // "YYYY-MM-DD"
        },

        // format date in format od "DD-MM-YYYY" 
        _formatDatedata: function (oDate) {
            if (!oDate) return null;
            // return oDate.toISOString().split('T')[0]; // "YYYY-MM-DD"
            var date = new Date(oDate);
            if (isNaN(date)) return oDate; // Return original value if invalid

            var day = String(date.getDate()).padStart(2, '0');
            var month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
            var year = date.getFullYear(); // Full 4-digit year

            return `${day}-${month}-${year}`;
        },
        onSearchCust: function() {
            return new Promise((resolve, reject) => {
                var oModel = this.getView().getModel(); // Get OData V4 model
                // console.log(oModel);
                
                var sCustomerNumber = this.byId("customerItem").getValue(); // Ensure this is correct
                
                if (!sCustomerNumber) {
                    sap.m.MessageToast.show("Please enter a customer number.");
                    return;
                }
            
                var sPath = `/ZFI_BA_CUST_ST_OPN_ITM_CUST_VH('${sCustomerNumber}')`; // Adjust entity name
                var that = this; 
                var oContextBinding = oModel.bindContext(sPath); // Bind the context
                oContextBinding.requestObject().then(function(oData) {
                    if (oData) {
                        that.CustomerName = oData.CustomerName;
                        // console.log("Customer Name:", that.CustomerName);
                    } else {
                        sap.m.MessageToast.show("Customer not found.");
                    }
                    resolve()
                }).catch(function(oError) {
                    console.error("Error fetching customer:", oError);
                    reject(oError)
                });
            });
        },
        addTotalsRow: function () {
            var oTable = this.getView().byId("equipmentcostcentre");
        
            if (!oTable) {
                console.error("Table not found.");
                return;
            }
        
            var oModel = oTable.getModel();
            var sPath = oTable.getBinding("items").getPath(); // Get the binding path (e.g., "/TableData")
        
            if (!oModel) {
                console.warn("Model not found.");
                return;
            }
        
            var aData = oModel.getProperty(sPath) || [];
        
            if (aData.length === 0) {
                sap.m.MessageToast.show("No data available to calculate totals!");
                return;
            }
        
            // Initialize totals
            var oTotals = {
                Equipment: "TOTAL",  // Label for the total row
                CostCentre: "",
                DieselAmount: 0,
                GLNQTY: 0,
                KMQTY: 0,
                TyreAmount: 0,
                MaintenanceAmount: 0,
                SalaryAmount: 0,
                FeesAmount: 0,
                InsuranceAmount: 0,
                OtherAmount: 0,
                CUBMTR: 0,
                DieselPerKm: 0,
                TyrePerKm: 0,
                MaintenancePerKm: 0,
                SalaryPerKm: 0,
                FeesPerKm: 0,
                InsurancePerKm: 0,
                OthersPerKm: 0,
                TotalCostPerKm: 0,
                TRIPS: 0,
                AveragePerLoad: 0
            };
        
            // Calculate totals for each column
            aData.forEach((item) => {
                Object.keys(oTotals).forEach((key) => {
                    if (key !== "Equipment" && key !== "CostCentre") { // Exclude non-numeric fields
                        oTotals[key] += parseFloat(item[key]) || 0;
                    }
                });
            });
        
            // Format numbers to 2 decimal places
            Object.keys(oTotals).forEach((key) => {
                if (!isNaN(oTotals[key])) {
                    oTotals[key] = oTotals[key].toFixed(2);
                }
            });
        
            // Push the totals row to the data array
            aData.push(oTotals);
        
            // Update the model to refresh UI
            oModel.setProperty(sPath, aData);
        
            sap.m.MessageToast.show("Totals calculated and added as a new row!");
        }
        
        
        
        
      
    });
});
