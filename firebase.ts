import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * Firebaseコンソールから取得したプロジェクトの構成情報です。
 * この内容は、システムの自動更新によって反映されます。
 */
const firebaseConfig = {
  apiKey: "AIzaSyBBh6tz0moZgu9f346ECjFBAzw_-KSCiTQ",
  authDomain: "the-tamarind-connect.firebaseapp.com",
  projectId: "the-tamarind-connect",
  storageBucket: "the-tamarind-connect.firebasestorage.app",
  messagingSenderId: "936861918762",
  appId: "1:936861918762:web:73c991a8a4449812118553",
  measurementId: "G-XCK1G5KLQX"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy };