 
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBF1KUmhto1vRd5XFX33K3oqaTNXhgbpgo",
    authDomain: "gastionprestamos29.firebaseapp.com",
    projectId: "gastionprestamos29",
    storageBucket: "gastionprestamos29.firebasestorage.app",
    messagingSenderId: "326637744049",
    appId: "1:326637744049:web:1e88848f9e4ff7dc879790",
    measurementId: "G-HB1DZQ9S70"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;