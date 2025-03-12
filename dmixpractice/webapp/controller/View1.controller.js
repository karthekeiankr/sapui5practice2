sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library"
],
function (Controller, Filter, FilterOperator, JSONModel,Spreadsheet,exportLibrary) {
    "use strict";

    return Controller.extend("dmixpractice.controller.View1", {
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

            this._loadPdfMake();
        },

        onAfterRendering: function () {
            this.calculateColumnTotals();
        },

        _loadPdfMake: function () {
            var that = this;

            // Load pdfMake only if it's not already loaded
            if (typeof pdfMake === "undefined") {
                var sPdfMakeUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.72/pdfmake.min.js";
                var sVfsFontsUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.72/vfs_fonts.js";

                jQuery.sap.includeScript(sPdfMakeUrl, "pdfmakeLib", function () {
                    jQuery.sap.includeScript(sVfsFontsUrl, "pdfmakeFonts", function () {
                        console.log("✅ pdfMake is fully loaded.");
                        that.pdfMakeReady = true;  // Mark as ready
                    });
                });
            } else {
                this.pdfMakeReady = true;
                console.log("✅ pdfMake is already loaded.");
            }
        },

        calculateColumnTotals: function () {
            var oTable = this.getView().byId("equipmentcostcentre");

            if (!oTable) {
                console.error("Table not found.");
                return;
            }

            var oBinding = oTable.getBinding("rows");
            if (!oBinding) {
                console.warn("Table binding not found.");
                return;
            }

            var oTotalsModel = this.getView().getModel("totalsModel");
            if (!oTotalsModel) {
                console.warn("totalsModel not found. Creating a new JSON model.");
                oTotalsModel = new JSONModel();
                this.getView().setModel(oTotalsModel, "totalsModel");
            }

            var aData = oBinding.getCurrentContexts().map((oContext) => oContext.getObject());
            if (!aData || aData.length === 0) {
                console.warn("No data found for total calculation.");
                return;
            }

            var oTotals = {
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

            aData.forEach((item) => {
                Object.keys(oTotals).forEach((key) => {
                    oTotals[key] += parseFloat(item[key]) || 0;
                });
            });

            Object.keys(oTotals).forEach((key) => {
                oTotals[key] = oTotals[key].toFixed(2);
            });

            oTotalsModel.setData(oTotals);
            console.log("Totals calculated:", oTotals);

           
        },
      
 
        // f4 help for the Company code filter
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
            var sCustomer = oView.byId("costcentreItem");
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
      
        downloadExcels: function () {
            var oTable = this.byId("equipmentcostcentre");
            var oBinding = oTable.getBinding("rows");
        
            if (!oBinding) {
                sap.m.MessageBox.error("No data available to export.");
                return;
            }
        
            var aContexts = oBinding.getContexts();
            var aData = [];
        
            // Extract table data
            aContexts.forEach(function (oContext) {
                aData.push(oContext.getObject());
            });
        
            // Fetch the total row data from table ID = totalmodels
            var oTotalTable = this.byId("totalsTable");
            var oTotalContext = oTotalTable.getBinding("rows").getContexts();
            var oTotalRow = oTotalContext.length ? oTotalContext[0].getObject() : null;
        
            if (oTotalRow) {
                // Ensure first column says "TOTAL"
                oTotalRow.CostCentre = "TOTAL";
                aData.push(oTotalRow); // Append total row to the data
            }
        
            // Define columns
            var aColumns = [
                { label: "Cost Centre", property: "CostCentre", type: exportLibrary.EdmType.String },
                { label: "Cost Centre Description", property: "CostCentreDescription", type: exportLibrary.EdmType.String },
                { label: "Diesel Amount", property: "DieselAmount", type: exportLibrary.EdmType.Number, scale: 2 },
                { label: "GLNQTY", property: "GLNQTY", type: exportLibrary.EdmType.Number },
                { label: "KMQTY", property: "KMQTY", type: exportLibrary.EdmType.Number },
                { label: "Tyre Amount", property: "TyreAmount", type: exportLibrary.EdmType.Number, scale: 2 },
                { label: "Maintenance Amount", property: "MaintenanceAmount", type: exportLibrary.EdmType.Number, scale: 2 },
                { label: "Salary Amount", property: "SalaryAmount", type: exportLibrary.EdmType.Number, scale: 2 },
                { label: "Fees Amount", property: "FeesAmount", type: exportLibrary.EdmType.Number, scale: 2 },
                { label: "Insurance Amount", property: "InsuranceAmount", type: exportLibrary.EdmType.Number, scale: 2 },
                { label: "Other Amount", property: "OtherAmount", type: exportLibrary.EdmType.Number, scale: 2 },
                { label: "CUBMTR", property: "CUBMTR", type: exportLibrary.EdmType.String },
                { label: "Diesel Per KM", property: "DieselPerKM", type: exportLibrary.EdmType.Number, scale: 2 },
                { label: "Tyre Per KM", property: "TyrePerKM", type: exportLibrary.EdmType.Number, scale: 2 },
                { label: "Maintenance Per KM", property: "MaintenancePerKM", type: exportLibrary.EdmType.Number, scale: 2 },
                { label: "Salary Per KM", property: "SalaryPerKM", type: exportLibrary.EdmType.Number, scale: 2 },
                { label: "Fees Per KM", property: "FeesPerKM", type: exportLibrary.EdmType.Number, scale: 2 },
                { label: "Insurance Per KM", property: "InsurancePerKM", type: exportLibrary.EdmType.Number, scale: 2 },
                { label: "Others Per KM", property: "OthersPerKM", type: exportLibrary.EdmType.Number, scale: 2 },
                { label: "Total Cost Per KM", property: "TotalCostPerKM", type: exportLibrary.EdmType.String },
                { label: "TRIPS", property: "TRIPS", type: exportLibrary.EdmType.Number },
                { label: "Average Per Load", property: "AveragePerLoad", type: exportLibrary.EdmType.Number }
            ];
        
            var oSettings = {
                workbook: { 
                    columns: aColumns,
                    hierarchyLevel: "None",
                    context: { sheets: [{ autoFilter: false }] }
                },
                dataSource: aData,
                fileName: "Equipment_Cost_Centre.xlsx"
            };
        
            var oSpreadsheet = new Spreadsheet(oSettings);
            oSpreadsheet.build().then(function () {
                sap.m.MessageToast.show("Excel export completed successfully!");
            }).catch(function (oError) {
                sap.m.MessageBox.error("Error during Excel export: " + oError.message);
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
        
        exportToExcels: function () {
            var oTable = this.getView().byId("equipmentcostcentre"); // Ensure correct ID
        
            if (!oTable) {
                console.error("Table not found!");
                sap.m.MessageToast.show("Table not found!");
                return;
            }
        
            var oBinding = oTable.getBinding("items"); // Use "rows" if using sap.ui.table.Table
            if (!oBinding) {
                console.error("Table binding is missing");
                sap.m.MessageToast.show("No data to export!");
                return;
            }
        
            var aContexts = oBinding.getContexts();
            if (!aContexts || aContexts.length === 0) {
                console.warn("No data available for export.");
                sap.m.MessageToast.show("No data available!");
                return;
            }
        
            var aData = aContexts.map(oContext => oContext.getObject());
        
            if (aData.length === 0) {
                console.warn("Extracted data is empty.");
                sap.m.MessageToast.show("No data extracted!");
                return;
            }
        
            // Extract headers
            var aColumns = oTable.getColumns().map(oColumn => oColumn.getHeader().getText());
        
            // Convert data to array
            var aExportData = aData.map(row => aColumns.map(col => row[col] || ""));
        
            // Add headers to the first row
            aExportData.unshift(aColumns);
        
            var ws = XLSX.utils.aoa_to_sheet(aExportData);
            var wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Export");
        
            XLSX.writeFile(wb, "ExportedData.xlsx");
        
            sap.m.MessageToast.show("Excel downloaded successfully!");
        },
        // exportToExcel: function () {
        //     var oTable = this.byId("equipmentcostcentre"); // Main Table
        //     var oTotalsTable = this.byId("totalsTable"); // Totals Table
        
        //     var aColumns = [];
        //     var aData = [];
        
        //     // Extract column headers
        //     var aTableColumns = oTable.getColumns();
        //     aTableColumns.forEach(function (oColumn) {
        //         var sColumnHeader = oColumn.getLabel().getText();
        //         aColumns.push(sColumnHeader);
        //     });
        
        //     // Extract all rows from the table model
        //     var oBinding = oTable.getBinding("rows"); 
        //     if (!oBinding) {
        //         sap.m.MessageToast.show("No data found in the table!");
        //         return;
        //     }
        
        //     var oModel = oBinding.getModel();
        //     var sPath = oBinding.getPath();
        //     var aTableRows = oModel.getProperty(sPath);
        
        //     if (!aTableRows || aTableRows.length === 0) {
        //         sap.m.MessageToast.show("No data available to export!");
        //         return;
        //     }
        
        //     aTableRows.forEach(function (oRowData) {
        //         var aRow = [];
        //         aTableColumns.forEach(function (oColumn) {
        //             var oTemplate = oColumn.getTemplate();
        //             if (oTemplate && oTemplate.getBindingInfo("text")) {
        //                 var sPath = oTemplate.getBindingInfo("text").parts[0].path;
        //                 aRow.push(oRowData[sPath] || ""); // Avoid undefined values
        //             } else {
        //                 aRow.push("");
        //             }
        //         });
        //         aData.push(aRow);
        //     });
        
        //     // Add totals row separator
        //     aData.push([]);
        //     aData.push(["TOTALS"]);
        
        //     // Extract totals table data (Only if totalsTable is available)
        //     if (oTotalsTable) {
        //         var aTotalRowData = oTotalsTable.getItems()[0].getCells();
        //         var aTotalValues = [];
        
        //         aTotalRowData.forEach(function (oCell) {
        //             aTotalValues.push(oCell.getText());
        //         });
        
        //         aData.push(aTotalValues);
        //     }
        
        //     // Create a worksheet
        //     var ws = XLSX.utils.aoa_to_sheet([aColumns, ...aData]);
        
        //     // Create a workbook and add the worksheet
        //     var wb = XLSX.utils.book_new();
        //     XLSX.utils.book_append_sheet(wb, ws, "Cost Centre Data");
        
        //     // Save the file
        //     XLSX.writeFile(wb, "CostCentreData.xlsx");
            
        //     sap.m.MessageToast.show("Export successful!");
        // }

        exportToExcel: function () {
            var oTable = this.byId("equipmentcostcentre");
        
            if (!oTable) {
                sap.m.MessageToast.show("Table not found!");
                return;
            }
        
            var aColumns = [];
            var aData = [];
        
            // Get Column Headers
            var aTableColumns = oTable.getColumns();
            aTableColumns.forEach(function (oColumn) {
                var sColumnHeader = oColumn.getLabel().getText();
                aColumns.push(sColumnHeader);
            });
        
            // Get Visible Table Rows
            var aRows = oTable.getRows();
            aRows.forEach(function (oRow) {
                var aRowData = [];
                var aCells = oRow.getCells();
        
                aCells.forEach(function (oCell) {
                    if (oCell.getText) {
                        aRowData.push(oCell.getText()); // For sap.m.Text
                    } else if (oCell.getValue) {
                        aRowData.push(oCell.getValue()); // For sap.m.Input
                    } else {
                        aRowData.push(""); // Fallback
                    }
                });
        
                aData.push(aRowData);
            });
        
            // Check if there is data to export
            if (aData.length === 0) {
                sap.m.MessageToast.show("No data available to export!");
                return;
            }
        
            // Create and export Excel file
            var ws = XLSX.utils.aoa_to_sheet([aColumns, ...aData]);
            var wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Table Data");
            XLSX.writeFile(wb, "TableData.xlsx");
        
            sap.m.MessageToast.show("Export successful!");
        }
        
        
        
        
        
      
      
    });
});
