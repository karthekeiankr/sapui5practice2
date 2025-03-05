sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function(Controller, Filter, FilterOperator) {

    return Controller.extend("project4.controller.View1", {
        onInit() {
            
                // var oModel = new sap.ui.model.odata.v4.ODataModel({
                //     serviceUrl: "https://services.odata.org/V4/Northwind/Northwind.svc/",
                //     synchronizationMode: "None"
                // });
                // this.getView().setModel(oModel);
             
                var oTable = this.getView().byId("table"); // Get the sap.m.Table
                if (oTable) {
                    // Attach updateFinished event to recalculate the total when data changes
                    oTable.attachUpdateFinished(this._calculateTotal.bind(this));
                } else {
                    console.error("Table not found.");
                }
                
                // Create a JSON Model to store total value
                var oTotalModel = new sap.ui.model.json.JSONModel({ total: 0 });
                this.getView().setModel(oTotalModel, "totalModel");
                
                // var i18nModel = new sap.ui.model.resource.ResourceModel({
                //     bundleUrl: "i18n/i18n.properties"
                // });
                // this.getView().setModel(i18nModel, "i18n");
            
                // // Fetch text after setting model
                // var Pepo = this.getView().getModel("i18n").getResourceBundle().getText("PEPO");
                // console.log(Pepo);

                var oView = this.getView();

            
              
    // Create i18n Resource Model with correct bundle name
    var i18nModel = new sap.ui.model.resource.ResourceModel({
        bundleName: "project4.i18n.i18n" // Ensure your namespace is correct
    });
    oView.setModel(i18nModel, "i18n");

    // Fetch text after setting the model
    var oBundle = i18nModel.getResourceBundle();
    if (oBundle) {
        var Pipo = oBundle.getText("PIPO");
        console.log("PIPO Text:", Pipo);
    } else {
        console.error("i18n ResourceBundle could not be loaded!");
    }
        },
        onSearch: function () {
            var oTable = this.getView().byId("table"); // Get Table
            var oBinding = oTable.getBinding("items"); // Get Binding
            var aFilters = [];
        
            // Get input values for ID and Name
            var sId = this.getView().byId("searchId").getValue().trim();
            var sName = this.getView().byId("searchName").getValue().trim();
        
            // Get Date Range Selection
            var oDateRange = this.getView().byId("searchDateRange");
            var oStartDate = oDateRange.getDateValue(); // Start Date
            var oEndDate = oDateRange.getSecondDateValue(); // End Date
        
            // Format Dates as 'YYYY-MM-DD'
            var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
            var sFormattedStartDate = oStartDate ? oDateFormat.format(oStartDate) : null;
            var sFormattedEndDate = oEndDate ? oDateFormat.format(oEndDate) : null;
            
            // Apply Filters
            if (sId) {
                aFilters.push(new sap.ui.model.Filter("id", sap.ui.model.FilterOperator.EQ, sId));
            }
            if (sName) {
                aFilters.push(new sap.ui.model.Filter("name", sap.ui.model.FilterOperator.Contains, sName));
            }
            if (sFormattedStartDate && sFormattedEndDate) {
                aFilters.push(new sap.ui.model.Filter("date", sap.ui.model.FilterOperator.BT, sFormattedStartDate, sFormattedEndDate));
            } else if (sFormattedStartDate) {
                aFilters.push(new sap.ui.model.Filter("date", sap.ui.model.FilterOperator.GE, sFormattedStartDate));
            } else if (sFormattedEndDate) {
                aFilters.push(new sap.ui.model.Filter("date", sap.ui.model.FilterOperator.LE, sFormattedEndDate));
            }
        
            // Apply Filter to Table
            oBinding.filter(aFilters);
            this.onUpdate();
        },
        _calculateTotal: function () {
            var oTable = this.getView().byId("table");
        
            if (!oTable) {
                console.error("Table not found inside SmartTable.");
                return;
            }
        
            var oBinding = oTable.getBinding("items");
            if (!oBinding) {
                console.warn("Table binding not found.");
                return;
            }
        
            var aContexts = oBinding.getCurrentContexts();
            var total = 0;
        
            // Calculate the total for the "balance" column
            aContexts.forEach(function (oContext) {
                if (oContext && oContext.getObject()) {
                    total += parseFloat(oContext.getObject().balance || 0);
                }
            });
        
            // Convert total amount to words
            var totalInWords = this._convertNumberToWords(total);
        
            // Format total with words
            var formattedTotal = "Total Amount: $" + total.toFixed(2) + " (" + totalInWords + ")";
        
            // Update the total in the model
            var oTotalModel = this.getView().getModel("totalModel");
            oTotalModel.setProperty("/total", formattedTotal);
        
            console.log("Updated Total:", formattedTotal); // Debugging
        },
        
        /**
         * Convert number to words (Supports up to billions)
         */
        _convertNumberToWords: function (num) {
            if (num === 0) return "Zero";
        
            var aUnits = ["", "Thousand", "Million", "Billion"];
            var aOnes = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
            var aTeens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
            var aTens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
        
            function convertThreeDigit(n) {
                var str = "";
                if (n >= 100) {
                    str += aOnes[Math.floor(n / 100)] + " Hundred ";
                    n %= 100;
                }
                if (n >= 10 && n <= 19) {
                    str += aTeens[n - 10] + " ";
                } else if (n >= 20) {
                    str += aTens[Math.floor(n / 10)] + " ";
                    if (n % 10) str += aOnes[n % 10] + " ";
                } else if (n > 0) {
                    str += aOnes[n] + " ";
                }
                return str.trim();
            }
        
            var words = "";
            var unitIndex = 0;
        
            while (num > 0) {
                var part = num % 1000;
                if (part > 0) {
                    words = convertThreeDigit(part) + " " + aUnits[unitIndex] + " " + words;
                }
                num = Math.floor(num / 1000);
                unitIndex++;
            }
        
            return words.trim();
        },
        
        
        downloadpdf: function () {
            console.log("Generating PDF...");
        
            var that = this;
            var sHeaderImagePath = sap.ui.require.toUrl("project4/utils/headerimage.txt"); // First logo
            var sFooterImagePath = sap.ui.require.toUrl("project4/utils/footerimage.txt"); // Second logo
            var  sContentImage   = sap.ui.require.toUrl("project4/utils/content.txt");
        
            // Fetch both Base64 images dynamically
            Promise.all([
                fetch(sHeaderImagePath).then(response => response.text()),
                fetch(sFooterImagePath).then(response => response.text()),
                fetch(sContentImage).then(response => response.text())
            ])
            .then(([base64HeaderImage, base64FooterImage,base64ContentImage]) => {
                that.generatePDF(base64HeaderImage, base64FooterImage, base64ContentImage);
            })
            .catch(error => {
                console.error("Error loading Base64 images:", error);
            });
        },
        
        generatePDF: function (base64HeaderImage, base64FooterImage,base64ContentImage) {
            var oTable = this.byId("table"); // Get the table control
            var aItems = oTable.getItems(); // Get table rows
            var cal_val = this.getView().byId("totalValue").getText();
        
            // Extract dynamic data from the table
            var rows = [];
            aItems.forEach(function (oItem) {
                var oContext = oItem.getBindingContext("data"); // Use "data" model name explicitly
                if (oContext) {
                    var oData = oContext.getObject(); // Extract JSON data from the model
                    rows.push([
                        oData.id || "",   
                        oData.name || "",
                        oData.date || "",
                        oData.debit || "",
                        oData.credit || "",
                        oData.balance || ""
                    ]);
                }
            });
        
        
            if (rows.length === 0) {
                console.warn("No data available in the table.");
                sap.m.MessageToast.show("No data available to download!");
                return;
            }
        
            var docDefinition = {
                content: [
                    // **Header Logo**
                    {
                        image: base64HeaderImage,
                        width: 100,
                        alignment: "left",
                        margin: [40, 10, 0, 20]
                    },
                    // **Title**
                    {
                        text: "Accounts Information",
                        style: "header",
                        alignment: "center",
                        margin: [0, 20, 0, 10]
                    },
                    // **Dynamically Generated Table**
                    {
                        table: {
                            headerRows: 1,
                            widths: ["*", "*", "*", "*", "*","*"],
                            body: [
                                [{ text: "ID", bold: true }, 
                                 { text: "NAME", bold: true }, 
                                 { text: "DATE", bold: true }, 
                                 { text: "DEBIT", bold: true }, 
                                 { text: "CREDIT", bold: true }, 
                                 { text: "BALANCE", bold: true }],
                                ...rows
                            ]
                        },
                        layout: "lightHorizontalLines",
                       
                    },
                    // **Footer Notice**
                    {
                        text: "The total value of the account balance is " + cal_val,
                        alignment: "center",
                        margin: [0, 20, 0, 10],
                        fontSize: 10,
                        bold: true
                    }
                ],
                footer: function () {
                    return {
                        margin: [40, -10, 40, 10],
                        table: {
                            alignment: "center",  // Center-align the footer table
                            widths: ["30%", "40%", "30%"],
                            body: [
                                [
                                    { image: base64ContentImage, width: 100, alignment: "left", border: [0, 0, 0, 0] },
                                    { image: base64FooterImage, width: 100, alignment: "right", border: [0, 0, 0, 0] }
                                ]
                            ]
                        },
                        layout: "noBorders"
                    };
                },
                styles: {
                    header: {
                        fontSize: 16,
                        bold: true
                    }
                }
   
            
            };
        
            pdfMake.createPdf(docDefinition).download("Accounts_Report.pdf");
        },
        onUpdate: function () {
            var oTable = this.getView().byId("table"); // Get table reference
            var aItems = oTable.getItems(); // Get all rows
        
            if (aItems.length === 0) {
                sap.m.MessageToast.show("No data available in the table.");
                return;
            }
        
            var iPrevious = 0; // To store previous row's phone value
        
            aItems.forEach(function (oItem, index) {
                var aCells = oItem.getCells(); // Get all cells in the row
                var iDebit = parseInt(aCells[3].getText().replace(/,/g, ""), 10) || 0;  // Role value, remove commas
                var iCredit = parseInt(aCells[4].getText().replace(/,/g, ""), 10) || 0; // Skills value, remove commas
                var iUpdatedPhone;
        
                if (index === 0) {
                    // First row: Phone = Role + Skills
                    iUpdated =  iCredit - iDebit;
                } else {
                    // Subsequent rows: Phone = PreviousRowPhone + Skills - Role
                    iUpdated = iPrevious - iDebit + iCredit;
                }
        
                // Update the Phone column dynamically
                aCells[5].setText(iUpdated);
        
                // Store the current row's phone value for the next row
                iPrevious = iUpdated;
            });
        
            sap.m.MessageToast.show("Balance updated");
        }
        
        
    });
});