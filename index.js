// Import stylesheets
import "./style.css";
// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from "firebase/app";

// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/firestore";

import * as firebaseui from "firebaseui";

// Document elements
const startRsvpButton = document.getElementById("startRsvp");
const guestbookContainer = document.getElementById("guestbook-container");

const form = document.getElementById("leave-message");
const input = document.getElementById("message");
const guestbook = document.getElementById("guestbook");
const numberAttending = document.getElementById("number-attending");
const rsvpYes = document.getElementById("rsvp-yes");
const rsvpNo = document.getElementById("rsvp-no");

var rsvpListener = null;
var guestbookListener = null;

async function main() {
  // Add Firebase project configuration object here
  // var firebaseConfig = {};
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  var firebaseConfig = {
    apiKey: "AIzaSyCs4WnpQgTChQvEN4EL_H6t4cVKXZ3Mvp0",
    authDomain: "fir-web-codelab-9a3a7.firebaseapp.com",
    databaseURL: "https://fir-web-codelab-9a3a7.firebaseio.com",
    projectId: "fir-web-codelab-9a3a7",
    storageBucket: "fir-web-codelab-9a3a7.appspot.com",
    messagingSenderId: "492914648544",
    appId: "1:492914648544:web:851dee29a6191ac369f785",
    measurementId: "G-VL68WRJGH3"
  };

  firebase.initializeApp(firebaseConfig);

  // FirebaseUI config
  const uiConfig = {
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
      // Email / Password Provider.
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    callbacks: {
      signInSuccessWithAuthResult: function(authResult, redirectUrl) {
        // Handle sign-in.
        // Return false to avoid redirect.
        return false;
      }
    }
  };

  startRsvpButton.addEventListener("click", () => {
    ui.start("#firebaseui-auth-container", uiConfig);
  });

  // Listen to the form submission
  form.addEventListener("submit", e => {
    // Prevent the default form redirect
    e.preventDefault(); // Write a new message to the database collection "guestbook"
    firebase
      .firestore()
      .collection("guestbook")
      .add({
        text: input.value,
        timestamp: Date.now(),
        name: firebase.auth().currentUser.displayName,
        userId: firebase.auth().currentUser.uid
      });
    // clear message input field
    input.value = "";
    // Return false to avoid redirect
    return false;
  });

  // Listen to the current Auth state
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      startRsvpButton.textContent = "LOGOUT"; // Show guestbook to logged-in users
      guestbookContainer.style.display = "block"; // Subscribe to the guestbook collection
      subscribeGuestbook(); // Subscribe to the guestbook collection   
      subscribeCurrentRSVP(user); // Subscribe to the guestbook collection
    } else {
      startRsvpButton.textContent = "RSVP"; // Hide guestbook for non-logged-in users
      guestbookContainer.style.display = "none"; // Unsubscribe from the guestbook collection
      unsubscribeGuestbook();  // Unsubscribe from the guestbook collection
      unsubscribeCurrentRSVP(); // Unsubscribe from the guestbook collection
    }
  });

  // Create query for messages
  firebase
    .firestore()
    .collection("guestbook")
    .orderBy("timestamp", "desc")
    .onSnapshot(snaps => {
      // Reset page guestbook.innerHTML = "";
      // Loop through documents in database
      snaps.forEach(doc => {
        // Create an HTML entry for each document and add it to the chat
        const entry = document.createElement("p");
        entry.textContent = doc.data().name + ": " + doc.data().text;
        guestbook.appendChild(entry);
      });
    });

  // Listen to guestbook updates
  function subscribeGuestbook() {
    // Create query for messages
    guestbookListener = firebase
      .firestore()
      .collection("guestbook")
      .orderBy("timestamp", "desc")
      .onSnapshot(snaps => {
        // Reset page
        guestbook.innerHTML = "";
        //Loop through documents in database
        snaps.forEach(doc => {
          // Create an HTML entry for each document and add it to the chat
          const entry = document.createElement("p");
          entry.textContent = doc.data().name + ": " + doc.data().text;
          guestbook.appendChild(entry);
        });
      });
  }

  // Unsubscribe from guestbook updates
  function unsubscribeGuestbook() {
    if (guestbookListener != null) {
      guestbookListener();
      guestbookListener = null;
    }
  }


  // Listen to RSVP responses
  rsvpYes.onclick = () => {
     // Get a reference to the user's document in the attendees collection
     const userDoc = firebase.firestore().collection('attendees').doc(firebase.auth().currentUser.uid);
     // If they RSVP'd yes, save a document with attending: true
     userDoc.set({
         attending: true
    }).catch(console.error)
  }

  rsvpNo.onclick = () => {
     // Get a reference to the user's document in the attendees collection
     const userDoc = firebase.firestore().collection('attendees').doc(firebase.auth().currentUser.uid);
     // If they RSVP'd no, save a document with attending: false
     userDoc.set({
         attending: false
     }).catch(console.error)
  }

  // Listen for attendee list
  firebase.firestore()
  .collection('attendees')
  .where("attending", "==", true)
  .onSnapshot(snap => {
     const newAttendeeCount = snap.docs.length;
     numberAttending.innerHTML = newAttendeeCount+' people going'; 
  })


  // Listen for attendee list
  function subscribeCurrentRSVP(user){
     rsvpListener = firebase.firestore()
     .collection('attendees')
     .doc(user.uid)
     .onSnapshot((doc) => {
         if (doc && doc.data()){
             const attendingResponse = doc.data().attending;
             // Update css classes for buttons
             if (attendingResponse){
                 rsvpYes.className="clicked";
                 rsvpNo.className="";
               }
               else{
                   rsvpYes.className="";
                   rsvpNo.className="clicked";
                 }
          }
      });
    }

    function unsubscribeCurrentRSVP(){
       if (rsvpListener != null)
       {
           rsvpListener();
           rsvpListener = null;
       }
         rsvpYes.className="";
         rsvpNo.className="";
    }


  const ui = new firebaseui.auth.AuthUI(firebase.auth());
}
main();
