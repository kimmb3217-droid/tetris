// firebase-service.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDdZ4HgXRFF2B63bDH50vZ16e4wERx9jns",
  authDomain: "tetris-19bb0.firebaseapp.com",
  projectId: "tetris-19bb0",
  storageBucket: "tetris-19bb0.firebasestorage.app",
  messagingSenderId: "808108877562",
  appId: "1:808108877562:web:1bf8170532bb7bd04ecb43",
  measurementId: "G-S8LLNPC4XS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export const firebaseService = {
    auth,
    db,
    user: null,

    // Auth methods
    async loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    },

    async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    },

    onAuthChange(callback) {
        onAuthStateChanged(auth, (user) => {
            this.user = user;
            callback(user);
        });
    },

    // Firestore methods
    async saveHighScore(score) {
        if (!this.user) return;

        try {
            // 1. Save to global high scores collection
            await addDoc(collection(db, "highScores"), {
                uid: this.user.uid,
                displayName: this.user.displayName,
                photoURL: this.user.photoURL,
                score: score,
                timestamp: serverTimestamp()
            });

            // 2. Update user's personal best if higher
            const userRef = doc(db, "users", this.user.uid);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists() || (userSnap.data().bestScore || 0) < score) {
                await setDoc(userRef, {
                    displayName: this.user.displayName,
                    photoURL: this.user.photoURL,
                    bestScore: score,
                    lastUpdated: serverTimestamp()
                }, { merge: true });
            }
        } catch (error) {
            console.error("Error saving score:", error);
        }
    },

    async getLeaderboard(count = 10) {
        try {
            const q = query(collection(db, "highScores"), orderBy("score", "desc"), limit(count));
            const querySnapshot = await getDocs(q);
            const scores = [];
            querySnapshot.forEach((doc) => {
                scores.push(doc.data());
            });
            return scores;
        } catch (error) {
            console.error("Error getting leaderboard:", error);
            return [];
        }
    },

    async getUserBest() {
        if (!this.user) return 0;
        try {
            const userRef = doc(db, "users", this.user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                return userSnap.data().bestScore || 0;
            }
        } catch (error) {
            console.error("Error getting user best:", error);
        }
        return 0;
    }
};
