import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  setDoc 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth, db, storage } from './firebase';

export class FirebaseService {
  // Authentication methods
  static async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  static async signUp(email: string, password: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // 사용자 프로필 문서 생성
      await this.createUserProfile(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  static async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  }

  static onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // User Profile Management
  static async createUserProfile(user: User) {
    try {
      const userDoc = {
        email: user.email,
        displayName: user.displayName || '',
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now(),
        profileCompleted: false,
        preferences: {
          language: 'ko',
          notifications: true,
          dataSharing: false
        }
      };
      
      await setDoc(doc(db, 'users', user.uid), userDoc);
      return userDoc;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  static async getUserProfile(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  static async updateUserProfile(userId: string, data: any) {
    try {
      // 먼저 문서가 존재하는지 확인
      const userDoc = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userDoc);
      
      if (!userSnapshot.exists()) {
        // 문서가 없으면 기본 프로필 생성
        const currentUser = auth.currentUser;
        if (currentUser) {
          await this.createUserProfile(currentUser);
        } else {
          // currentUser가 없으면 기본 프로필 생성
          await setDoc(userDoc, {
            email: 'unknown@example.com',
            displayName: '',
            createdAt: Timestamp.now(),
            lastLoginAt: Timestamp.now(),
            profileCompleted: false,
            preferences: {
              language: 'ko',
              notifications: true,
              dataSharing: false
            }
          });
        }
      }
      
      // 이제 문서가 존재하므로 업데이트
      await updateDoc(userDoc, {
        ...data,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Health Reports Management
  static async saveHealthReport(userId: string, reportData: any) {
    try {
      const reportDoc = {
        userId,
        ...reportData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'healthReports'), reportDoc);
      return docRef.id;
    } catch (error) {
      console.error('Error saving health report:', error);
      throw error;
    }
  }

  static async getUserHealthReports(userId: string, limitCount: number = 50) {
    try {
      const q = query(
        collection(db, 'healthReports'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user health reports:', error);
      throw error;
    }
  }

  // Chat History Management
  static async saveChatMessage(userId: string, messageData: any) {
    try {
      const chatDoc = {
        userId,
        ...messageData,
        timestamp: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'chatHistory'), chatDoc);
      return docRef.id;
    } catch (error) {
      console.error('Error saving chat message:', error);
      throw error;
    }
  }

  static async getChatHistory(userId: string, limitCount: number = 100) {
    try {
      const q = query(
        collection(db, 'chatHistory'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  // Device Management
  static async saveDeviceInfo(userId: string, deviceData: any) {
    try {
      const deviceDoc = {
        userId,
        ...deviceData,
        pairedAt: Timestamp.now(),
        lastSyncAt: Timestamp.now()
      };
      
      await setDoc(doc(db, 'devices', deviceData.serialNumber), deviceDoc);
    } catch (error) {
      console.error('Error saving device info:', error);
      throw error;
    }
  }

  static async getUserDevices(userId: string) {
    try {
      const q = query(
        collection(db, 'devices'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw error;
    }
  }

  // 기존 범용 메서드들...
  static async addDocument(collectionName: string, data: any) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  static async getDocument(collectionName: string, docId: string) {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  static async updateDocument(collectionName: string, docId: string, data: any) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      throw error;
    }
  }

  static async deleteDocument(collectionName: string, docId: string) {
    try {
      await deleteDoc(doc(db, collectionName, docId));
    } catch (error) {
      throw error;
    }
  }

  static async getDocuments(collectionName: string, filters?: any[]) {
    try {
      const collectionRef = collection(db, collectionName);
      
      if (filters && filters.length > 0) {
        const q = query(collectionRef, ...filters);
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else {
        const querySnapshot = await getDocs(collectionRef);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  // Real-time subscriptions
  static subscribeToCollection(collectionName: string, callback: (data: any[]) => void, filters?: any[]) {
    try {
      const collectionRef = collection(db, collectionName);
      const q = filters ? query(collectionRef, ...filters) : collectionRef;
      
      return onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(data);
      });
    } catch (error) {
      console.error('Error subscribing to collection:', error);
      throw error;
    }
  }

  // File upload methods
  static async uploadFile(path: string, file: File) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  static async deleteFile(path: string) {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Measurement Sessions methods
  static async saveMeasurementSession(sessionData: any) {
    try {
      const docRef = await addDoc(collection(db, 'measurementSessions'), {
        ...sessionData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving measurement session:', error);
      throw error;
    }
  }

  static async getMeasurementSessions(filters: any[] = []) {
    try {
      const collectionRef = collection(db, 'measurementSessions');
      let q;
      
      if (filters.length > 0) {
        q = query(collectionRef, ...filters);
      } else {
        // 기본 정렬: 최신순
        q = query(collectionRef, orderBy('createdAt', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        sessionDate: doc.data().sessionDate?.toDate()
      }));
    } catch (error) {
      throw error;
    }
  }

  static async getMeasurementSession(sessionId: string) {
    try {
      const docRef = doc(db, 'measurementSessions', sessionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          sessionDate: data.sessionDate?.toDate()
        };
      } else {
        throw new Error('Measurement session not found');
      }
    } catch (error) {
      throw error;
    }
  }

  static async updateMeasurementSession(sessionId: string, updateData: any) {
    try {
      const docRef = doc(db, 'measurementSessions', sessionId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      throw error;
    }
  }

  static async deleteMeasurementSession(sessionId: string) {
    try {
      const docRef = doc(db, 'measurementSessions', sessionId);
      await deleteDoc(docRef);
    } catch (error) {
      throw error;
    }
  }

  // Query helper methods
  static createWhereFilter(field: string, operator: any, value: any) {
    return where(field, operator, value);
  }

  static createOrderByFilter(field: string, direction: 'asc' | 'desc' = 'asc') {
    return orderBy(field, direction);
  }

  static createLimitFilter(limitCount: number) {
    return limit(limitCount);
  }
}

export default FirebaseService; 