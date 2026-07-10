import { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const colRef = collection(db, 'alerts');
    // Order by timestamp desc so that the newest alarms appear first
    const q = query(colRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const alertsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setAlerts(alertsList);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore onSnapshot error (alerts):", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { alerts, loading, error };
}
