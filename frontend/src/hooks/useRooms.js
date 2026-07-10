import { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export function useRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const colRef = collection(db, 'rooms');
    const q = query(colRef, orderBy('roomName', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const roomsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setRooms(roomsList);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore onSnapshot error (rooms):", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { rooms, loading, error };
}
