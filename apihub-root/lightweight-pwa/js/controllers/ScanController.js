import {convertFromISOtoYYYY_HM, goToErrorPage, goToPage, validateGTIN} from "../utils/utils.js";
import interpretGS1scan from "../utils/interpretGS1scan/interpretGS1scan.js";
import ScanService from "../services/ScanService.js";
import {getTranslation} from "../translations.js";
import constants from "../constants.js";

function ScanController() {
  this.init = async function (forceNewCamera) {
    let placeHolderElement = document.querySelector("#scanner-placeholder");
    if(!forceNewCamera){
      this.scanService = new ScanService(placeHolderElement);
    }
    try {
      await this.scanService.setup(forceNewCamera);
    } catch (err) {
      this.redirectToError(err);
    }
    await this.startScanning();
  }

  this.closeModal = function (modalId) {
    document.querySelector("#" + modalId).setAttribute('style', 'display:none !important');
  }

  this.redirectToError = function (err) {
    console.log("Error on scanService ", err);
    let modal = document.querySelector("#scan-error")
    if (err.scanResult) {
      modal.querySelector(".modal-title").innerHTML = getTranslation("scan_parse_error");
      modal.querySelector(".modal-content").innerHTML = `<div>${getTranslation("scan_parse_error_message")}  ${err.scanResult}</div>`;
    }
    modal.setAttribute('style', 'display:flex !important');
    //  goToPage("error.html")
  }

  this.cancelHandler = function () {
    goToPage("/index.html");
  }

  this.startScanning = async function () {
    let scanResult = null;
    this.scanInterval = setInterval(() => {
      this.scanService.scan().then(result => {
        if (!result) {
          return;
        }
        console.log("Scan result:", result);
        this.scanService.stop();
        clearInterval(this.scanInterval);
        scanResult = result.text;
        this.processGS1Fields(scanResult)
      }).catch(err => {
        err.scanResult = scanResult;
        this.redirectToError(err);
        console.log("Caught", err);
      });
    }, 100);
  }

  this.parseGS1Code = function (scannedBarcode) {
    let gs1FormatFields;
    try {
      gs1FormatFields = interpretGS1scan.interpretScan(scannedBarcode);
    } catch (e) {
      throw e;
      return;
    }

    return this.parseGs1Fields(gs1FormatFields.ol);
  }

  this.parseGs1Fields = function (orderedList) {
    const gs1Fields = {};
    const fieldsConfig = {
      "GTIN": "gtin",
      "BATCH/LOT": "batchNumber",
      "SERIAL": "serialNumber",
      "USE BY OR EXPIRY": "expiry"
    };

    orderedList.map(el => {
      let fieldName = fieldsConfig[el.label];
      gs1Fields[fieldName] = el.value;
    })

    if (gs1Fields.expiry) {
      try {
        gs1Fields.expiry = convertFromISOtoYYYY_HM(gs1Fields.expiry);
      } catch (e) {
        gs1Fields.expiry = null;
      }

    }

    return gs1Fields;
  }

  this.processGS1Fields = function (scanResultText) {
    let gs1Fields = null;
    try {
      gs1Fields = this.parseGS1Code(scanResultText);
      goToPage(`/leaflet.html?gtin=${gs1Fields.gtin}&batch=${gs1Fields.batchNumber}&expiry=${gs1Fields.expiry}`);
    } catch (err) {
      if (err.message) {
        if (err.message.includes("INVALID CHECK DIGIT:")) {
          goToErrorPage(constants.errorCodes.gtin_wrong_digit);
          return;
        }
        if (err.message.includes("SYNTAX ERROR:")) {
          goToErrorPage(constants.errorCodes.gtin_wrong_chars);
          return;
        }
      }
      goToErrorPage(constants.errorCodes.unknown_error);
    }
  }

  this.switchCamera = function () {
    //this.scanService.stop();
    clearInterval(this.scanInterval);
    scanController.init(true);
  }
}

const scanController = new ScanController();
scanController.init();

window.scanController = scanController;
