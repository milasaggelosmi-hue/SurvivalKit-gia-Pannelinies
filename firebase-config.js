const firebaseConfig = {
    apiKey: "AIzaSyCNwavQ0fxKDks-jU6jtnx2iqB6viQBLbM",
    authDomain: "testhistory1-e9c4a.firebaseapp.com",
    projectId: "testhistory1-e9c4a",
    storageBucket: "testhistory1-e9c4a.firebasestorage.app",
    messagingSenderId: "244478364055",
    appId: "1:244478364055:web:1382b3f81ee54618a71cd2",
    measurementId: "G-EXVRRQMJBN",
    // We add databaseURL to be safe, assuming default naming convention. 
    // They usually have `-default-rtdb.firebaseio.com` or `europe-west1.firebasedatabase.app`
    // The Firebase JS SDK handles it automatically in v8 if it's the default, but explicitly setting helps.
    databaseURL: "https://testhistory1-e9c4a-default-rtdb.firebaseio.com"
  };
  
// Αρχικοποίηση Firebase
try {
    firebase.initializeApp(firebaseConfig);
    var db = firebase.database();
} catch (e) {
    console.warn("Δεν έχει ρυθμιστεί σωστά το Firebase ακόμα.", e);
}
