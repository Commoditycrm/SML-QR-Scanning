function domReady(fn) {
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    setTimeout(fn, 1000);
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

domReady(function () {
  const qrToken = sessionStorage.getItem("qrToken");
  const tokenExpiry = parseInt(sessionStorage.getItem("tokenExpiry"), 10);
  const currentTime = Date.now();

  if (!qrToken || isNaN(tokenExpiry) || currentTime > tokenExpiry) {
    console.info("Fetching new token from server...");
    getAccessToken();
  } else {
    console.info("Using valid cached token");
    showQrScanner();
  }
});

// Show QR Scanner
function showQrScanner() {
  document.getElementById("qr-section").style.display = "block"; // Show the QR scanner section
  document.getElementById("scan-another-btn").style.display = "none"; // Hide the "Scan Another QR" button initially

  // Create a new scanner instance
  const qrboxSize =
    window.innerWidth > 600 ? 250 : Math.floor(window.innerWidth * 0.9); // 80% of screen width for mobile
  const htmlscanner = new Html5QrcodeScanner("my-qr-reader", {
    fps: 10,
    qrbox: qrboxSize,
    experimentalFeatures: {
    useBarCodeDetectorIfSupported: true
    }
  });

  // QR scanner logic
  function onScanSuccess(decodeText, decodeResult) {
    const deviceId = decodeText.split(",")[0]; // Extract the deviceId from the QR code text
    fetchDataFromApex(deviceId); // Fetch the data from Apex

    // Stop scanning after a successful scan
    setTimeout(() => {
    htmlscanner
      .clear()
      .then(() => {
        document.getElementById("scan-another-btn").style.display = "block";
      })
      .catch((error) => {
        console.warn("Clear failed:", error.message);
        document.getElementById("scan-another-btn").style.display = "block";
      });
    }, 500);
  }

  // Start scanning
  const readerElement = document.getElementById("my-qr-reader");
  if (readerElement) {
  readerElement.innerHTML = ""; // force clean container before render
  }

  htmlscanner.render(onScanSuccess);
}

// Function to make a POST request to proxy server to get the OAuth token
function getAccessToken() {
  const url = "https://sml-qr-scanning-psi.vercel.app/get-token"; // Proxy server URL for getting token

  // Send a POST request to get the access token
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.access_token) {
        // Save token and expiry time in localStorage
        const tokenExpiry = new Date().getTime() + 3600 * 1000; // Set expiry time as 1 hour
        sessionStorage.setItem("qrToken", data.access_token);
        sessionStorage.setItem("tokenExpiry", tokenExpiry);
        showQrScanner(); // Show the QR scanner after successful login
      } else {
        alert("Failed to authenticate. Please check your credentials.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An error occurred while trying to authenticate.");
    });
}

// Fetch data from Apex class using deviceId and display it
function fetchDataFromApex(deviceId) {
  const endpoint = `https://smartlogisticsinc--fullcopy.sandbox.my.salesforce-sites.com/services/apexrest/qrScanner/?deviceId=${deviceId}`;
  const qrToken = sessionStorage.getItem("qrToken");

  fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + qrToken, // Include the token in the request header
    },
  })
    .then((response) => response.json())
    .then((data) => {
      displayData(data); // Display the data retrieved from Apex
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// Display fetched data on the screen
function displayData(data) {
  const dataContainer = document.getElementById("my-qr-reader");
  if (!dataContainer) return;

  if (data.length > 0) {
    const device = data[0];
    const utcDate = new Date(device.Last_Connected__c);

    // Convert UTC time to CST/CDT (Central Time)
    const options = {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };
    const formattedDate = new Intl.DateTimeFormat("en-US", options).format(
      utcDate
    );

    dataContainer.innerHTML = `
      <div class="device-info">
        <h3>Device Information</h3>
        <p><strong>Device ID:</strong> ${device.Name}</p>
        <p><strong>Action Needed:</strong> ${device.Action_Needed__c}</p>
        <p><strong>Battery Voltage:</strong> ${device.Battery_Voltage__c}</p>
        <p><strong>Estimated Battery:</strong> ${device.est_Batterycalculate__c}</p>
        <p><strong>Last Connected (CST/CDT):</strong> ${formattedDate}</p>
      </div>
    `;
  } else {
    dataContainer.innerHTML =
      "<p class='no-data'>No data found for the scanned device.</p>";
  }
}

// Handle "Scan Another QR" button click
document
  .getElementById("scan-another-btn")
  .addEventListener("click", function () {
    // Hide the "Scan Another QR" button and show the QR scanner again
    document.getElementById("scan-another-btn").style.display = "none";
    showQrScanner(); // Show the QR scanner to scan another QR code
  });
