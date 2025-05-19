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
    // Check if qrToken exists and has not expired
    const qrToken = localStorage.getItem("qrToken");
    const tokenExpiry = localStorage.getItem("tokenExpiry");
    const currentTime = new Date().getTime();

      showQrScanner();

    // Login button event
        const username = "microservice@smartlogisticsinc.com.fullcopy";
        const password = "xEOqcG38kzmuqXfdee0WYyS1in1fJmsF0kxW";

        // Make POST request to get the token from proxy server
        
            getAccessToken(username, password);
    });

// Show login form
function showLoginForm() {
    document.getElementById("login-section").style.display = "block";
    document.getElementById("qr-section").style.display = "none";
}

// Show QR Scanner
function showQrScanner() {
    document.getElementById("qr-section").style.display = "block";

    // QR scanner logic (same as before)
    function onScanSuccess(decodeText, decodeResult) {
        const deviceId = decodeText.split(',')[0];
        fetchDataFromApex(deviceId);
    }

    let htmlscanner = new Html5QrcodeScanner(
        "my-qr-reader",
        { fps: 10, qrbox: 250 }
    );
    htmlscanner.render(onScanSuccess);
}

// Function to make a POST request to proxy server to get the OAuth token
function getAccessToken(username, password) {
   // const url = 'http://localhost:3000/get-token';  // Proxy server URL
   const url = 'https://test.salesforce.com/services/oauth2/token?grant_type=password&client_id=3MVG9xfrbKQ6hBytnC5pEE29nNvV2.GaJNKRVgGTanftKWrLeSbvXqzNBXcLGI0uWpAH1YAM6AnOSFK.LEOn8&client_secret=C9D17FF8ADC717AAC65F0FEE4AF3732F6B4D472B756C1DF7A02C26AF292083B5&username=microservice@smartlogisticsinc.com.fullcopy&password=xEOqcG38kzmuqXfdee0WYyS1in1fJmsF0kxW';

    // Send the username and password to proxy server
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.data)
    .then(data => {
        if (data.access_token) {
            // Save token and expiry time in localStorage
            localStorage.setItem("qrToken", data.access_token);
            showQrScanner();  // Show the QR scanner after successful login
        } else {
            alert("Failed to authenticate. Please check your credentials.");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("An error occurred while trying to authenticate.");
    });
}

// Fetch data from Apex class using deviceId and display it
function fetchDataFromApex(deviceId) {
    const endpoint = `https://smartlogisticsinc--fullcopy.sandbox.my.salesforce-sites.com/services/apexrest/qrScanner/?deviceId=${deviceId}`;
    const qrToken = localStorage.getItem("qrToken");

    fetch(endpoint, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + qrToken
        }
    })
    .then(response => response.json())
    .then(data => {
        displayData(data);
    })
    .catch(error => {
        console.error("Error:", error);
    });
}

// Display fetched data on the screen
function displayData(data) {
  const dataContainer = document.getElementById("my-qr-reader");
  if (data.length > 0) {
    const device = data[0];
    const utcDate = new Date(device.Last_Connected__c);

    // Convert to CST/CDT (Central Time - auto handles DST)
    const options = {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(utcDate);

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
    dataContainer.innerHTML = "<p class='no-data'>No data found for the scanned device.</p>";
  }
}